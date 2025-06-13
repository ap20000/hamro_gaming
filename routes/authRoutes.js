import express from 'express';
import passport from 'passport'; 
import generateToken from '../utils/generateToken.js';

import { registerUser,
    loginUser,
    logoutUser,
    verifyUserEmail,
    forgotPassword,
    verifyForgotOTP,
    resetPassword, } from '../controllers/authController.js';

const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/verify-email', verifyUserEmail);

router.post('/forgot-password', forgotPassword);
router.post('/verify-forgot-otp', verifyForgotOTP);
router.post('/reset-password', resetPassword);


router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    (req, res) => {
      // JWT Cookie Setup
      generateToken(res, req.user._id);
  
      // Send response or redirect to frontend
      res.redirect(`${process.env.CLIENT_URL}/dashboard`); // Or send user data
    }
  );
  
export default router;