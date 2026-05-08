const User = require("../models/User");
const Product = require("../models/Product");

// @desc    Update logged‑in user's location (used by sellers)
// @route   PUT /api/location/me
// @access  Private
const updateUserLocation = async (req, res) => {
  try {
    const { city, subCity, coordinates } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { location: { city, subCity, coordinates } },
      { new: true, runValidators: true },
    );
    res.json({ success: true, location: user.location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get seller location by seller ID (from product or user)
// @route   GET /api/location/seller/:sellerId
// @access  Public
const getSellerLocation = async (req, res) => {
  try {
    const { sellerId } = req.params;
    // First, try to get location from the seller's profile
    const seller = await User.findById(sellerId).select("location name");
    if (
      seller?.location?.coordinates?.lat &&
      seller?.location?.coordinates?.lng
    ) {
      return res.json({
        success: true,
        location: seller.location,
        sellerName: seller.name,
      });
    }
    // If seller hasn't set location, try to get from any active product they sell
    const product = await Product.findOne({
      seller: sellerId,
      status: "active",
    })
      .select("location")
      .sort({ createdAt: -1 });
    if (
      product?.location?.coordinates?.lat &&
      product?.location?.coordinates?.lng
    ) {
      return res.json({
        success: true,
        location: product.location,
        sellerName: seller?.name || "Seller",
      });
    }
    // No location found
    return res.json({ success: true, location: null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get product location (for product detail page)
// @route   GET /api/location/product/:productId
// @access  Public
const getProductLocation = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).populate(
      "seller",
      "name",
    );
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    // Prefer product's own location, else fallback to seller's location
    let location = product.location;
    if (!location?.coordinates?.lat || !location?.coordinates?.lng) {
      const seller = await User.findById(product.seller).select("location");
      location = seller?.location;
    }
    res.json({
      success: true,
      location: location || null,
      sellerName: product.seller?.name,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { updateUserLocation, getSellerLocation, getProductLocation };
