// const mongoose = require("mongoose");

// const notificationSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   type: {
//     type: String,
//     enum: ["order", "broadcast", "product", "system"],
//     default: "system",
//   },
//   type: {
//     type: String,
//     enum: ["order", "broadcast", "product", "system", "ticket"],
//     default: "system",
//   },
//   title: { type: String, required: true },
//   message: { type: String, required: true },
//   data: { type: mongoose.Schema.Types.Mixed },
//   isRead: { type: Boolean, default: false },
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model("Notification", notificationSchema);

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["order", "broadcast", "product", "ticket", "system"],
    default: "system",
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
