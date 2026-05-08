const Order = require("../models/Order");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const Message = require("../models/Message");
const moment = require("moment");

// Seller dashboard analytics
const sellerDashboard = async (req, res) => {
  const sellerId = req.user._id;

  //Sales revenue (last 30 days)
  const revenueData = await Order.aggregate([
    { $match: { seller: sellerId, status: "delivered" } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$deliveredAt" } },
        total: { $sum: "$grandTotal" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const topProducts = await Order.aggregate([
    { $match: { seller: sellerId } },
    { $group: { _id: "$product", totalSold: { $sum: "$quantity" } } },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
  ]);

  const pendingOrders = await Order.countDocuments({
    seller: sellerId,
    status: { $in: ["paid", "processing"] },
  });

  res.json({
    success: true,
    dashboard: {
      revenueChart: revenueData,
      topProducts,
      pendingOrders,
      totalSales: await Order.countDocuments({
        seller: sellerId,
        status: "delivered",
      }),
    },
  });
};

// Buyer dashboard
const buyerDashboard = async (req, res) => {
  const buyerId = req.user._id;

  const spendingTrend = await Order.aggregate([
    { $match: { buyer: buyerId, status: "delivered" } },
    {
      $group: {
        _id: { $month: "$deliveredAt" },
        totalSpent: { $sum: "$grandTotal" },
      },
    },
  ]);

  const favoriteCategories = await Order.aggregate([
    { $match: { buyer: buyerId } },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    { $unwind: "$productInfo" },
    { $group: { _id: "$productInfo.category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 3 },
  ]);

  res.json({
    success: true,
    dashboard: {
      spendingTrend,
      favoriteCategories,
      totalOrders: await Order.countDocuments({ buyer: buyerId }),
    },
  });
};

// Combined activity feed
const activityFeed = async (req, res) => {
  const userId = req.user._id;
  const orders = await Order.find({
    $or: [{ buyer: userId }, { seller: userId }],
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("product", "title images");

  const unreadMessages = await Message.countDocuments({
    receiver: userId,
    status: { $ne: "read" },
  });

  res.json({
    success: true,
    activity: { recentOrders: orders, unreadMessages },
  });
};

module.exports = { sellerDashboard, buyerDashboard, activityFeed };

// const Order = require("../models/Order");
// const Product = require("../models/Product");
// const moment = require("moment");

// // Get seller dashboard stats
// const getSellerStats = async (req, res) => {
//   try {
//     const sellerId = req.user._id;
//     const orders = await Order.find({ seller: sellerId });
//     const totalSales = orders.length;
//     const deliveredOrders = orders.filter(
//       (o) => o.status === "delivered",
//     ).length;
//     const pendingOrders = orders.filter((o) =>
//       ["pending", "paid", "processing"].includes(o.status),
//     ).length;
//     const totalRevenue = orders.reduce(
//       (sum, o) => sum + (o.status === "delivered" ? o.grandTotal : 0),
//       0,
//     );
//     const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
//     res.json({
//       success: true,
//       stats: {
//         totalSales,
//         deliveredOrders,
//         pendingOrders,
//         totalRevenue,
//         avgOrderValue,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Get seller recent orders (last 10)
// const getSellerRecentOrders = async (req, res) => {
//   try {
//     const sellerId = req.user._id;
//     const orders = await Order.find({ seller: sellerId })
//       .populate("buyer", "name")
//       .populate("product", "title images")
//       .sort({ createdAt: -1 })
//       .limit(10);
//     res.json({ success: true, orders });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Get seller top products (by quantity sold)
// const getSellerTopProducts = async (req, res) => {
//   try {
//     const sellerId = req.user._id;
//     const topProducts = await Order.aggregate([
//       { $match: { seller: sellerId, status: "delivered" } },
//       {
//         $group: {
//           _id: "$product",
//           totalSold: { $sum: "$quantity" },
//           revenue: { $sum: "$grandTotal" },
//         },
//       },
//       { $sort: { totalSold: -1 } },
//       { $limit: 5 },
//       {
//         $lookup: {
//           from: "products",
//           localField: "_id",
//           foreignField: "_id",
//           as: "product",
//         },
//       },
//       { $unwind: "$product" },
//     ]);
//     res.json({ success: true, topProducts });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Get seller sales chart data (daily/weekly/monthly)
// const getSellerSalesChart = async (req, res) => {
//   try {
//     const sellerId = req.user._id;
//     const { period = "weekly" } = req.query;
//     let startDate, groupFormat;
//     if (period === "daily") {
//       startDate = moment().subtract(7, "days");
//       groupFormat = "%Y-%m-%d";
//     } else if (period === "monthly") {
//       startDate = moment().subtract(6, "months");
//       groupFormat = "%Y-%m";
//     } else {
//       startDate = moment().subtract(30, "days");
//       groupFormat = "%Y-%m-%d";
//     }
//     const salesData = await Order.aggregate([
//       {
//         $match: {
//           seller: sellerId,
//           status: "delivered",
//           deliveredAt: { $gte: startDate.toDate() },
//         },
//       },
//       {
//         $group: {
//           _id: { $dateToString: { format: groupFormat, date: "$deliveredAt" } },
//           total: { $sum: "$grandTotal" },
//           count: { $sum: 1 },
//         },
//       },
//       { $sort: { _id: 1 } },
//     ]);
//     res.json({ success: true, salesData, period });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // Get seller activity feed (new orders, product views, etc.)
// const getSellerActivity = async (req, res) => {
//   try {
//     const sellerId = req.user._id;
//     // Get recent orders as activities
//     const recentOrders = await Order.find({ seller: sellerId })
//       .sort({ createdAt: -1 })
//       .limit(10)
//       .populate("buyer", "name");
//     const activities = recentOrders.map((order) => ({
//       type: "order",
//       title: `New order from ${order.buyer?.name || "Customer"}`,
//       description: `Order #${order._id} for ETB ${order.grandTotal}`,
//       timestamp: order.createdAt,
//       link: `/seller-orders?order=${order._id}`,
//     }));
//     res.json({ success: true, activities });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// module.exports = {
//   getSellerStats,
//   getSellerRecentOrders,
//   getSellerTopProducts,
//   getSellerSalesChart,
//   getSellerActivity,
// };
