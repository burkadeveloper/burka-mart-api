const User = require("../models/User");
const Wallet = require("../models/Wallet");
const { generateToken } = require("../utils/generateToken");
const sendVerificationEmail = require("../utils/sendVerificationEmail");

// Validate Ethiopian phone number
const isValidEthiopianPhone = (phone) => {
  const ethioRegex = /^(?:\+251|0)?[79]\d{8}$/;
  return ethioRegex.test(phone);
};

// Register user
const register = async (req, res) => {
  try {
    const { name, email, phone, password, isSeller } = req.body;

    // Phone validation
    if (!isValidEthiopianPhone(phone)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid Ethiopian phone number (e.g., 09XXXXXXXX or +2519XXXXXXXX)",
      });
    }

    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return res
        .status(400)
        .json({
          success: false,
          message: "User already exists with this email or phone",
        });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      isSeller: isSeller || false,
      isVerified: false,
    });

    await Wallet.create({ user: user._id, balance: 0 });

    // Send verification email (non-blocking)
    try {
      await sendVerificationEmail(user, req);
    } catch (emailError) {
      console.error("Verification email failed:", emailError.message);
      // Don't block registration – user can request resend later
    }

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account.",
      userId: user._id,
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error during registration" });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid or expired verification token",
        });
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    // Auto-login after verification
    const jwtToken = generateToken(user._id);
    res.json({
      success: true,
      message: "Email verified successfully. You are now logged in.",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isSeller: user.isSeller,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Resend verification email
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    if (user.isVerified)
      return res
        .status(400)
        .json({ success: false, message: "Email already verified" });
    await sendVerificationEmail(user, req);
    res.json({ success: true, message: "Verification email resent" });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Login user (requires verified email)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message:
          "Please verify your email before logging in. Check your inbox or request a new verification link.",
      });
    }
    if (user.status !== "active") {
      return res
        .status(401)
        .json({
          success: false,
          message: "Your account is suspended. Contact support.",
        });
    }
    user.lastLogin = Date.now();
    await user.save();

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isSeller: user.isSeller,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error during login" });
  }
};

module.exports = { register, login, verifyEmail, resendVerification };
