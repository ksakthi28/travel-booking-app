require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function createAdmin() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("❌ MONGODB_URI is not defined in .env");
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    const adminEmail = "admin@example.com";
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`⚠️ Admin user ${adminEmail} already exists!`);
      process.exit(0);
    }

    // Create new admin
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    await User.create({
      name: "Super Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isVerified: true
    });

    console.log("🎉 Admin user created successfully!");
    console.log("-----------------------------------------");
    console.log(`Email:    ${adminEmail}`);
    console.log("Password: admin123");
    console.log("-----------------------------------------");
    console.log("You can now login at http://localhost:5000/login.html");

  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    process.exit(0);
  }
}

createAdmin();
