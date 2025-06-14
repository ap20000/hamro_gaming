import User from '../models/userModel.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../services/emailService.js'; // You'll create this
import crypto from 'crypto';

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes from now

  const user = await User.create({
    name,
    email,
    password,
    otp,
    otpExpiry,
    isVerified: false,
  });

  // Send OTP via email
  await sendEmail({
    to: email,
    subject: 'Verify your email',
    text: `Your verification code is ${otp}. It will expire in 10 minutes.`,
  });

  res.status(201).json({
    success: true,
    message: 'Registered successfully. Check your email for the OTP to verify.',
  });
});


export const verifyUserEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  generateToken(res, user._id);

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    user: { _id: user._id, name: user.name, email: user.email, role: user.role },
  });
});



export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isVerified) {
    res.status(403);
    throw new Error('Please verify your email before logging in');
  }

  generateToken(res, user._id);

  res.json({
    success: true,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role },
  });
});


export const logoutUser = asyncHandler(async (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});


// Forgot Password - Send OTP
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User with this email does not exist');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

  user.otp = otp;
  user.otpExpiry = otpExpiry;
  await user.save();

  await sendEmail({
    to: email,
    subject: 'Password Reset OTP',
    text: `Your OTP for password reset is ${otp}. It will expire in 10 minutes.`,
  });

  res.status(200).json({
    success: true,
    message: 'OTP sent to your email. It will expire in 10 minutes.',
  });
});

// Verify OTP
export const verifyForgotOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'OTP verified. You can now reset your password.',
  });
});

// Reset Password
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (newPassword !== confirmPassword) {
    res.status(400);
    throw new Error('Passwords do not match');
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful. You can now login.',
  });
});
