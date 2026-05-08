const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");

// @desc Get or create a chat between two users
// const getOrCreateChat = async (req, res) => {
//   const { otherUserId, productId, orderId } = req.body;
//   const userId = req.user._id;

//   let chat = await Chat.findOne({
//     participants: { $all: [userId, otherUserId] },
//   });

//   if (!chat) {
//     chat = await Chat.create({
//       participants: [userId, otherUserId],
//       productId,
//       orderId,
//     });
//   }

//   res.json({ success: true, chat });
// };

// @desc Get user's chats

// @desc Get messages for a chat
// const getChatMessages = async (req, res) => {
//   const { chatId } = req.params;
//   const messages = await Message.find({ chatId })
//     .populate("sender", "name profilePicture")
//     .populate("receiver", "name")
//     .sort({ createdAt: 1 });
//   res.json({ success: true, messages });
// };

// @desc Block user in chat
const blockChat = async (req, res) => {
  const { chatId } = req.params;
  const chat = await Chat.findById(chatId);
  if (!chat) return res.status(404).json({ success: false });
  chat.isBlocked = true;
  chat.blockedBy = req.user._id;
  await chat.save();
  res.json({ success: true, message: "Chat blocked" });
};
const getUnreadCount = async (req, res) => {
  const count = await Message.countDocuments({
    receiver: req.user._id,
    status: { $ne: "read" },
  });
  res.json({ success: true, count });
};
// const getUserChats = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const chats = await Chat.find({ participants: userId })
//       .populate("participants", "name profilePicture")
//       .populate("productId", "title images")
//       .sort({ lastMessageTime: -1 }); // most recent first

//     // For each chat, compute unread count for the current user
//     const chatsWithUnread = await Promise.all(
//       chats.map(async (chat) => {
//         const unreadCount = await Message.countDocuments({
//           chatId: chat._id,
//           receiver: userId,
//           status: { $ne: "read" },
//         });
//         return {
//           ...chat.toObject(),
//           unreadCount,
//         };
//       }),
//     );

//     res.json({ success: true, chats: chatsWithUnread });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
const getOrCreateChat = async (req, res) => {
  const { otherUserId, productId, orderId } = req.body;
  const userId = req.user._id;

  // Prevent self-chat
  if (userId.toString() === otherUserId) {
    return res
      .status(400)
      .json({ success: false, message: "Cannot chat with yourself" });
  }

  let chat = await Chat.findOne({
    participants: { $all: [userId, otherUserId] },
  });

  if (!chat) {
    chat = await Chat.create({
      participants: [userId, otherUserId],
      productId,
      orderId,
    });
  }

  res.json({ success: true, chat });
};

// const getUserChats = async (req, res) => {
//   const chats = await Chat.find({ participants: req.user._id })
//     .populate("participants", "name profilePicture")
//     .populate("productId", "title images")
//     .sort({ lastMessageTime: -1 });
//   res.json({ success: true, chats });
// };

// const getUserChats = async (req, res) => {
//   const chats = await Chat.find({ participants: req.user._id })
//     .populate("participants", "name profilePicture")
//     .populate("productId", "title images")
//     .sort({ lastMessageTime: -1 });
//   res.json({ success: true, chats });
// };
// @desc Send a message via HTTP (alternative to Socket.IO)
const sendMessageHttp = async (req, res) => {
  const { chatId } = req.params;
  const { message, productId, orderId } = req.body;
  const senderId = req.user._id;

  const chat = await Chat.findById(chatId);
  if (!chat)
    return res.status(404).json({ success: false, message: "Chat not found" });

  // Determine receiver (the other participant)
  const receiverId = chat.participants.find(
    (p) => p.toString() !== senderId.toString(),
  );
  if (!receiverId)
    return res.status(400).json({ success: false, message: "No receiver" });

  const newMessage = await Message.create({
    chatId,
    sender: senderId,
    receiver: receiverId,
    message,
    productId: productId || null,
    orderId: orderId || null,
    status: "sent",
  });

  // Update chat's last message
  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: message,
    lastMessageTime: new Date(),
  });

  res.status(201).json({ success: true, message: newMessage });
};
// Delete a single message (only sender or admin)
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message)
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    // Only message sender or admin can delete
    if (
      message.sender.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    await message.deleteOne();
    res.json({ success: true, message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Edit a message (only sender)
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message: newMessage } = req.body;
    const message = await Message.findById(messageId);
    if (!message)
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    if (message.sender.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    message.message = newMessage;
    message.isEdited = true;
    await message.save();
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark all messages in a chat as read
const markChatRead = async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;
  await Message.updateMany(
    { chatId, receiver: userId, status: { $ne: "read" } },
    { status: "read", readAt: new Date() },
  );
  // Emit socket event to update sender that messages are read (optional)
  const io = req.app.get("io");
  io.to(`chat_${chatId}`).emit("chat_read", { chatId, userId });
  res.json({ success: true });
};

// const getChatMessages = async (req, res) => {
//   const { chatId } = req.params;
//   const userId = req.user._id;

//   const chat = await Chat.findById(chatId);
//   if (!chat)
//     return res.status(404).json({ success: false, message: "Chat not found" });
//   if (!chat.participants.includes(userId)) {
//     return res
//       .status(403)
//       .json({ success: false, message: "Not authorized to view this chat" });
//   }

//   const messages = await Message.find({ chatId })
//     .populate("sender", "name profilePicture")
//     .populate("receiver", "name")
//     .sort({ createdAt: 1 });
//   res.json({ success: true, messages });
// };
const getChatMessages = async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;
  const chat = await Chat.findById(chatId);
  if (!chat)
    return res.status(404).json({ success: false, message: "Chat not found" });
  if (!chat.participants.includes(userId)) {
    return res
      .status(403)
      .json({ success: false, message: "Not authorized to view this chat" });
  }
  const messages = await Message.find({ chatId })
    .populate("sender receiver", "name profilePicture")
    .sort({ createdAt: 1 });
  res.json({ success: true, messages });
};
const getTotalUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      status: { $ne: "read" },
    });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;
    const chat = await Chat.findById(chatId);
    if (!chat)
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });
    if (!chat.participants.includes(userId)) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    // Delete all messages in this chat
    await Message.deleteMany({ chatId });
    // Delete the chat
    await chat.deleteOne();
    res.json({ success: true, message: "Chat deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserChats = async (req, res) => {
  const chats = await Chat.find({ participants: req.user._id })
    .populate("participants", "name profilePicture")
    .populate("productId", "title images")
    .sort({ lastMessageTime: -1 });
  res.json({ success: true, chats });
};
module.exports = {
  getOrCreateChat,
  getUserChats,
  getChatMessages,
  getTotalUnreadCount,
  blockChat,
  getUnreadCount,
  sendMessageHttp,
  deleteChat,
  editMessage,
  deleteMessage,
  deleteChat,
  markChatRead,
};
