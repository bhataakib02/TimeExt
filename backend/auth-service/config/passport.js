/**
 * Passport Google OAuth Strategy Configuration
 * Used for "Sign in with Google" feature
 */

const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

module.exports = (passport) => {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user already exists with this Google ID
                    let user = await User.findOne({ googleId: profile.id });

                    if (user) {
                        // Update avatar if changed
                        user.avatar = profile.photos?.[0]?.value || user.avatar;
                        await user.save({ validateBeforeSave: false });
                        return done(null, user);
                    }

                    // Check if user exists with same email (link accounts)
                    user = await User.findOne({ email: profile.emails?.[0]?.value });
                    if (user) {
                        user.googleId = profile.id;
                        user.avatar = profile.photos?.[0]?.value || "";
                        await user.save({ validateBeforeSave: false });
                        return done(null, user);
                    }

                    // Create new user from Google profile
                    user = await User.create({
                        name: profile.displayName,
                        email: profile.emails?.[0]?.value,
                        googleId: profile.id,
                        avatar: profile.photos?.[0]?.value || "",
                    });

                    done(null, user);
                } catch (err) {
                    done(err, null);
                }
            }
        )
    );

    // Serialize/deserialize for session (minimal — we use JWT, not sessions)
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};
