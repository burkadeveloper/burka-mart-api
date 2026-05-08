const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  image: String,
  commissionRate: { type: Number, default: 5.0, min: 0, max: 30 }, // platform fee %
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("Category", categorySchema);
