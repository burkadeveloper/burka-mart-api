const uploadImages = async (files) => {
  if (!files || files.length === 0) return [];
  return files.map((file) => `/uploads/${file.filename}`);
};

const uploadSingleImage = async (file) => {
  if (!file) return null;
  return `/uploads/${file.filename}`;
};

module.exports = { uploadImages, uploadSingleImage };
