const Notification = require("../models/Notification");

const createNotification = async (
  userId,
  type,
  title,
  message,
  data = null,
  io = null,
) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      data,
    });
    // If Socket.IO instance is provided, emit to the user's room
    if (io) {
      io.to(`user_${userId}`).emit("new_notification", notification);
    }
    return notification;
  } catch (error) {
    console.error("Notification error:", error);
    return null;
  }
};

module.exports = createNotification;
