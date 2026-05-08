const express = require("express");
const { protect } = require("../middleware/auth");
const {
  getProfile,
  updateProfile,
  updatePassword,
  becomeSeller,
  getSellerProfile,
  uploadProfilePicture,
  getNotificationSettings,
  updateNotificationSettings,
  updatePayoutSettings,
} = require("../controllers/userController");
const upload = require("../config/multer");

const router = express.Router();

router.use(protect); // all routes require authentication

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/password", updatePassword);
router.post("/become-seller", becomeSeller);
router.get("/seller/:sellerId", getSellerProfile);
router.post("/profile-picture", upload.single("image"), uploadProfilePicture);
router.get("/notifications", getNotificationSettings);
router.put("/notifications", updateNotificationSettings);
router.put("/payout-settings", protect, updatePayoutSettings);
module.exports = router;
