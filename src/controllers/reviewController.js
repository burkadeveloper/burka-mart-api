const Review = require("../models/Review");
const Product = require("../models/Product");

// Helper to update product average rating
async function updateProductRating(productId) {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);
  await Product.findByIdAndUpdate(productId, {
    averageRating: stats[0]?.avgRating || 0,
    totalReviews: stats[0]?.totalReviews || 0,
  });
}

// Create review
const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    const existing = await Review.findOne({ product: productId, user: userId });
    if (existing) {
      return res
        .status(400)
        .json({
          success: false,
          message: "You have already reviewed this product",
        });
    }

    const review = await Review.create({
      product: productId,
      user: userId,
      rating,
      comment,
    });
    await updateProductRating(productId);
    const populated = await Review.findById(review._id).populate(
      "user",
      "name profilePicture",
    );
    res.status(201).json({ success: true, review: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update review
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const review = await Review.findById(reviewId);
    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    if (review.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    review.rating = rating;
    review.comment = comment;
    await review.save();
    await updateProductRating(review.product);
    const updated = await Review.findById(reviewId).populate(
      "user",
      "name profilePicture",
    );
    res.json({ success: true, review: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete review
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    if (
      review.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    const productId = review.product;
    await review.deleteOne();
    await updateProductRating(productId);
    res.json({ success: true, message: "Review deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle like on review
const toggleLike = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;
    const review = await Review.findById(reviewId);
    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    const liked = review.likes.includes(userId);
    if (liked) {
      review.likes = review.likes.filter(
        (id) => id.toString() !== userId.toString(),
      );
    } else {
      review.likes.push(userId);
    }
    await review.save();
    res.json({ success: true, likesCount: review.likes.length, liked: !liked });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add reply to review
const addReply = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { comment } = req.body;
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ success: false });
    const reply = {
      user: req.user._id,
      comment,
      likes: [],
    };
    review.replies.push(reply);
    await review.save();
    const populated = await Review.findById(reviewId).populate(
      "replies.user",
      "name profilePicture",
    );
    const newReply = populated.replies[populated.replies.length - 1];
    res.status(201).json({ success: true, reply: newReply });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update reply
const updateReply = async (req, res) => {
  try {
    const { reviewId, replyId } = req.params;
    const { comment } = req.body;
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ success: false });
    const reply = review.replies.id(replyId);
    if (!reply) return res.status(404).json({ success: false });
    if (
      reply.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false });
    }
    reply.comment = comment;
    reply.updatedAt = new Date();
    await review.save();
    res.json({ success: true, reply });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete reply
const deleteReply = async (req, res) => {
  try {
    const { reviewId, replyId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ success: false });
    const reply = review.replies.id(replyId);
    if (!reply) return res.status(404).json({ success: false });
    if (
      reply.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false });
    }
    reply.deleteOne();
    await review.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle like on reply
const toggleReplyLike = async (req, res) => {
  try {
    const { reviewId, replyId } = req.params;
    const userId = req.user._id;
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ success: false });
    const reply = review.replies.id(replyId);
    if (!reply) return res.status(404).json({ success: false });
    const liked = reply.likes.includes(userId);
    if (liked) {
      reply.likes = reply.likes.filter(
        (id) => id.toString() !== userId.toString(),
      );
    } else {
      reply.likes.push(userId);
    }
    await review.save();
    res.json({ success: true, likesCount: reply.likes.length, liked: !liked });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get reviews for a product (with pagination)
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 5 } = req.query;
    const reviews = await Review.find({ product: productId })
      .populate("user", "name profilePicture")
      .populate("replies.user", "name profilePicture")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Review.countDocuments({ product: productId });
    res.json({
      success: true,
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  toggleLike,
  addReply,
  updateReply,
  deleteReply,
  toggleReplyLike,
  getProductReviews,
};
