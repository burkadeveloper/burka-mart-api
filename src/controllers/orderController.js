const Order = require("../models/Order");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");
const User = require("../models/User");
const Shipping = require("../models/Shipping");
const crypto = require("crypto");
const { initializePayment } = require("../services/chapaService");
const sendEmail = require("../config/email");
const generateTrackingId = require("../utils/trackingNumber");
const createNotification = require("../utils/notificationHelper");
// src/controllers/orderController.js

const AdminSettings = require("../models/AdminSettings");

// Helper: Credit seller wallet after successful payment
const creditSellerWallet = async (order) => {
  // Get commission rate
  const settings = await AdminSettings.findOne();
  const commissionRate = settings?.commissionGlobal || 5;
  const sellerEarnings = order.grandTotal * (1 - commissionRate / 100);

  // Update seller's wallet
  let wallet = await Wallet.findOne({ user: order.seller });
  if (!wallet) {
    wallet = await Wallet.create({ user: order.seller, balance: 0 });
  }
  wallet.balance += sellerEarnings;
  await wallet.save();

  // Create transaction record
  await Transaction.create({
    user: order.seller,
    order: order._id,
    type: "credit",
    amount: sellerEarnings,
    status: "completed",
    description: `Earnings from order #${order._id} (after ${commissionRate}% commission)`,
  });
};

const createOrder = async (req, res) => {
  try {
    const { productId, quantity, shippingAddress, shippingMethod, location } =
      req.body;
    const buyer = req.user._id;

    const product = await Product.findById(productId);

    if (!product || product.status !== "active") {
      return res
        .status(400)
        .json({ success: false, message: "Product not available" });
    }
    if (product.quantity < quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient stock" });
    }
    if (req.user._id.toString() === product.seller.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot purchase your own product.",
      });
    }
    let shippingOption = product.shippingOptions?.find(
      (opt) => opt.method === shippingMethod,
    );
    if (!shippingOption && product.shippingOptions?.length) {
      shippingOption = product.shippingOptions[0];
    }
    if (!shippingOption) {
      shippingOption = { method: "standard", cost: 0, estimatedDays: 3 };
    }

    const totalAmount = product.price * quantity;
    const grandTotal = totalAmount + shippingOption.cost;

    const order = await Order.create({
      buyer,
      seller: product.seller,
      product: productId,
      quantity,
      totalAmount,
      shippingCost: shippingOption.cost,
      grandTotal,
      shippingAddress,
      buyerLocation: location,
      status: "pending",
      paymentStatus: "pending",
    });
    const io = req.app.get("io");
    io.to("admin_room").emit("new_order", { orderId: order._id });
    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      await createNotification(
        admin._id,
        "order",
        "New Order Placed",
        `Order #${order._id} has been placed by ${req.user.name}.`,
        { orderId: order._id },
        req.app.get("io"),
      );
    }
    // Reduce stock
    product.quantity -= quantity;
    if (product.quantity === 0) product.status = "sold_out";
    await product.save();

    const tx_ref = `order_${order._id}_${Date.now()}`;
    const callbackUrl = `${process.env.BACKEND_URL}/api/orders/chapa-webhook`;
    const returnUrl = `${process.env.FRONTEND_URL}/order-status/${order._id}?payment=success`; // ✅ added query param

    const paymentData = {
      amount: grandTotal,
      email: req.user.email,
      first_name: req.user.name.split(" ")[0],
      last_name: req.user.name.split(" ")[1] || "Customer",
      tx_ref,
      callback_url: callbackUrl,
      return_url: returnUrl,
      order_id: order._id,
      customization: {
        title: "Marketplace", // ≤ 16 chars
        description: `Order ${order._id}`, // safe chars only
      },
    };

    const checkout_url = await initializePayment(paymentData);

    order.chapaTransactionRef = tx_ref;
    await order.save();

    res.json({ success: true, orderId: order._id, checkout_url });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// const createOrder = async (req, res) => {
//   try {
//     const { productId, quantity, shippingAddress, shippingMethod, location } =
//       req.body;
//     const buyer = req.user._id;

//     const product = await Product.findById(productId);

//     if (!product || product.status !== "active") {
//       return res
//         .status(400)
//         .json({ success: false, message: "Product not available" });
//     }
//     if (product.quantity < quantity) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Insufficient stock" });
//     }
//     if (req.user._id.toString() === product.seller.toString()) {
//       return res.status(400).json({
//         success: false,
//         message: "You cannot purchase your own product.",
//       });
//     }
//     let shippingOption = product.shippingOptions?.find(
//       (opt) => opt.method === shippingMethod,
//     );
//     if (!shippingOption && product.shippingOptions?.length) {
//       shippingOption = product.shippingOptions[0];
//     }
//     if (!shippingOption) {
//       shippingOption = { method: "standard", cost: 0, estimatedDays: 3 };
//     }

//     const totalAmount = product.price * quantity;
//     const grandTotal = totalAmount + shippingOption.cost;

//     const order = await Order.create({
//       buyer,
//       seller: product.seller,
//       product: productId,
//       quantity,
//       totalAmount,
//       shippingCost: shippingOption.cost,
//       grandTotal,
//       shippingAddress,
//       buyerLocation: location,
//       status: "pending",
//       paymentStatus: "pending",
//     });
//     const io = req.app.get("io");
//     io.to("admin_room").emit("new_order", { orderId: order._id });
//     const admins = await User.find({ role: "admin" });
//     for (const admin of admins) {
//       await createNotification(
//         admin._id,
//         "order",
//         "New Order Placed",
//         `Order #${order._id} has been placed by ${req.user.name}.`,
//         { orderId: order._id },
//         req.app.get("io"),
//       );
//     }
//     // Reduce stock
//     product.quantity -= quantity;
//     if (product.quantity === 0) product.status = "sold_out";
//     await product.save();

//     const tx_ref = `order_${order._id}_${Date.now()}`;
//     const callbackUrl = `${process.env.BACKEND_URL}/api/orders/chapa-webhook`;
//     const returnUrl = `${process.env.FRONTEND_URL}/order-status/${order._id}`;

//     const paymentData = {
//       amount: grandTotal,
//       email: req.user.email,
//       first_name: req.user.name.split(" ")[0],
//       last_name: req.user.name.split(" ")[1] || "Customer",
//       tx_ref,
//       callback_url: callbackUrl,
//       return_url: returnUrl,
//       order_id: order._id,
//       customization: {
//         title: "Marketplace", // ≤ 16 chars
//         description: `Order ${order._id}`, // safe chars only
//       },
//     };

//     const checkout_url = await initializePayment(paymentData);

//     order.chapaTransactionRef = tx_ref;
//     await order.save();

//     res.json({ success: true, orderId: order._id, checkout_url });
//   } catch (error) {
//     console.error("Create order error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// const chapaWebhook = async (req, res) => {
//   const signature = req.headers["x-chapa-signature"];
//   const payload = JSON.stringify(req.body);
//   const expectedSignature = crypto
//     .createHmac("sha256", process.env.CHAPA_WEBHOOK_SECRET)
//     .update(payload)
//     .digest("hex");

//   if (signature !== expectedSignature) {
//     console.error("Invalid webhook signature");
//     return res.status(401).send("Unauthorized");
//   }

//   const { tx_ref, status } = req.body;
//   if (status !== "success") return res.status(200).send("OK");

//   const order = await Order.findOne({ chapaTransactionRef: tx_ref });
//   if (!order || order.paymentStatus === "completed")
//     return res.status(200).send("OK");

//   // Double-check with Chapa API (optional but recommended)
//   // const verification = await verifyPayment(tx_ref);
//   // if (verification.status !== 'success') return res.status(400).send('Verification failed');

//   order.paymentStatus = "completed";
//   order.status = "paid";
//   await order.save();

//   // Create transaction record
//   await Transaction.create({
//     user: order.buyer,
//     order: order._id,
//     type: "payment",
//     amount: order.grandTotal,
//     status: "completed",
//     chapaReference: tx_ref,
//     description: `Payment for order ${order._id}`,
//   });

//   // Create shipping tracking
//   await Shipping.create({
//     orderId: order._id,
//     trackingNumber: generateTrackingId(),
//     status: "pending",
//   });

//   // Add seller earnings (after commission)
//   const AdminSettings = require("../models/AdminSettings");
//   const settings = await AdminSettings.findOne();
//   const commissionRate = settings?.commissionGlobal || 5;
//   const sellerEarnings = order.grandTotal * (1 - commissionRate / 100);
//   await Wallet.findOneAndUpdate(
//     { user: order.seller },
//     { $inc: { balance: sellerEarnings } },
//     { upsert: true },
//   );

//   // Notify seller and buyer (non-blocking)
//   try {
//     const seller = await User.findById(order.seller);
//     const buyer = await User.findById(order.buyer);
//     await sendEmail(
//       seller.email,
//       "New Order Received",
//       `You have a new order #${order._id}`,
//     );
//     await sendEmail(
//       buyer.email,
//       "Order Confirmed",
//       `Your order #${order._id} is confirmed`,
//     );
//   } catch (err) {
//     console.error("Email error:", err.message);
//   }

//   res.status(200).send("OK");
// };
const chapaWebhook = async (req, res) => {
  console.log("🔔 Webhook received");
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body:", JSON.stringify(req.body, null, 2));

  const signature = req.headers["x-chapa-signature"];
  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac("sha256", process.env.CHAPA_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  if (signature !== expectedSignature) {
    console.error("❌ Invalid webhook signature");
    return res.status(401).send("Unauthorized");
  }

  const { tx_ref, status } = req.body;
  if (status !== "success") {
    console.log(`Webhook status not success: ${status}`);
    return res.status(200).send("OK");
  }

  const order = await Order.findOne({ chapaTransactionRef: tx_ref });
  if (!order) {
    console.log(`Order not found for tx_ref: ${tx_ref}`);
    return res.status(200).send("OK");
  }
  if (order.paymentStatus === "completed") {
    console.log(`Order ${order._id} already paid`);
    return res.status(200).send("OK");
  }

  // Update order
  order.paymentStatus = "completed";
  order.status = "paid";
  await order.save();
  console.log(`✅ Order ${order._id} marked as paid`);
  await creditSellerWallet(order);
  // 1. Create transaction record
  await Transaction.create({
    user: order.buyer,
    order: order._id,
    type: "payment",
    amount: order.grandTotal,
    status: "completed",
    chapaReference: tx_ref,
    description: `Payment for order ${order._id}`,
  });

  // 2. Create shipping tracking
  const generateTrackingId = require("../utils/trackingNumber");
  await Shipping.create({
    orderId: order._id,
    trackingNumber: generateTrackingId(),
    status: "pending",
  });

  // 3. Add seller earnings (after platform commission)
  const AdminSettings = require("../models/AdminSettings");
  const settings = await AdminSettings.findOne();
  const commissionRate = settings?.commissionGlobal || 5; // default 5%
  const sellerEarnings = order.grandTotal * (1 - commissionRate / 100);
  await Wallet.findOneAndUpdate(
    { user: order.seller },
    { $inc: { balance: sellerEarnings } },
    { upsert: true, new: true },
  );
  console.log(`💰 Seller ${order.seller} earned ETB ${sellerEarnings}`);

  // 4. Send email notifications (non-blocking)
  const sendEmail = require("../config/email");
  try {
    const seller = await User.findById(order.seller);
    const buyer = await User.findById(order.buyer);
    if (seller?.email) {
      await sendEmail(
        seller.email,
        "New Order Received",
        `<h1>New Order!</h1>
         <p>You have received a new order #${order._id} for ETB ${order.grandTotal}.</p>
         <p>Please process the order soon.</p>`,
      );
    }
    if (buyer?.email) {
      await sendEmail(
        buyer.email,
        "Order Confirmed",
        `<h1>Payment Successful!</h1>
         <p>Your order #${order._id} has been paid and will be processed.</p>
         <p>Thank you for shopping with us.</p>`,
      );
    }
  } catch (err) {
    console.error("Email error:", err.message);
  }

  res.status(200).send("OK");
};
// const getMyOrders = async (req, res) => {
//   try {
//     const { role } = req.query;
//     let filter = {};
//     if (role === "buyer") filter.buyer = req.user._id;
//     else if (role === "seller") filter.seller = req.user._id;
//     else filter = { $or: [{ buyer: req.user._id }, { seller: req.user._id }] };
//     const orders = await Order.find(filter)
//       .populate("product", "title images")
//       .populate("buyer", "name email")
//       .populate("seller", "name email")
//       .sort({ createdAt: -1 });
//     res.json({ success: true, orders });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false });
    if (
      order.buyer.toString() !== req.user._id.toString() &&
      order.seller.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false });
    }
    if (order.status !== "pending" && order.status !== "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Order cannot be cancelled now" });
    }
    order.status = "cancelled";
    await order.save();
    // Restore product quantity
    const product = await Product.findById(order.product);
    if (product) {
      product.quantity += order.quantity;
      await product.save();
    }
    res.json({ success: true, message: "Order cancelled" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("product", "title images price")
      .populate("seller", "name")
      .populate("buyer", "name");
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    // Only allow buyer or seller or admin to view
    if (
      order.buyer._id.toString() !== req.user._id.toString() &&
      order.seller._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Manually verify payment status with Chapa (fallback)

// @desc    Manually verify payment status (fallback if webhook fails)
// @route   GET /api/orders/:id/verify-payment
const verifyPaymentStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    // If already paid, return immediately
    if (order.paymentStatus === "completed") {
      return res.json({ success: true, status: "completed", order });
    }

    // Call Chapa verification API
    const { verifyPayment } = require("../services/chapaService");
    const verification = await verifyPayment(order.chapaTransactionRef);

    if (verification.status === "success") {
      order.paymentStatus = "completed";
      order.status = "paid";
      await order.save();
      await creditSellerWallet(order);
      // Add earnings to seller wallet, create shipping, etc. (same as webhook)
      // ... (copy the wallet and shipping logic from webhook)
    }

    res.json({ success: true, status: order.paymentStatus, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getMyOrders = async (req, res) => {
  try {
    const { role } = req.query;
    let filter = {};
    if (role === "buyer") filter.buyer = req.user._id;
    else if (role === "seller") filter.seller = req.user._id;
    else filter = { $or: [{ buyer: req.user._id }, { seller: req.user._id }] };

    const orders = await Order.find(filter)
      .populate("product", "title images price")
      .populate("buyer", "name email")
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    // For each order, fetch shipping info
    const ordersWithShipping = await Promise.all(
      orders.map(async (order) => {
        const shipping = await Shipping.findOne({ orderId: order._id }).select(
          "trackingNumber status",
        );
        return {
          ...order.toObject(),
          trackingNumber: shipping?.trackingNumber || null,
          trackingStatus: shipping?.status || null,
        };
      }),
    );

    res.json({ success: true, orders: ordersWithShipping });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Seller updates order status
// @route   PUT /api/orders/:orderId/status
// @access  Private (seller of the order)
// const updateOrderStatus = async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { status } = req.body;
//     const order = await Order.findById(orderId);
//     if (!order)
//       return res
//         .status(404)
//         .json({ success: false, message: "Order not found" });
//     // Only the seller or admin can update status
//     if (
//       order.seller.toString() !== req.user._id.toString() &&
//       req.user.role !== "admin"
//     ) {
//       return res
//         .status(403)
//         .json({ success: false, message: "Not authorized" });
//     }
//     order.status = status;
//     if (status === "delivered") order.deliveredAt = new Date();
//     await order.save();
//     res.json({ success: true, order });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const order = await Order.findById(orderId);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    if (
      order.seller.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    order.status = status;
    if (status === "delivered") order.deliveredAt = new Date();
    await order.save();

    // Notify buyer
    await createNotification(
      order.buyer,
      "order",
      `Order Status Updated to ${status}`,
      `Your order #${order._id} is now ${status}.`,
      { orderId: order._id },
      req.app.get("io"),
    );

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
module.exports = {
  createOrder,
  chapaWebhook,
  getMyOrders,
  cancelOrder,
  getOrderById,
  verifyPaymentStatus,
  updateOrderStatus,
};
