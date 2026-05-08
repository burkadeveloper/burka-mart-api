const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const {
  getDashboardStats,
  getUsers,
  updateUser,
  moderateProduct,
  createCategory,
  getTickets,
  replyTicket,
  broadcastEmail,
  exportUsers,
  getAllOrders,
  updateUserStatus,
  updateOrderStatus,
  getAdminProducts,
  deleteProductAdmin,
  toggleFeatured,
} = require("../controllers/adminController");
const {
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
} = require("../controllers/withdrawalController");
const router = express.Router();

router.use(protect, adminOnly);
// router.get("/stats", getDashboardStats);
router.get("/users", getUsers);
router.put("/users/:userId", updateUser);
router.put("/products/:productId/moderate", moderateProduct);
router.post("/categories", createCategory);
router.get("/tickets", getTickets);
router.post("/tickets/:ticketId/reply", replyTicket);
router.post("/broadcast", broadcastEmail);
router.get("/export/users", exportUsers);

router.get("/stats", protect, adminOnly, getDashboardStats);
router.get("/orders", protect, adminOnly, getAllOrders);
router.put("/orders/:orderId/status", protect, adminOnly, updateOrderStatus);
router.put("/users/:userId/status", protect, adminOnly, updateUserStatus);
router.get("/products", protect, adminOnly, getAdminProducts);
router.put("/products/:id/featured", protect, adminOnly, toggleFeatured);
router.delete("/products/:id", protect, adminOnly, deleteProductAdmin);

router.get("/withdrawals", protect, adminOnly, getAllWithdrawals);
router.put("/withdrawals/:id/approve", protect, adminOnly, approveWithdrawal);
router.put("/withdrawals/:id/reject", protect, adminOnly, rejectWithdrawal);
module.exports = router;
