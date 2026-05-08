const Category = require("../models/Category");

// @desc    Get all categories (public)
// @route   GET /api/categories
const getCategories = async (req, res) => {
  const categories = await Category.find({}).populate("parentCategory");
  res.json({ success: true, categories });
};

// @desc    Get single category by ID (public)
// @route   GET /api/categories/:id
const getCategory = async (req, res) => {
  const category = await Category.findById(req.params.id).populate(
    "parentCategory",
  );
  if (!category)
    return res
      .status(404)
      .json({ success: false, message: "Category not found" });
  res.json({ success: true, category });
};

// @desc    Create category (admin only)
// @route   POST /api/categories
const createCategory = async (req, res) => {
  const { name, slug, description, commissionRate, parentCategory } = req.body;
  const category = await Category.create({
    name,
    slug,
    description,
    commissionRate: commissionRate || 5,
    parentCategory: parentCategory || null,
    isActive: true,
  });
  res.status(201).json({ success: true, category });
};

// @desc    Update category (admin only)
// @route   PUT /api/categories/:id
const updateCategory = async (req, res) => {
  const { name, slug, description, commissionRate, isActive, parentCategory } =
    req.body;
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name, slug, description, commissionRate, isActive, parentCategory },
    { new: true, runValidators: true },
  );
  if (!category)
    return res
      .status(404)
      .json({ success: false, message: "Category not found" });
  res.json({ success: true, category });
};

// @desc    Delete category (admin only)
// @route   DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category)
    return res
      .status(404)
      .json({ success: false, message: "Category not found" });
  res.json({ success: true, message: "Category deleted" });
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
