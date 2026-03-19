const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // register OTP doesn't have user yet
    },

    email: {
      type: String,
      required: true,
    },

    otp: {
      type: String, // hashed OTP
      required: true,
    },

    purpose: {
      type: String,
      enum: ["register", "login", "forgot_password"],
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Auto delete OTP after expiry
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Otp", otpSchema);
