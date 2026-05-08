const express = require("express");
const { protect } = require("../middleware/auth");
const {
  updateUserLocation,
  getSellerLocation,
  getProductLocation,
} = require("../controllers/locationController");

const router = express.Router();

router.put("/me", protect, updateUserLocation);
router.get("/seller/:sellerId", getSellerLocation);
router.get("/product/:productId", getProductLocation);

module.exports = router;
