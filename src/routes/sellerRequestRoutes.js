const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const {
  submitRequest,
  getRequests,
  updateRequestStatus,
} = require("../controllers/sellerRequestController");
const upload = require("../config/multer");
const router = express.Router();

const uploadFields = upload.fields([
  { name: "nationalId", maxCount: 1 },
  { name: "passport", maxCount: 1 },
  { name: "utilityBill", maxCount: 1 },
  { name: "businessLicense", maxCount: 1 },
  { name: "tinCertificate", maxCount: 1 },
  { name: "selfie", maxCount: 1 },
]);
router.post("/submit", protect, uploadFields, submitRequest);
router.get("/admin", protect, adminOnly, getRequests);
router.put("/admin/:requestId/status", protect, adminOnly, updateRequestStatus);

module.exports = router;
