const express = require("express");
const { protect } = require("../middleware/auth");
const {
  createOrder,
  chapaWebhook,
  getMyOrders,
  cancelOrder,
  getOrderById,
  verifyPaymentStatus,
  updateOrderStatus,
} = require("../controllers/orderController");
const router = express.Router();

router.post("/", protect, createOrder);
router.get("/my-orders", protect, getMyOrders);
router.put("/:id/cancel", protect, cancelOrder);
router.get("/:id", protect, getOrderById);
router.get("/:id/verify-payment", protect, verifyPaymentStatus);
// router.put("/:orderId/status", protect, updateOrderStatus);
router.put("/:orderId/status", protect, updateOrderStatus);
// Webhook must be raw body for signature verification
router.post(
  "/chapa-webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    req.body = JSON.parse(req.body.toString());
    chapaWebhook(req, res);
  },
);

module.exports = router;
