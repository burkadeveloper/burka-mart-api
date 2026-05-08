const mongoose = require("mongoose");

const adminSettingsSchema = new mongoose.Schema({
  commissionGlobal: { type: Number, default: 5.0 },
  minCommissionCap: Number,
  maxCommissionCap: Number,
  shippingDefaultRates: [
    {
      region: String,
      standardCost: Number,
      expressCost: Number,
    },
  ],
  emailTemplates: {
    welcome: String,
    orderConfirmation: String,
    shippingUpdate: String,
  },

  featureToggles: {
    enableChat: { type: Boolean, default: true },
    enableMessaging: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
  },
  updatedAt: Date,
});

module.exports = mongoose.model("AdminSettings", adminSettingsSchema);
