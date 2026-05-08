const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: {
    type: String,
    enum: ["payment", "shipping", "product", "account", "other"],
    required: true,
  },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ["open", "in-progress", "resolved", "closed"],
    default: "open",
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // admin
  responses: [
    {
      adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      message: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  resolvedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Ticket", ticketSchema);
