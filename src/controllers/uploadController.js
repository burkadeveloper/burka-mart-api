const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = "uploads/chats/";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname),
    ),
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

const uploadFile = async (req, res) => {
  if (!req.file)
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  const fileUrl = `/uploads/chats/${req.file.filename}`;
  res.json({
    success: true,
    file: {
      url: fileUrl,
      name: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      type: req.file.mimetype.startsWith("image/")
        ? "image"
        : req.file.mimetype.startsWith("audio/")
          ? "audio"
          : "file",
    },
  });
};

module.exports = { uploadFile, upload };
