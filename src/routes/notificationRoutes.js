// const express = require("express");
// const { protect } = require("../middleware/auth");
// const Notification = require("../models/Notification");
// const router = express.Router();

// // Get user's notifications (latest 20)
// router.get("/", protect, async (req, res) => {
//   const notifications = await Notification.find({ user: req.user._id })
//     .sort({ createdAt: -1 })
//     .limit(20);
//   res.json({ success: true, notifications });
// });

// // Get unread count
// router.get("/unread-count", protect, async (req, res) => {
//   const count = await Notification.countDocuments({
//     user: req.user._id,
//     isRead: false,
//   });
//   res.json({ success: true, count });
// });

// // Mark a notification as read
// router.put("/:id/read", protect, async (req, res) => {
//   await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
//   res.json({ success: true });
// });

// // Mark all as read
// router.put("/mark-all-read", protect, async (req, res) => {
//   await Notification.updateMany({ user: req.user._id }, { isRead: true });
//   res.json({ success: true });
// });

// module.exports = router;

const express = require("express");
const { protect } = require("../middleware/auth");
const Notification = require("../models/Notification");
const router = express.Router();

// Get user's notifications (latest 20)
router.get("/", protect, async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);
  res.json({ success: true, notifications });
});

// Get unread count
router.get("/unread-count", protect, async (req, res) => {
  const count = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
  });
  res.json({ success: true, count });
});

// Mark a notification as read
router.put("/:id/read", protect, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ success: true });
});

// Mark all as read
router.put("/mark-all-read", protect, async (req, res) => {
  await Notification.updateMany({ user: req.user._id }, { isRead: true });
  res.json({ success: true });
});

module.exports = router;
