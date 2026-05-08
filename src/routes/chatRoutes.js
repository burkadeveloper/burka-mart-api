const express = require("express");
const { protect } = require("../middleware/auth");
const ChatMessage = require("../models/Message"); // import your message model
const { uploadFile, upload } = require("../controllers/uploadController");
const {
  getOrCreateChat,
  getUserChats,
  getChatMessages,
  blockChat,
  sendMessageHttp,
  getUnreadCount,
  deleteMessage,
  editMessage,
  deleteChat,
  markChatRead,
  getTotalUnreadCount,
} = require("../controllers/chatController");
const router = express.Router();
router.post("/:chatId/messages", protect, sendMessageHttp);
router.get("/unread", protect, getUnreadCount);
router.post("/init", protect, getOrCreateChat);
router.get("/", protect, getUserChats);
router.get("/:chatId/messages", protect, getChatMessages);
router.put("/:chatId/block", protect, blockChat);
router.delete("/messages/:messageId", protect, deleteMessage);
router.put("/messages/:messageId", protect, editMessage);
router.get("/unread-count", protect, getTotalUnreadCount);
router.put("/:chatId/read", protect, markChatRead);

router.delete("/:chatId", protect, deleteChat);
router.post("/upload", protect, upload.single("file"), uploadFile);
// ✅ Fixed unread route

router.get("/unread", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const unreadCount = await ChatMessage.countDocuments({
      receiver: userId,
      status: { $ne: "read" },
    });
    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
