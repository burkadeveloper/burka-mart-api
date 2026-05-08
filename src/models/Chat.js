const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  lastMessage: String,
  lastMessageTime: { type: Date, default: Date.now },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  isBlocked: { type: Boolean, default: false },
  blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Chat", chatSchema);
