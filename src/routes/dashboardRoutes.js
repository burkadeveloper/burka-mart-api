const express = require("express");
const { protect } = require("../middleware/auth");
const {
  sellerDashboard,
  buyerDashboard,
  activityFeed,
} = require("../controllers/dashboardController");

const router = express.Router();

// All dashboard routes require authentication
router.use(protect);

// Seller dashboard (requires seller role – optional, you can check inside controller)
router.get("/seller", sellerDashboard);

// Buyer dashboard
router.get("/buyer", buyerDashboard);

// Combined activity feed for both roles
router.get("/activity", activityFeed);

module.exports = router;
