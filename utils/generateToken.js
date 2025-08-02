const generateToken = (res, userId, role) => {
  const isProduction = process.env.NODE_ENV === "production";

  console.log("👉 generateToken called");
  console.log("UserId:", userId);
  console.log("Role:", role);
  console.log("isProduction:", isProduction);

  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "15m", // JWT itself expires in 15 minutes
  });

  console.log("Generated JWT:", token);

  const expiryMs = 15 * 60 * 1000; // 15 minutes in milliseconds

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: expiryMs,
  });

  res.cookie("role", role, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: expiryMs,
  });

  console.log("✅ Cookies sent with response (15 min expiry)");
};
