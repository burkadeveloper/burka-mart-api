const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  images: [{ type: String }], // Cloudinary URLs
  quantity: { type: Number, required: true, min: 0, default: 1 },
  location: {
    city: String,
    subCity: String,
    coordinates: { lat: Number, lng: Number },
    address: String,
  },
  shippingOptions: [
    {
      method: { type: String, enum: ["standard", "express", "pickup"] },
      cost: { type: Number, required: true },
      estimatedDays: Number,
    },
  ],
  status: {
    type: String,
    enum: ["active", "sold_out", "archived", "pending"],
    default: "active",
  },
  isFeatured: { type: Boolean, default: false },

  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

productSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
