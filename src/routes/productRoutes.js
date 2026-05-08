const express = require("express");
const { protect, sellerOnly } = require("../middleware/auth");
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getMyProducts,
} = require("../controllers/productController");
const upload = require("../config/multer");
const router = express.Router();

router
  .route("/")
  .get(getProducts)
  .post(protect, sellerOnly, upload.array("images", 5), createProduct);
router.get("/featured", getFeaturedProducts);
router.get("/my-products", protect, getMyProducts);
router
  .route("/:id")
  .get(getProductById)
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

module.exports = router;
