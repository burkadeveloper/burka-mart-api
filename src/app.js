const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const shippingRoutes = require("./routes/shippingRoutes");
const chatRoutes = require("./routes/chatRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const adminRoutes = require("./routes/adminRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const locationRoutes = require("./routes/locationRoutes");
const walletRoutes = require("./routes/walletRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const contactRoutes = require("./routes/contactRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const sellerRequestRoutes = require("./routes/sellerRequestRoutes");
const app = express();

// Security & middleware
app.use(helmet());
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
// Allow specific origin
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  }),
);
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);

// Global rate limiter (100 requests per minute)

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/seller-requests", sellerRequestRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/chatbot", chatbotRoutes);

// Health check
app.get("/health", (req, res) => res.status(200).json({ status: "OK" }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
