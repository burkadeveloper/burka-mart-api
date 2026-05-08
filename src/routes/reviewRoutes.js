const express = require("express");
const { protect } = require("../middleware/auth");
const {
  createReview,
  updateReview,
  deleteReview,
  toggleLike,
  addReply,
  updateReply,
  deleteReply,
  toggleReplyLike,
  getProductReviews,
} = require("../controllers/reviewController");

const router = express.Router();

router.get("/product/:productId", getProductReviews);
router.post("/product/:productId", protect, createReview);
router.put("/:reviewId", protect, updateReview);
router.delete("/:reviewId", protect, deleteReview);
router.post("/:reviewId/like", protect, toggleLike);
router.post("/:reviewId/replies", protect, addReply);
router.put("/:reviewId/replies/:replyId", protect, updateReply);
router.delete("/:reviewId/replies/:replyId", protect, deleteReply);
router.post("/:reviewId/replies/:replyId/like", protect, toggleReplyLike);

module.exports = router;
