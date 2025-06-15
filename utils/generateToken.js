import jwt from 'jsonwebtoken';

const generateToken = (res, userId, role) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Fix: Change 'strict' to 'lax' or 'none'
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.cookie('role', role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Fix: Change 'strict' to 'lax' or 'none'
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

export default generateToken;