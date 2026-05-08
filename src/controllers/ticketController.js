const Ticket = require("../models/Ticket");
const User = require("../models/User");
const createNotification = require("../utils/notificationHelper");

const createTicket = async (req, res) => {
  try {
    const { category, subject, message } = req.body;
    const ticket = await Ticket.create({
      user: req.user._id,
      category,
      subject,
      message,
      status: "open",
    });

    // Notify all admins
    const admins = await User.find({ role: "admin" });
    const io = req.app.get("io");
    for (const admin of admins) {
      // In‑app notification
      await createNotification(
        admin._id,
        "ticket",
        "New Support Ticket",
        `Ticket #${ticket._id.toString().slice(-8)}: ${subject}`,
        { ticketId: ticket._id },
        io,
      );
    }
    // Socket event for real‑time refresh on admin panel
    io.to("admin_room").emit("new_ticket", { ticketId: ticket._id });

    res.status(201).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ... rest of controller (getUserTickets, addReply, etc.)

// @desc Get user's own tickets
const getUserTickets = async (req, res) => {
  const tickets = await Ticket.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  res.json({ success: true, tickets });
};

// @desc Add a reply to ticket (user)
const addReply = async (req, res) => {
  const { ticketId } = req.params;
  const { message } = req.body;
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) return res.status(404).json({ success: false });
  if (
    ticket.user.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({ success: false });
  }
  ticket.responses.push({ adminId: req.user._id, message });
  ticket.status = req.user.role === "admin" ? "in-progress" : "open";
  await ticket.save();
  res.json({ success: true, ticket });
};

module.exports = { createTicket, getUserTickets, addReply };
