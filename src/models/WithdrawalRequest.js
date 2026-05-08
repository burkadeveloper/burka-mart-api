const mongoose = require("mongoose");

const withdrawalRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  processedAt: Date,
});

module.exports = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
