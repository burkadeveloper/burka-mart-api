require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const setupSocket = require("./src/config/socket");
const logger = require("./src/utils/logger");

const PORT = process.env.PORT || 5000;

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info("Uploads folder created");
}

// Connect to MongoDB
connectDB();

const server = http.createServer(app);
const io = setupSocket(server);
app.set("io", io);

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, closing server...");
  server.close(() => {
    mongoose.connection.close(false, () => {
      logger.info("MongoDB connection closed");
      process.exit(0);
    });
  });
});
