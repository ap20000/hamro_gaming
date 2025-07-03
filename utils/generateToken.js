import jwt from "jsonwebtoken";

const generateToken = (res, userId, role) => {
  const isProduction = process.env.NODE_ENV === "production";

  console.log("👉 generateToken called");
  console.log("UserId:", userId);
  console.log("Role:", role);
  console.log("isProduction:", isProduction);

  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  console.log("Generated JWT:", token);

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.cookie("role", role, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  console.log("✅ Cookies sent with response");
};

export default generateToken;
