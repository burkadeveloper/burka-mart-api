const Shipping = require("../models/Shipping");
const Order = require("../models/Order");

// @desc    Get tracking details by tracking number (public)
// @route   GET /api/shipping/track/:trackingNumber
const getTrackingByNumber = async (req, res) => {
  try {
    const shipping = await Shipping.findOne({
      trackingNumber: req.params.trackingNumber,
    }).populate("orderId", "product grandTotal shippingAddress");
    if (!shipping)
      return res
        .status(404)
        .json({ success: false, message: "Tracking number not found" });
    res.json({ success: true, tracking: shipping });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update shipping status (seller/admin)
// @route   PUT /api/shipping/:trackingNumber/status
const updateShippingStatus = async (req, res) => {
  try {
    const { status, location, description } = req.body;
    const shipping = await Shipping.findOne({
      trackingNumber: req.params.trackingNumber,
    });
    if (!shipping)
      return res
        .status(404)
        .json({ success: false, message: "Tracking not found" });

    const order = await Order.findById(shipping.orderId);
    if (!order) return res.status(404).json({ success: false });

    // Authorization: only seller or admin
    if (
      order.seller.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    shipping.status = status;
    shipping.trackingHistory.push({
      status,
      location,
      description,
      timestamp: new Date(),
    });
    if (status === "delivered") {
      shipping.actualDelivery = new Date();
      order.status = "delivered";
      order.deliveredAt = new Date();
      await order.save();
    }
    await shipping.save();
    res.json({ success: true, shipping });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTrackingByNumber, updateShippingStatus };
