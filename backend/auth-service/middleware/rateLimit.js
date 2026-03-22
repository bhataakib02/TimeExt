/**
 * Rate Limiting Middleware
 * Prevents API abuse — different limits for different routes
 */

const rateLimit = require("express-rate-limit");

// Global rate limit — all routes
const globalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per 15 min per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too many requests. Please wait 15 minutes before trying again.",
    },
});

// Strict limit for auth routes (prevent brute-force)
const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // only 10 attempts
    message: {
        error: "Too many login attempts. Please wait 15 minutes.",
    },
});

// Generous limit for extension data uploads
const trackingRateLimit = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 tracking events per minute (one per second max)
    message: {
        error: "Too many tracking events. Slow down a bit!",
    },
});

module.exports = { globalRateLimit, authRateLimit, trackingRateLimit };
