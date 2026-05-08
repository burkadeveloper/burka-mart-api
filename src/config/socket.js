const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");
const Chat = require("../models/Chat");

const onlineUsers = new Map();

const setupSocket = (server) => {
  // const io = new Server(server, {
  //   cors: {
  //     origin: [
  //       "http://localhost:3000",
  //       "http://localhost:5173",
  //       process.env.FRONTEND_URL,
  //     ],
  //     credentials: true,
  //   },
  // });

  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL, // This must be your Vercel URL
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("User not found"));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);
    socket.join(`user_${userId}`);
    if (socket.user.role === "admin") socket.join("admin_room");
    socket.broadcast.emit("user_status", { userId, status: "online" });

    socket.on("join_chat", (chatId) => {
      socket.join(`chat_${chatId}`);
    });

    socket.on("send_message", async (data) => {
      try {
        const { chatId, receiverId, message, productId, orderId, attachments } =
          data;
        const newMessage = await Message.create({
          chatId,
          sender: socket.user._id,
          receiver: receiverId,
          message,
          productId,
          orderId,
          status: "sent",
          attachments: attachments || [],
        });
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: message,
          lastMessageTime: new Date(),
          $addToSet: { participants: [socket.user._id, receiverId] },
        });
        io.to(`chat_${chatId}`).emit("new_message", {
          ...newMessage.toObject(),
          senderName: socket.user.name,
        });
        io.to(`user_${receiverId}`).emit("message_notification", {
          chatId,
          message: message.substring(0, 50),
          senderName: socket.user.name,
        });
        setTimeout(async () => {
          await Message.findByIdAndUpdate(newMessage._id, {
            status: "delivered",
          });
          io.to(`chat_${chatId}`).emit("message_status", {
            messageId: newMessage._id,
            status: "delivered",
          });
        }, 2000);
      } catch (error) {
        console.error(error);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    socket.on("typing", ({ chatId, isTyping }) => {
      socket
        .to(`chat_${chatId}`)
        .emit("user_typing", { userId: socket.user._id, isTyping });
    });

    socket.on("mark_read", async ({ chatId, messageId }) => {
      await Message.findByIdAndUpdate(messageId, {
        status: "read",
        readAt: new Date(),
      });
      io.to(`chat_${chatId}`).emit("message_status", {
        messageId,
        status: "read",
      });
    });

    socket.on("mark_chat_read", async ({ chatId }) => {
      await Message.updateMany(
        { chatId, receiver: socket.user._id, status: { $ne: "read" } },
        { status: "read", readAt: new Date() },
      );
      io.to(`chat_${chatId}`).emit("chat_read", {
        chatId,
        userId: socket.user._id,
      });
    });

    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      socket.broadcast.emit("user_status", {
        userId,
        status: "offline",
        lastSeen: new Date(),
      });
    });
  });

  return io;
};

module.exports = setupSocket;
