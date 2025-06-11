import express from 'express';
import { registerUser,
    loginUser,
    logoutUser,
    verifyUserEmail,
    forgotPassword,
    verifyForgotOTP,
    resetPassword, } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/verify-email', verifyUserEmail);

router.post('/forgot-password', forgotPassword);
router.post('/verify-forgot-otp', verifyForgotOTP);
router.post('/reset-password', resetPassword);

export default router;