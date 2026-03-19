const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    mobile: {
      type: String,
      required: true
    },

    password: {
      type: String,
      required: true
    },

    // 🔐 Role-based access
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    // ✅ Email verification status
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
