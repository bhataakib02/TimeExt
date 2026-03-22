/**
 * Focus Mode Routes
 * GET  /api/focus        — get blocklist
 * POST /api/focus        — add to blocklist
 * DELETE /api/focus/:id   — remove from blocklist
 */

const express = require("express");
const router = express.Router();
const FocusBlock = require("../models/FocusBlock");
const { protect } = require("../middleware/auth");

router.use(protect);

// GET blocklist
router.get("/", async (req, res, next) => {
    try {
        const blocks = await FocusBlock.find({ userId: req.user._id, isActive: true });
        res.json(blocks);
    } catch (err) {
        next(err);
    }
});

// ADD to blocklist
router.post("/", async (req, res, next) => {
    try {
        const { website, schedule } = req.body;
        if (!website) return res.status(400).json({ error: "Website URL is required." });

        const block = await FocusBlock.findOneAndUpdate(
            { userId: req.user._id, website: website.toLowerCase().trim() },
            { schedule, isActive: true },
            { upsert: true, new: true }
        );

        res.json(block);
    } catch (err) {
        next(err);
    }
});

// REMOVE from blocklist
router.delete("/:id", async (req, res, next) => {
    try {
        await FocusBlock.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
