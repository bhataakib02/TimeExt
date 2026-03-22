/**
 * Insights Routes
 * GET /api/insights — get AI-generated productivity insights
 */

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const insightsEngine = require("../services/insightsEngine");

router.use(protect);

router.get("/", async (req, res, next) => {
    try {
        const insights = await insightsEngine.generateInsights(req.user._id);
        res.json(insights);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
