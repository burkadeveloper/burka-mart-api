const mongoose = require("mongoose");

const sellerRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  businessType: { type: String, enum: ["individual", "shop"], required: true },
  // Personal info (for individuals)
  fullName: { type: String },
  dateOfBirth: { type: Date },
  nationalIdNumber: { type: String },
  // Business info (for shops)
  businessName: { type: String },
  registrationNumber: { type: String },
  tinNumber: { type: String },
  businessAddress: { type: String },
  // Common fields
  address: { type: String },
  phone: { type: String },
  // Document URLs
  documents: {
    nationalId: { type: String },
    passport: { type: String },
    utilityBill: { type: String },
    businessLicense: { type: String },
    tinCertificate: { type: String },
    additionalDocs: [{ type: String }],
    selfie: { type: String },
  },
  status: {
    type: String,
    enum: ["pending", "in_review", "approved", "rejected", "more_info_needed"],
    default: "pending",
  },
  adminNote: { type: String },
  adminComments: [
    { comment: String, createdAt: { type: Date, default: Date.now } },
  ],
  reviewedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SellerRequest", sellerRequestSchema);
