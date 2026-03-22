/**
 * Categories Routes
 * GET  /api/categories        — get all category mappings
 * POST /api/categories        — manually categorize a site
 * DELETE /api/categories/:site — remove a custom categorization
 */

const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const { protect } = require("../middleware/auth");

router.use(protect);

// GET all categories for the user
router.get("/", async (req, res, next) => {
    try {
        const cats = await Category.find({ userId: req.user._id });
        res.json(cats);
    } catch (err) {
        next(err);
    }
});

// Upsert a category (manual classification)
router.post("/", async (req, res, next) => {
    try {
        const { website, category } = req.body;
        if (!website || !["productive", "unproductive", "neutral"].includes(category)) {
            return res.status(400).json({ error: "Invalid website or category." });
        }

        const cat = await Category.findOneAndUpdate(
            { userId: req.user._id, website: website.toLowerCase().trim() },
            { category, source: "user" },
            { upsert: true, new: true }
        );

        res.json(cat);
    } catch (err) {
        next(err);
    }
});

// Remove a custom category (reset to AI/default)
router.delete("/:website", async (req, res, next) => {
    try {
        await Category.findOneAndDelete({ userId: req.user._id, website: req.params.website });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
