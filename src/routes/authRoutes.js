const express = require("express");
const {
  register,
  login,
  verifyEmail,
  resendVerification,
} = require("../controllers/authController");
const { validate, registerValidation } = require("../middleware/validation");
const router = express.Router();

router.post("/register", validate(registerValidation), register);
router.post("/login", login);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerification);

module.exports = router;
