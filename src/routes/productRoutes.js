const express = require("express");
const { protect, sellerOnly } = require("../middleware/auth");
const upload = require("../config/multer");
const {
  createProduct,
  getProducts,
  getProductById,
  getFeaturedProducts,
  getMyProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const router = express.Router();

// ========== PUBLIC ROUTES ==========
router.get("/", getProducts);
router.get("/featured", getFeaturedProducts);

// ========== AUTHENTICATED ROUTES (specific before dynamic) ==========
// MUST be before the /:id route
router.get("/my-products", protect, getMyProducts);

// ========== DYNAMIC ROUTE (must be last) ==========
router.get("/:id", getProductById);

// ========== SELLER PROTECTED ROUTES ==========
router.post("/", protect, sellerOnly, upload.array("images", 5), createProduct);
router.put(
  "/:id",
  protect,
  sellerOnly,
  upload.array("images", 5),
  updateProduct,
);
router.delete("/:id", protect, sellerOnly, deleteProduct);

module.exports = router;
