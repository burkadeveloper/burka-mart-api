const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Category = require("../models/Category");
const AdminSettings = require("../models/AdminSettings");
const connectDB = require("../config/db");

const seed = async () => {
  await connectDB();

  // Create admin if not exists
  const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (!adminExists) {
    await User.create({
      name: "Super Admin",
      email: process.env.ADMIN_EMAIL,
      phone: "0911111111",
      password: process.env.ADMIN_PASSWORD,
      role: "admin",
      isSeller: true,
      isVerified: true,
      status: "active",
    });
    // console.log("Admin user created");
  }

  // Default categories
  const categories = [
    "Electronics",
    "Fashion",
    "Home & Garden",
    "Books",
    "Health & Beauty",
  ];
  for (const cat of categories) {
    await Category.findOneAndUpdate(
      { slug: cat.toLowerCase().replace(/&/g, "and").replace(/ /g, "-") },
      {
        name: cat,
        slug: cat.toLowerCase().replace(/&/g, "and").replace(/ /g, "-"),
        isActive: true,
      },
      { upsert: true },
    );
  }

  // Default settings
  await AdminSettings.findOneAndUpdate(
    {},
    {
      commissionGlobal: 5.0,
      featureToggles: {
        enableChat: true,
        enableMessaging: true,
        maintenanceMode: false,
      },
    },
    { upsert: true },
  );

  // console.log("Seeding complete");
  process.exit();
};

seed();
