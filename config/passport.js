import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import User from '../models/userModel.js';
import dotenv from 'dotenv';
dotenv.config();


passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find existing user by email
        let user = await User.findOne({ email: profile.emails[0].value });

        // If user not found, create a new one (without password!)
        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            // Do NOT set password here for Google users
            isVerified: true,
            fromGoogle: true,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);
