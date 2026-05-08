const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  lastMessage: { type: String, default: "" },
  lastMessageTime: { type: Date, default: Date.now },
  message: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  attachments: [{ type: String }], // image urls
  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent",
  },
  attachments: [
    {
      type: {
        type: String,
        enum: ["image", "audio", "file", "sticker"],
        required: true,
      },
      url: { type: String, required: true },
      name: String,
      size: Number,
      mimeType: String,
    },
  ],
  isEdited: { type: Boolean, default: false },
  readAt: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
