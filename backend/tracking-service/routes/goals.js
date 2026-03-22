/**
 * Goals Routes
 * GET  /api/goals        — get user goals
 * POST /api/goals        — create/update a goal (upsert by type)
 * PUT  /api/goals/:id    — update a specific goal by ID
 * DELETE /api/goals/:id   — delete a goal
 */

const express = require("express");
const router = express.Router();
const Goal = require("../models/Goal");
const Tracking = require("../models/Tracking");
const { protect } = require("../middleware/auth");

router.use(protect);

// Helper: extract hostname from URL or return as-is if already a hostname
function extractHostname(input) {
    if (!input) return "";
    input = input.trim().toLowerCase();
    try {
        // If it looks like a URL (has protocol), parse it
        if (input.includes("://")) {
            return new URL(input).hostname;
        }
        // If it starts with www. or contains a dot, treat as hostname
        return input;
    } catch {
        return input;
    }
}

// GET all goals for user
router.get("/", async (req, res, next) => {
    try {
        const goals = await Goal.find({ userId: req.user._id, isActive: true });
        res.json(goals);
    } catch (err) {
        next(err);
    }
});

// CREATE or UPDATE a goal
router.post("/", async (req, res, next) => {
    try {
        const { type, website, targetSeconds, label, repeat } = req.body;
        if (!type || !targetSeconds || !website) {
            return res.status(400).json({ error: "Type, target value, and website are required." });
        }

        const normalizedWebsite = extractHostname(website);

        // Upsert logic for site-specific goals or unique types
        const query = { userId: req.user._id, type };
        if (normalizedWebsite) query.website = normalizedWebsite;

        const goal = await Goal.findOneAndUpdate(
            query,
            { targetSeconds, label, repeat, isActive: true, website: normalizedWebsite },
            { upsert: true, new: true }
        );

        res.json(goal);
    } catch (err) {
        next(err);
    }
});

// UPDATE a specific goal
router.put("/:id", async (req, res, next) => {
    try {
        const { type, website, targetSeconds, label, repeat, isActive } = req.body;
        const update = {};
        if (type) update.type = type;
        if (website) update.website = extractHostname(website);
        if (targetSeconds !== undefined) update.targetSeconds = targetSeconds;
        if (label !== undefined) update.label = label;
        if (repeat) update.repeat = repeat;
        if (isActive !== undefined) update.isActive = isActive;

        // If website is explicitly provided as empty, it should be rejected
        if (website === "") {
            return res.status(400).json({ error: "Website cannot be empty." });
        }

        const goal = await Goal.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { $set: update },
            { new: true }
        );

        if (!goal) return res.status(404).json({ error: "Goal not found" });
        res.json(goal);
    } catch (err) {
        next(err);
    }
});

// DELETE a goal
router.delete("/:id", async (req, res, next) => {
    try {
        await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

// GET goals with real-time progress
router.get("/progress", async (req, res, next) => {
    try {
        const userId = req.user._id;
        const goals = await Goal.find({ userId, isActive: true });

        // Fetch ALL tracking data for this user
        const trackingData = await Tracking.find({ userId });

        console.log(`📊 Goal Progress: Found ${goals.length} goals, ${trackingData.length} tracking records`);

        const goalsWithProgress = goals.map(goal => {
            let currentSeconds = 0;
            // Normalize the goal's website (could be a full URL or hostname)
            const goalWebsite = extractHostname(goal.website);

            if (goalWebsite) {
                // Website-specific goal: match tracking hostnames
                const matchingRecords = trackingData.filter(t => {
                    if (!t.website) return false;
                    const trackingHost = t.website.toLowerCase();
                    return trackingHost.includes(goalWebsite) || goalWebsite.includes(trackingHost);
                });
                currentSeconds = matchingRecords.reduce((sum, t) => sum + t.time, 0);
                console.log(`🎯 Goal "${goal.label}" website="${goalWebsite}": ${matchingRecords.length} matching records, ${currentSeconds}s total`);
            } else if (goal.type === "productive" || goal.type === "daily_productive_hours" || goal.type === "weekly_productive_hours") {
                currentSeconds = trackingData
                    .filter(t => t.category === "productive")
                    .reduce((sum, t) => sum + t.time, 0);
            } else if (goal.type === "unproductive" || goal.type === "daily_limit_site" || goal.type === "reduce_site") {
                currentSeconds = trackingData
                    .filter(t => t.category === "unproductive" || t.category === "distracting")
                    .reduce((sum, t) => sum + t.time, 0);
            }

            const progress = goal.targetSeconds > 0 ? Math.min(100, Math.round((currentSeconds / goal.targetSeconds) * 100)) : 0;

            return {
                ...goal.toObject(),
                currentSeconds,
                progress
            };
        });

        res.json(goalsWithProgress);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
