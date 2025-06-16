import jwt from "jsonwebtoken";

const generateToken = (res, userId, role) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: false, // ✅ works over HTTP during development
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.cookie("role", role, {
    httpOnly: true,
    secure: false, // ✅ works over HTTP during development
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export default generateToken;