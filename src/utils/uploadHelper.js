const cloudinary = require("../config/cloudinary");

/**
 * Upload a single file buffer to Cloudinary
 */
const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    uploadStream.end(buffer);
  });
};

/**
 * Upload multiple images (product images)
 */
const uploadImages = async (files) => {
  if (!files || files.length === 0) return [];
  const uploadPromises = files.map((file) =>
    uploadToCloudinary(file.buffer, "marketplace/products"),
  );
  const results = await Promise.all(uploadPromises);
  return results.map((r) => r.secure_url);
};

/**
 * Upload a single image (profile picture, single document)
 */
const uploadSingleImage = async (file, folder = "marketplace/avatars") => {
  if (!file) return null;
  const result = await uploadToCloudinary(file.buffer, folder);
  return result.secure_url;
};

module.exports = { uploadImages, uploadSingleImage };
