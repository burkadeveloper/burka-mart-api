const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  type: {
    type: String,
    enum: ["deposit", "withdrawal", "payment", "refund", "commission"],
    required: true,
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: "ETB" },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  chapaReference: String,
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transaction", transactionSchema);
