import User from '../models/userModel.js';
import asyncHandler from '../middlewares/asyncHandler.js';
import generateToken from '../utils/generateToken.js';

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

  const user = await User.create({ name, email, password });
  generateToken(res, user._id);

  res.status(201).json({
    success: true,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    generateToken(res, user._id);
    res.json({
      success: true,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

export const logoutUser = asyncHandler(async (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});
