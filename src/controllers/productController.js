const Product = require("../models/Product");
const { uploadImages } = require("../utils/uploadHelper");

// Create product
const createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      quantity,
      location,
      shippingOptions,
    } = req.body;
    const seller = req.user._id;

    if (!req.user.isSeller) {
      return res
        .status(403)
        .json({ success: false, message: "Become a seller first" });
    }

    // Upload images to Cloudinary
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = await uploadImages(req.files);
    }

    const product = await Product.create({
      seller,
      title,
      description,
      price,
      category,
      images: imageUrls,
      quantity: Number(quantity),
      location: location ? JSON.parse(location) : {},
      shippingOptions: shippingOptions ? JSON.parse(shippingOptions) : [],
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all products (public)
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      search,
      sellerId,
    } = req.query;
    const filter = { status: "active" };
    if (category) filter.category = category;
    if (sellerId) filter.seller = sellerId;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) filter.$text = { $search: search };

    const products = await Product.find(filter)
      .populate("seller", "name email profilePicture location")
      .populate("category")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single product
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("seller", "name email phone profilePicture location")
      .populate("category");
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    product.views += 1;
    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    if (
      product.seller.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    let {
      title,
      description,
      price,
      quantity,
      shippingOptions,
      location,
      existingImages,
      removedImages,
    } = req.body;

    // Process existing images (keep after removals)
    let currentImages = product.images || [];
    if (existingImages) {
      currentImages = JSON.parse(existingImages);
    }
    if (removedImages) {
      const removed = JSON.parse(removedImages);
      currentImages = currentImages.filter((img) => !removed.includes(img));
    }

    // Upload new images
    let newImageUrls = [];
    if (req.files && req.files.length) {
      newImageUrls = await uploadImages(req.files);
    }

    const finalImages = [...currentImages, ...newImageUrls].slice(0, 5); // max 5 images

    product.title = title || product.title;
    product.description = description || product.description;
    product.price = price || product.price;
    product.quantity = quantity || product.quantity;
    product.shippingOptions = shippingOptions
      ? JSON.parse(shippingOptions)
      : product.shippingOptions;
    product.location = location ? JSON.parse(location) : product.location;
    product.images = finalImages;
    await product.save();

    res.json({ success: true, product });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete (archive) product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false });
    if (
      product.seller.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false });
    }
    product.status = "archived";
    await product.save();
    res.json({ success: true, message: "Product archived" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
