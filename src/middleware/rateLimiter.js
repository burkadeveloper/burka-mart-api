const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5, // 5 attempts
  message: "Too many authentication attempts, try again later",
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});

module.exports = { authLimiter, apiLimiter };
