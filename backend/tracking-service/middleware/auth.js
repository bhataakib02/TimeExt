/**
 * Authentication bypassed middleware for tracking service
 * Automatically attaches a default user to all protected routes
 */

const User = require("../models/User");

const protect = async (req, res, next) => {
    try {
        const defaultEmail = "local@aero.com";
        // Find or create a default user
        let user = await User.findOne({ email: defaultEmail });

        if (!user) {
            user = await User.create({
                name: "AERO User",
                email: defaultEmail,
                password: "not_needed_for_local",
                isActive: true
            });
        }

        // Update last seen optionally
        user.lastSeen = new Date();
        await user.save({ validateBeforeSave: false });

        // Attach default user to request
        req.user = user;
        next();
    } catch (err) {
        console.error("Auth bypass error in tracking service:", err);
        next(err);
    }
};

// Dummy token generators to prevent breaking other dependent code
const generateAccessToken = () => "dummy-token";
const generateRefreshToken = () => "dummy-token";

module.exports = { protect, generateAccessToken, generateRefreshToken };
