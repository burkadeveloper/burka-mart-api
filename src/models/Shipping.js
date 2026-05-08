const mongoose = require("mongoose");

const shippingSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  trackingNumber: { type: String, unique: true, required: true },
  carrier: String, // e.g., 'Ethiopian Postal Service', 'Zemen'
  status: {
    type: String,
    enum: [
      "pending",
      "packed",
      "shipped",
      "in_transit",
      "out_for_delivery",
      "delivered",
    ],
    default: "pending",
  },
  estimatedDelivery: Date,
  actualDelivery: Date,
  trackingHistory: [
    {
      status: String,
      location: String,
      description: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Shipping", shippingSchema);
