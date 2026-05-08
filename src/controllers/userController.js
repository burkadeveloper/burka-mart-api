const User = require("../models/User");
const Wallet = require("../models/Wallet");
const bcrypt = require("bcryptjs");
const { uploadSingleImage } = require("../utils/uploadHelper");

// @desc    Get logged-in user profile
// @route   GET /api/users/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -refreshToken",
    );
    const wallet = await Wallet.findOne({ user: req.user._id });
    res.json({ success: true, user, wallet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update profile (name, phone, location)
// @route   PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, location } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (location) updates.location = location;
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    }).select("-password");
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/users/password
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect" });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Become a seller (initiate request – admin approval required)
// @route   POST /api/users/become-seller
const becomeSeller = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.isSeller) {
      return res
        .status(400)
        .json({ success: false, message: "Already a seller" });
    }
    if (user.sellerRequestPending) {
      return res
        .status(400)
        .json({ success: false, message: "Request already pending" });
    }
    // Here we don't directly set isSeller = true; instead, the user must go through the seller request form.
    // This endpoint can be used to trigger the request flow.
    return res
      .status(400)
      .json({
        success: false,
        message: "Please use the seller request form to apply",
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get seller public profile (for product page)
// @route   GET /api/users/seller/:sellerId
const getSellerProfile = async (req, res) => {
  try {
    const seller = await User.findById(req.params.sellerId).select(
      "name profilePicture location phone createdAt",
    );
    if (!seller)
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    res.json({ success: true, seller });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload profile picture (Cloudinary)
// @route   POST /api/users/profile-picture
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }
    const imageUrl = await uploadSingleImage(req.file, "marketplace/avatars");
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: imageUrl },
      { new: true },
    ).select("-password");
    res.json({ success: true, profilePicture: user.profilePicture, user });
  } catch (error) {
    console.error("Profile picture upload error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get notification preferences
// @route   GET /api/users/notifications
const getNotificationSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "notificationPreferences",
    );
    res.json({ success: true, preferences: user.notificationPreferences });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update notification preferences
// @route   PUT /api/users/notifications
const updateNotificationSettings = async (req, res) => {
  try {
    const { email, sms, push } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { notificationPreferences: { email, sms, push } },
      { new: true },
    ).select("notificationPreferences");
    res.json({ success: true, preferences: user.notificationPreferences });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update payout settings (for sellers)
// @route   PUT /api/users/payout-settings
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
      { new: true },
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
