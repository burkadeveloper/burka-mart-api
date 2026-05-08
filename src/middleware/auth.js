const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, no token" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }
    if (user.status !== "active") {
      return res
        .status(401)
        .json({ success: false, message: "Account suspended or banned" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ success: false, message: "Admin access required" });
  }
};

const sellerOnly = (req, res, next) => {
  if (req.user && req.user.isSeller) {
    next();
  } else {
    res.status(403).json({ success: false, message: "Seller access required" });
  }
};

module.exports = { protect, adminOnly, sellerOnly };
