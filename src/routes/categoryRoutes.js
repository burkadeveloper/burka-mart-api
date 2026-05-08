const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const router = express.Router();

// Public routes
router.get("/", getCategories);
router.get("/:id", getCategory);

// Admin only routes
router.post("/", protect, adminOnly, createCategory);
router.put("/:id", protect, adminOnly, updateCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

module.exports = router;
