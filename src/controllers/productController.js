const Product = require("../models/Product");
const { uploadImages } = require("../utils/uploadHelper");

// const createProduct = async (req, res) => {
//   try {
//     let {
//       title,
//       description,
//       price,
//       category,
//       quantity,
//       location,
//       shippingOptions,
//     } = req.body;
//     const seller = req.user._id;

//     if (!req.user.isSeller) {
//       return res
//         .status(403)
//         .json({ success: false, message: "Become a seller first" });
//     }

//     // Parse location if it's a string, otherwise use as object
//     if (typeof location === "string") {
//       location = JSON.parse(location);
//     }
//     // Parse shippingOptions if it's a string, otherwise use as array
//     if (typeof shippingOptions === "string") {
//       shippingOptions = JSON.parse(shippingOptions);
//     }
//     // Ensure arrays/objects are valid
//     if (!shippingOptions || !Array.isArray(shippingOptions)) {
//       shippingOptions = [];
//     }
//     if (!location || typeof location !== "object") {
//       location = {};
//     }
//     let imageUrls = [];
//     if (req.files && req.files.length) {
//       imageUrls = req.files.map((file) => `/uploads/${file.filename}`);
//     }

//     const product = await Product.create({
//       seller,
//       title,
//       description,
//       price,
//       category,
//       images: imageUrls,
//       quantity,
//       location,
//       shippingOptions,
//     });

//     res.status(201).json({ success: true, product });
//   } catch (error) {
//     console.error("Create product error:", error.message);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
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

    // Debug: log files received

    // Build image URLs
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map((file) => `/uploads/${file.filename}`);
    }

    // Parse location and shippingOptions if they are strings
    let parsedLocation = {};
    let parsedShippingOptions = [];
    try {
      if (location)
        parsedLocation =
          typeof location === "string" ? JSON.parse(location) : location;
      if (shippingOptions)
        parsedShippingOptions =
          typeof shippingOptions === "string"
            ? JSON.parse(shippingOptions)
            : shippingOptions;
    } catch (err) {
      console.error("Parse error:", err);
    }

    const product = await Product.create({
      seller,
      title,
      description,
      price: Number(price),
      category,
      images: imageUrls,
      quantity: Number(quantity),
      location: parsedLocation,
      shippingOptions: parsedShippingOptions,
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// const getProducts = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 20,
//       category,
//       minPrice,
//       maxPrice,
//       search,
//       sellerId,
//     } = req.query;
//     const filter = { status: "active" };
//     if (category) filter.category = category;
//     if (sellerId) filter.seller = sellerId;
//     if (minPrice || maxPrice) {
//       filter.price = {};
//       if (minPrice) filter.price.$gte = Number(minPrice);
//       if (maxPrice) filter.price.$lte = Number(maxPrice);
//     }
//     if (search) filter.$text = { $search: search };

//     const products = await Product.find(filter)
//       .populate("seller", "name email profilePicture location")
//       .populate("category")
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await Product.countDocuments(filter);

//     res.json({
//       success: true,
//       products,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page,
//       total,
//     });
//   } catch (error) {
//     console.error("Get products error:", error.message);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };
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

    // Handle sellerId = 'me' for authenticated user's own products
    if (sellerId === "me") {
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "Authentication required" });
      }
      filter.seller = req.user._id;
    } else if (sellerId) {
      filter.seller = sellerId;
    }

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
    console.error("Get products error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id })
      .populate("category")
      .sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    console.error("Get my products error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
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
    console.error("Get product error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// const updateProduct = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product)
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });
//     if (
//       product.seller.toString() !== req.user._id.toString() &&
//       req.user.role !== "admin"
//     ) {
//       return res.status(403).json({ success: false, message: "Unauthorized" });
//     }

//     const allowedUpdates = [
//       "title",
//       "description",
//       "price",
//       "quantity",
//       "shippingOptions",
//       "location",
//     ];
//     allowedUpdates.forEach((field) => {
//       if (req.body[field] !== undefined) product[field] = req.body[field];
//     });
//     await product.save();
//     res.json({ success: true, product });
//   } catch (error) {
//     console.error("Update product error:", error.message);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };
// const updateProduct = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product)
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });
//     if (
//       product.seller.toString() !== req.user._id.toString() &&
//       req.user.role !== "admin"
//     ) {
//       return res.status(403).json({ success: false, message: "Unauthorized" });
//     }

//     // Handle image updates
//     let existingImages = [];
//     let removedImages = [];
//     if (req.body.existingImages) {
//       existingImages = JSON.parse(req.body.existingImages);
//     }
//     if (req.body.removedImages) {
//       removedImages = JSON.parse(req.body.removedImages);
//     }
//     // Remove deleted images from filesystem (optional)
//     // Combine existing (that weren't removed) + new uploaded images
//     let finalImages = [...existingImages];
//     if (req.files && req.files.length) {
//       const newImageUrls = req.files.map((file) => `/uploads/${file.filename}`);
//       finalImages.push(...newImageUrls);
//     }
//     product.images = finalImages;
//     // Update other fields
//     const allowedUpdates = [
//       "title",
//       "description",
//       "price",
//       "quantity",
//       "shippingOptions",
//       "location",
//     ];
//     allowedUpdates.forEach((field) => {
//       if (req.body[field] !== undefined) product[field] = req.body[field];
//     });
//     await product.save();
//     res.json({ success: true, product });
//   } catch (error) {
//     console.error("Update product error:", error.message);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
// Update product (with image management)
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

    // Parse incoming data
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

    // Handle existing images (keep those not removed)
    let currentImages = product.images || [];
    if (existingImages) {
      // existingImages is an array of image URLs that should remain
      const parsedExisting = Array.isArray(existingImages)
        ? existingImages
        : JSON.parse(existingImages);
      currentImages = parsedExisting;
    }

    // Remove images marked for deletion
    if (removedImages) {
      const removed = Array.isArray(removedImages)
        ? removedImages
        : JSON.parse(removedImages);
      currentImages = currentImages.filter((img) => !removed.includes(img));
    }

    // Add newly uploaded images (local file paths)
    let newImageUrls = [];
    if (req.files && req.files.length) {
      newImageUrls = req.files.map((file) => `/uploads/${file.filename}`);
    }

    // Combine: keep existing (filtered) + new uploads, limit to 5
    const finalImages = [...currentImages, ...newImageUrls].slice(0, 5);

    // Update other fields
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
    console.error("Delete product error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: "active", isFeatured: true })
      .limit(8)
      .populate("seller", "name")
      .populate("category");
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getMyProducts,
};
