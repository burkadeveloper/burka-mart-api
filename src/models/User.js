const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  isSeller: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationTokenExpires: Date,
  profilePicture: { type: String, default: "" },
  location: {
    city: String,
    subCity: String,
    woreda: String,
    coordinates: { lat: Number, lng: Number }, // for map
  },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
  },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: String,
  status: {
    type: String,
    enum: ["active", "suspended", "banned"],
    default: "active",
  },
  bankAccountName: { type: String, default: "" },
  bankAccountNumber: { type: String, default: "" },
  bankCode: { type: String, default: "" },
  teleBirrNumber: { type: String, default: "" },
  preferredPayoutMethod: {
    type: String,
    enum: ["bank", "teleBirr"],
    default: "bank",
  },
  refreshToken: String,
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
