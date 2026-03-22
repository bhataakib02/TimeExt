/**
 * Tracking Routes
 * POST /api/tracking        — save a session
 * GET  /api/tracking        — get aggregated data
 * GET  /api/tracking/score  — get productivity score
 * GET  /api/tracking/streak — get productive streak
 * GET  /api/tracking/heatmap — get activity heatmap data
 * GET  /api/tracking/hourly — peak hours analysis
 * GET  /api/tracking/stats  — get aggregated dashboard stats
 * DELETE /api/tracking      — clear all data
 */

const express = require("express");
const router = express.Router();
const Tracking = require("../models/Tracking");
const Category = require("../models/Category");
const { protect } = require("../middleware/auth");
const { trackingRateLimit } = require("../middleware/rateLimit");
const aiClassifier = require("../services/aiClassifier");

// All tracking routes require authentication
router.use(protect);

// ==================== HELPERS ====================

function getDateRange(range) {
    const now = new Date();
    let start;
    if (range === "today") {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === "week") {
        start = new Date(now);
        start.setDate(now.getDate() - 7);
    } else if (range === "month") {
        start = new Date(now);
        start.setMonth(now.getMonth() - 1);
    } else {
        start = new Date(0);
    }
    return start;
}

// ==================== SAVE SESSION ====================

router.post("/", trackingRateLimit, async (req, res, next) => {
    try {
        const { website, time, pageTitle, scrolls, clicks, content } = req.body;
        if (!website || typeof time !== "number" || time <= 0) {
            return res.status(400).json({ error: "Invalid data: website and positive time required." });
        }


        // Get or determine category via AI
        let catDoc = await Category.findOne({ userId: req.user._id, website });
        let category = "neutral";
        let source = "default";

        if (catDoc && catDoc.source === "user") {
            // Respect user's manual classification
            category = catDoc.category;
            source = "user";
        } else {
            // Use AI classifier
            const aiResult = aiClassifier.classify(website, pageTitle || "", content || "");
            category = aiResult.category;

            source = "ai";

            // Upsert the AI classification (only if not user-set)
            await Category.findOneAndUpdate(
                { userId: req.user._id, website },
                {
                    category: aiResult.category,
                    source: "ai",
                    confidence: aiResult.confidence,
                    tags: aiResult.tags,
                },
                { upsert: true, new: true }
            );
        }

        await Tracking.create({
            userId: req.user._id,
            website,
            pageTitle: pageTitle || "",
            time,
            category,
            categorySource: source,
            scrolls: scrolls || 0,
            clicks: clicks || 0,
            date: new Date(),
        });


        res.json({ success: true, category });
    } catch (err) {
        next(err);
    }
});

// ==================== GET AGGREGATED DATA ====================

router.get("/", async (req, res, next) => {
    try {
        const range = req.query.range || "today";
        const start = getDateRange(range);

        const data = await Tracking.aggregate([
            { $match: { userId: req.user._id, date: { $gte: start } } },
            {
                $group: {
                    _id: "$website",
                    totalTime: { $sum: "$time" },
                    category: { $last: "$category" },
                    sessions: { $sum: 1 },
                },
            },
            { $sort: { totalTime: -1 } },
            { $limit: 50 },
        ]);

        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ==================== PRODUCTIVITY SCORE ====================

router.get("/score", async (req, res, next) => {
    try {
        const range = req.query.range || "today";
        const start = getDateRange(range);

        const data = await Tracking.aggregate([
            { $match: { userId: req.user._id, date: { $gte: start } } },
            {
                $group: {
                    _id: "$category",
                    totalTime: { $sum: "$time" },
                },
            },
        ]);

        let productive = 0, unproductive = 0, neutral = 0;
        data.forEach(({ _id, totalTime }) => {
            if (_id === "productive") productive = totalTime;
            else if (_id === "unproductive") unproductive = totalTime;
            else neutral = totalTime;
        });

        const total = productive + unproductive + neutral;
        // Score formula: productive / (productive + unproductive) * 100
        // Neutral counts as 0.5 weight
        const denominator = productive + unproductive + neutral * 0.5;
        const score = denominator > 0
            ? Math.round((productive / denominator) * 100)
            : 0;

        res.json({ score, productive, unproductive, neutral, total, range });
    } catch (err) {
        next(err);
    }
});

// ==================== AGGREGATED STATS ====================

router.get("/stats", async (req, res, next) => {
    try {
        const range = req.query.range || "today";
        const start = getDateRange(range);

        // 1. Get score and totals
        const data = await Tracking.aggregate([
            { $match: { userId: req.user._id, date: { $gte: start } } },
            {
                $group: {
                    _id: "$category",
                    totalTime: { $sum: "$time" },
                },
            },
        ]);

        let productiveTime = 0, unproductiveTime = 0, neutralTime = 0;
        data.forEach(({ _id, totalTime }) => {
            if (_id === "productive") productiveTime = totalTime;
            else if (_id === "unproductive") unproductiveTime = totalTime;
            else neutralTime = totalTime;
        });

        const totalTime = productiveTime + unproductiveTime + neutralTime;
        const denominator = productiveTime + unproductiveTime + neutralTime * 0.5;
        const score = denominator > 0
            ? Math.round((productiveTime / denominator) * 100)
            : 0;

        // 2. Get streak
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
            const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i + 1);

            const dailyData = await Tracking.aggregate([
                { $match: { userId: req.user._id, date: { $gte: dayStart, $lt: dayEnd } } },
                { $group: { _id: "$category", totalTime: { $sum: "$time" } } },
            ]);

            if (dailyData.length === 0) {
                // If it's not today, and no data, break. If it's today and no data, check yesterday.
                if (i > 0) break;
                else continue;
            }

            const prod = dailyData.find(d => d._id === "productive")?.totalTime || 0;
            const unprod = dailyData.find(d => d._id === "unproductive")?.totalTime || 0;

            if (prod >= unprod) streak++;
            else break;
        }

        // 3. Get peak hour
        const hourlyData = await Tracking.aggregate([
            { $match: { userId: req.user._id, category: "productive", date: { $gte: start } } },
            { $group: { _id: "$hour", total: { $sum: "$time" } } },
            { $sort: { total: -1 } },
            { $limit: 1 }
        ]);
        const peakHour = hourlyData.length > 0 ? hourlyData[0]._id : null;

        res.json({ score, totalTime, productiveTime, unproductiveTime, neutralTime, streak, peakHour });
    } catch (err) {
        next(err);
    }
});

// ==================== STREAK ====================

router.get("/streak", async (req, res, next) => {
    try {
        let streak = 0;
        const today = new Date();

        for (let i = 0; i < 30; i++) {
            const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
            const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i + 1);

            const data = await Tracking.aggregate([
                { $match: { userId: req.user._id, date: { $gte: dayStart, $lt: dayEnd } } },
                { $group: { _id: "$category", totalTime: { $sum: "$time" } } },
            ]);

            if (data.length === 0) break;

            const prodTime = data.find(d => d._id === "productive")?.totalTime || 0;
            const unprodTime = data.find(d => d._id === "unproductive")?.totalTime || 0;

            if (prodTime >= unprodTime) streak++;
            else break;
        }

        res.json({ streak });
    } catch (err) {
        next(err);
    }
});

// ==================== HEATMAP DATA ====================
// Returns daily activity for last 12 weeks (GitHub-style)

router.get("/heatmap", async (req, res, next) => {
    try {
        const weeks = parseInt(req.query.weeks) || 12;
        const start = new Date();
        start.setDate(start.getDate() - weeks * 7);

        const data = await Tracking.aggregate([
            { $match: { userId: req.user._id, date: { $gte: start } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$date" },
                    },
                    totalTime: { $sum: "$time" },
                    productive: {
                        $sum: { $cond: [{ $eq: ["$category", "productive"] }, "$time", 0] },
                    },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ==================== HOURLY BREAKDOWN ====================
// For "peak productivity hours" insight

router.get("/hourly", async (req, res, next) => {
    try {
        const range = req.query.range || "week";
        const start = getDateRange(range);

        const data = await Tracking.aggregate([
            { $match: { userId: req.user._id, date: { $gte: start } } },
            {
                $group: {
                    _id: { hour: "$hour", category: "$category" },
                    totalTime: { $sum: "$time" },
                },
            },
            { $sort: { "_id.hour": 1 } },
        ]);

        // Transform into hours 0-23 with productive/unproductive breakdown
        const hours = Array.from({ length: 24 }, (_, h) => ({
            hour: h,
            productive: 0,
            unproductive: 0,
            neutral: 0,
        }));

        data.forEach(({ _id, totalTime }) => {
            const h = _id.hour;
            if (h !== null && h >= 0 && h < 24) {
                hours[h][_id.category || "neutral"] += totalTime;
            }
        });

        res.json(hours);
    } catch (err) {
        next(err);
    }
});

// ==================== COGNITIVE LOAD ANALYSIS ====================
// Calculates "mental fatigue" based on tracking density (session frequency)
router.get("/cognitive-load", async (req, res, next) => {
    try {
        const now = new Date();
        const start = new Date(now.getTime() - 24 * 60 * 60 * 1000); // last 24h

        // Group into 1-hour chunks
        const data = await Tracking.aggregate([
            { $match: { userId: req.user._id, date: { $gte: start } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$date" },
                        month: { $month: "$date" },
                        day: { $dayOfMonth: "$date" },
                        hour: { $hour: "$date" },
                    },
                    sessionCount: { $sum: 1 },
                    totalTime: { $sum: "$time" },
                },
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } },
        ]);

        // Transform into a 0-10 scale
        // Higher session count = higher context switching = higher load
        const result = data.map(d => {
            const time = new Date(d._id.year, d._id.month - 1, d._id.day, d._id.hour).toISOString();
            const sessionsPerMin = d.sessionCount / (d.totalTime / 60 || 1);
            let loadScore = Math.min(10, Math.max(1, sessionsPerMin * 5));
            if (d.totalTime < 300) loadScore = loadScore * 0.5;
            return { time, loadScore: parseFloat(loadScore.toFixed(1)) };
        });

        if (result.length === 0) {
            for (let i = 5; i >= 0; i--) {
                result.push({
                    time: new Date(now.getTime() - i * 3600000).toISOString(),
                    loadScore: 2.0
                });
            }
        }
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// ==================== DAILY TIMELINE (for charts) ====================

router.get("/daily", async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const start = new Date();
        start.setDate(start.getDate() - days);

        const data = await Tracking.aggregate([
            { $match: { userId: req.user._id, date: { $gte: start } } },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        category: "$category",
                    },
                    totalTime: { $sum: "$time" },
                },
            },
            { $sort: { "_id.date": 1 } },
        ]);

        res.json(data);
    } catch (err) {
        next(err);
    }
});

// ==================== CLEAR ALL DATA ====================

router.delete("/", async (req, res, next) => {
    try {
        await Tracking.deleteMany({ userId: req.user._id });
        res.json({ success: true, message: "All tracking data cleared." });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
