const User = require("../models/User");
const Wallet = require("../models/Wallet");
const bcrypt = require("bcryptjs");
const cloudinary = require("../config/cloudinary");

// @desc Get logged-in user profile
const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken",
  );
  const wallet = await Wallet.findOne({ user: req.user._id });
  res.json({ success: true, user, wallet });
};

// @desc Update profile (name, phone, location)
const updateProfile = async (req, res) => {
  const allowed = ["name", "phone", "location"];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
  }).select("-password");
  res.json({ success: true, user });
};

// @desc Change password
const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch)
    return res
      .status(400)
      .json({ success: false, message: "Current password incorrect" });
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: "Password updated" });
};

// @desc Become a seller
const becomeSeller = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.isSeller)
    return res
      .status(400)
      .json({ success: false, message: "Already a seller" });
  user.isSeller = true;
  await user.save();
  res.json({ success: true, message: "You are now a seller" });
};

// @desc Get seller public profile (for product page)
const getSellerProfile = async (req, res) => {
  const seller = await User.findById(req.params.sellerId).select(
    "name profilePicture location phone createdAt",
  );
  if (!seller) return res.status(404).json({ success: false });
  res.json({ success: true, seller });
};

// @desc Upload profile picture
// const uploadProfilePicture = async (req, res) => {
//   if (!req.file)
//     return res
//       .status(400)
//       .json({ success: false, message: "No file uploaded" });
//   const imageUrl = req.file.path; // Cloudinary URL
//   const user = await User.findByIdAndUpdate(
//     req.user._id,
//     { profilePicture: imageUrl },
//     { new: true },
//   );
//   res.json({ success: true, profilePicture: user.profilePicture });
// };
// src/controllers/userController.js
const upload = require("../config/multer"); // single image upload

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: imageUrl },
      { new: true },
    ).select("-password");
    res.json({ success: true, profilePicture: user.profilePicture, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get notification preferences
const getNotificationSettings = async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "notificationPreferences",
  );
  res.json({ success: true, preferences: user.notificationPreferences });
};

// @desc Update notification preferences
const updateNotificationSettings = async (req, res) => {
  const { email, sms, push } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      notificationPreferences: { email, sms, push },
    },
    { new: true },
  );
  res.json({ success: true, preferences: user.notificationPreferences });
};

const updatePayoutSettings = async (req, res) => {
  try {
    const {
      preferredPayoutMethod,
      bankAccountName,
      bankAccountNumber,
      bankCode,
      teleBirrNumber,
    } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        preferredPayoutMethod,
        bankAccountName,
        bankAccountNumber,
        bankCode,
        teleBirrNumber,
      },
      { new: true, runValidators: true },
    ).select("-password");
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updatePassword,
  becomeSeller,
  getSellerProfile,
  uploadProfilePicture,
  getNotificationSettings,
  updateNotificationSettings,
  updatePayoutSettings,
};
