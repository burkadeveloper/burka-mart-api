const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Ticket = require("../models/Ticket");
const Category = require("../models/Category");
const AdminSettings = require("../models/AdminSettings");
const Notification = require("../models/Notification");
const sendEmail = require("../config/email");

// Dashboard stats
// const getDashboardStats = async (req, res) => {
//   const totalUsers = await User.countDocuments();
//   const activeUsers = await User.countDocuments({
//     lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
//   });
//   const totalProducts = await Product.countDocuments();
//   const totalSold = await Order.countDocuments({ status: "delivered" });
//   const totalRevenue = await Order.aggregate([
//     { $match: { status: "delivered" } },
//     { $group: { _id: null, total: { $sum: "$grandTotal" } } },
//   ]);

//   res.json({
//     success: true,
//     stats: {
//       totalUsers,
//       activeUsers,
//       totalProducts,
//       totalSold,
//       totalRevenue: totalRevenue[0]?.total || 0,
//     },
//   });
// };
// const toggleFeatured = async (req, res) => {
//   const product = await Product.findByIdAndUpdate(
//     req.params.id,
//     { isFeatured: req.body.isFeatured },
//     { new: true },
//   );
//   res.json({ success: true, product });
// };
// Get all users with filters
const getUsers = async (req, res) => {
  const { role, status, search, page = 1 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (search)
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];

  const users = await User.find(filter)
    .select("-password")
    .limit(20)
    .skip((page - 1) * 20);
  const total = await User.countDocuments(filter);
  res.json({ success: true, users, total, page });
};

// Update user (suspend/verify)
const updateUser = async (req, res) => {
  const { userId } = req.params;
  const { status, isSeller, isVerified } = req.body;
  const user = await User.findByIdAndUpdate(
    userId,
    { status, isSeller, isVerified },
    { new: true },
  ).select("-password");
  if (!user) return res.status(404).json({ success: false });
  res.json({ success: true, user });
};

// Moderate products (approve/reject)
const moderateProduct = async (req, res) => {
  const { productId } = req.params;
  const { status, adminNote } = req.body; // status: 'active' or 'archived'
  const product = await Product.findByIdAndUpdate(
    productId,
    { status },
    { new: true },
  );
  if (!product) return res.status(404).json({ success: false });

  // Notify seller
  const seller = await User.findById(product.seller);
  await sendEmail(
    seller.email,
    "Product moderation update",
    `Your product ${product.title} is now ${status}. Note: ${adminNote || ""}`,
  );
  res.json({ success: true, product });
};

// Manage categories
const createCategory = async (req, res) => {
  const { name, slug, description, commissionRate, parentCategory } = req.body;
  const category = await Category.create({
    name,
    slug,
    description,
    commissionRate,
    parentCategory,
  });
  res.status(201).json({ success: true, category });
};

// Get all tickets
const getTickets = async (req, res) => {
  const tickets = await Ticket.find()
    .populate("user", "name email")
    .populate("assignedTo", "name");
  res.json({ success: true, tickets });
};

// Reply to ticket
const replyTicket = async (req, res) => {
  const { ticketId } = req.params;
  const { message } = req.body;
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) return res.status(404).json({ success: false });
  ticket.responses.push({ adminId: req.user._id, message });
  ticket.status = "in-progress";
  await ticket.save();

  // Email user
  await sendEmail(ticket.user.email, `Ticket #${ticketId} update`, message);
  res.json({ success: true, ticket });
};

// Broadcast email to all users
const broadcastEmail = async (req, res) => {
  const { subject, html, userFilter } = req.body; // userFilter: 'all', 'sellers', 'buyers'
  let users = [];
  if (userFilter === "sellers") users = await User.find({ isSeller: true });
  else if (userFilter === "buyers")
    users = await User.find({ isSeller: false });
  else users = await User.find();

  for (const user of users) {
    await sendEmail(user.email, subject, html).catch((err) =>
      console.error(err),
    );
  }
  res.json({
    success: true,
    message: `Broadcast sent to ${users.length} users`,
  });
  const createNotification = require("../utils/notificationHelper");

  // After sending emails (or instead of emails)
  for (const user of users) {
    await createNotification(
      user._id,
      "broadcast",
      subject,
      html.replace(/<[^>]*>/g, "").substring(0, 200),
      { broadcast: true },
      req.app.get("io"),
    );
  }
};

// Export data (CSV)
const exportUsers = async (req, res) => {
  const users = await User.find().select(
    "name email phone role isSeller status createdAt",
  );
  // convert to CSV and send file (simplified)
  res.json({ success: true, data: users });
};
// Get dashboard stats with charts data
const getDashboardStats = async (req, res) => {
  const totalUsers = await User.countDocuments();
  const sellers = await User.countDocuments({ isSeller: true });
  const totalProducts = await Product.countDocuments();
  const totalRevenue = await Order.aggregate([
    { $match: { status: "delivered" } },
    { $group: { _id: null, total: { $sum: "$grandTotal" } } },
  ]);
  // Monthly sales data (last 6 months)
  const salesData = await Order.aggregate([
    { $match: { status: "delivered" } },
    {
      $group: {
        _id: { $month: "$deliveredAt" },
        total: { $sum: "$grandTotal" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const salesLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const salesChartData = salesLabels.map((_, i) => {
    const found = salesData.find((d) => d._id === i + 1);
    return found ? found.total : 0;
  });
  res.json({
    success: true,
    stats: {
      totalUsers,
      sellers,
      totalProducts,
      totalRevenue: totalRevenue[0]?.total || 0,
      salesLabels,
      salesData: salesChartData,
    },
  });
};

// Get all orders for admin
// const getAllOrders = async (req, res) => {
//   const orders = await Order.find()
//     .populate("buyer", "name email")
//     .populate("seller", "name")
//     .populate("product", "title")
//     .sort({ createdAt: -1 });
//   res.json({ success: true, orders });
// };

// Update order status
const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(
    orderId,
    { status },
    { new: true },
  );
  res.json({ success: true, order });
};

// Update user status (suspend/activate)
const updateUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;
  const user = await User.findByIdAndUpdate(
    userId,
    { status },
    { new: true },
  ).select("-password");
  res.json({ success: true, user });
};

const getAdminProducts = async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const filter = {};
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }
  const products = await Product.find(filter)
    .populate("seller", "name email")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  const total = await Product.countDocuments(filter);
  res.json({
    success: true,
    products,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total,
  });
};
const deleteProductAdmin = async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { status: "archived" },
    { new: true },
  );
  if (!product) return res.status(404).json({ success: false });
  res.json({ success: true, message: "Product archived" });
};
// @desc    Toggle product featured status
// @route   PUT /api/admin/products/:id/featured
const toggleFeatured = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    product.isFeatured = req.body.isFeatured;
    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get orders with pagination
const getAllOrders = async (req, res) => {
  const { limit = 10, skip = 0 } = req.query;
  const orders = await Order.find()
    .populate("buyer", "name")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));
  const total = await Order.countDocuments();
  res.json({ success: true, orders, total });
};

// Get products with pagination
const getAllProducts = async (req, res) => {
  const { limit = 10, skip = 0 } = req.query;
  const products = await Product.find()
    .populate("seller", "name")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));
  const total = await Product.countDocuments();
  res.json({ success: true, products, total });
};
module.exports = {
  getDashboardStats,
  getUsers,
  updateUser,
  moderateProduct,
  createCategory,
  getTickets,
  replyTicket,
  broadcastEmail,
  exportUsers,
  toggleFeatured,
  getAllOrders,
  updateOrderStatus,
  updateUserStatus,
  getAdminProducts,
  deleteProductAdmin,
  toggleFeatured,
  getAllProducts,
};
