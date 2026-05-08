const express = require("express");
const { protect } = require("../middleware/auth");
const {
  updateShippingStatus,
  getTrackingByNumber,
} = require("../controllers/shippingController");
const router = express.Router();

// router.put("/:trackingId", protect, updateShippingStatus);
// router.get("/:trackingId", getTracking);
router.get("/track/:trackingNumber", getTrackingByNumber);
router.put("/:trackingNumber/status", protect, updateShippingStatus);
module.exports = router;
