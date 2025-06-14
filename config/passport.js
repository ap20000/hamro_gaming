passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          // Generate OTP & expiry
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            isVerified: false,
            fromGoogle: true,
            otp,
            otpExpiry,
          });

          // Send OTP email
          await sendEmail({
            to: user.email,
            subject: 'Verify your email',
            text: `Your verification code is ${otp}. It will expire in 10 minutes.`,
          });

          // Here you might want to block login flow until verification
        }

        if (!user.isVerified) {
          // Don't authenticate yet, force OTP verification

          // Option 1: Return a special error or status that frontend can handle
          return done(null, false, { message: 'Email verification required' });

          // Option 2: You can pass user info for OTP verification screen
          // return done(null, user, { message: 'Verify OTP' });
        }

        // If verified, continue normal login
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);
