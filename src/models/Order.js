const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: { type: Number, required: true, min: 1 },
  totalAmount: { type: Number, required: true },
  shippingCost: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  status: {
    type: String,
    enum: [
      "pending",
      "paid",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ],
    default: "pending",
  },
  paymentMethod: { type: String, enum: ["chapa", "wallet"], default: "chapa" },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending",
  },
  chapaTransactionRef: String,
  shippingAddress: {
    fullName: String,
    phone: String,
    city: String,
    subCity: String,
    woreda: String,
    detailedAddress: String,
  },
  buyerLocation: {
    lat: Number,
    lng: Number,
  },
  trackingId: String,
  cancelledAt: Date,
  deliveredAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

module.exports = mongoose.model("Order", orderSchema);
