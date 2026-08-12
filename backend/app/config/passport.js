const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const User = require("../models/User");

// Google OAuth is optional — passport-google-oauth20 throws synchronously
// at require time if clientID/clientSecret are missing, which would crash
// the whole server on boot for anyone who hasn't configured Google OAuth
// locally. Only register the strategy when it's actually configured.
if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CALLBACK_URL
) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new Error("Google account has no email."), null);
          }

          let user = await User.findOne({
            email,
            isDeleted: false,
          });

          if (!user) {
            const adminExists = await User.exists({
              role: "admin",
            });

            user = await User.create({
              name: profile.displayName,
              email,
              googleId: profile.id,
              provider: "google",
              avatar: profile.photos?.[0]?.value || "",
              isEmailVerified: true,
              role: adminExists ? "user" : "admin",
            });
          } else {
            // Link Google account if it wasn't linked before
            if (!user.googleId) {
              user.googleId = profile.id;
            }

            // Keep profile picture updated
            user.avatar = profile.photos?.[0]?.value || user.avatar;

            // Mark email verified
            user.isEmailVerified = true;

            await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      },
    ),
  );
}

module.exports = passport;
