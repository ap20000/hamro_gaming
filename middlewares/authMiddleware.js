import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import User from '../models/userModel.js';

export const protect = asyncHandler(async (req, res, next) => {
  console.log('🔒 [Protect] Incoming cookies:', req.cookies);

  let token = req.cookies.jwt;

  if (!token) {
    console.error('❌ No jwt cookie found');
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select('-password');
    console.log('✅ User decoded from token:', req.user?.email);
    next();
  } catch (error) {
    console.error('❌ Error verifying token:', error);
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});



