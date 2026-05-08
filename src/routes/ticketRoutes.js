const express = require("express");
const { protect } = require("../middleware/auth");
const {
  createTicket,
  getUserTickets,
  addReply,
} = require("../controllers/ticketController");
const router = express.Router();

router.post("/", protect, createTicket);
router.get("/", protect, getUserTickets);
router.post("/:ticketId/reply", protect, addReply);

module.exports = router;
