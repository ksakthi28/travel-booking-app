const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");

const User = require("../models/User");
const Otp = require("../models/Otp");
const sendEmail = require("../utils/sendEmail");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ─── Rate Limiters ────────────────────────────────────────────
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: "Too many OTP attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Validation Rules ─────────────────────────────────────────
const validateRegister = [
  body("email").isEmail().withMessage("Invalid email address"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("name").notEmpty().withMessage("Name is required"),
];

const validateLogin = [
  body("email").isEmail().withMessage("Invalid email address"),
  body("password").notEmpty().withMessage("Password is required"),
];

const validateChangePassword = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
];

// ─── Helper ───────────────────────────────────────────────────
function handleValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return true;
  }
  return false;
}

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role }, // role in payload → no extra DB call needed
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

// ─── Routes ───────────────────────────────────────────────────

// 🧾 REGISTER
router.post("/register", validateRegister, async (req, res) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔐 LOGIN — generic error prevents user enumeration
router.post("/login", loginLimiter, validateLogin, async (req, res) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    // Generic message — don't reveal whether email exists
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = signToken(user);
    res.status(200).json({ message: "Login successful", token });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed" });
  }
});

// 👤 GET LOGGED IN USER
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to get user" });
  }
});

// 👥 GET ALL USERS (ADMIN ONLY)
router.get("/users", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// 📩 SEND OTP — rate limited to 5 per 15 min
router.post("/send-otp", otpLimiter, async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return res.status(400).json({ message: "Email and purpose are required" });
    }

    const user = await User.findOne({ email });

    if (purpose === "register" && user) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (purpose !== "register" && !user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Generate and hash OTP
    const plainOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(plainOtp).digest("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Delete any previous OTPs for this user+purpose
    if (user) {
      await Otp.deleteMany({ userId: user._id, purpose });
    }

    await Otp.create({
      email,
      userId: user ? user._id : null,
      otp: hashedOtp,
      purpose,
      expiresAt,
    });

    await sendEmail(
      email,
      "Your OTP Code",
      `Your OTP is ${plainOtp}. It is valid for 5 minutes.`
    );

    res.status(200).json({ message: "OTP sent successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// ✅ VERIFY OTP — rate limited
router.post("/verify-otp", otpLimiter, async (req, res) => {
  try {
    const { email, otp, purpose, name, password, newPassword } = req.body;

    if (!email || !otp || !purpose) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const otpRecord = await Otp.findOne({ email, purpose });
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP not found or expired" });
    }

    if (otpRecord.expiresAt < new Date()) {
      await otpRecord.deleteOne();
      return res.status(400).json({ message: "OTP expired" });
    }

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    if (hashedOtp !== otpRecord.otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // 🔹 REGISTER FLOW
    if (purpose === "register") {
      if (!name || !password) {
        return res.status(400).json({ message: "Name and password required" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        isVerified: true,
      });

      await otpRecord.deleteOne();
      const token = signToken(user);

      return res.status(201).json({ message: "Registration successful", token });
    }

    // 🔹 LOGIN FLOW
    if (purpose === "login") {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await otpRecord.deleteOne();
      const token = signToken(user);

      return res.status(200).json({ message: "Login successful", token });
    }

    // 🔹 FORGOT PASSWORD FLOW
    if (purpose === "forgot_password") {
      if (!newPassword) {
        return res.status(400).json({ message: "New password required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
      await otpRecord.deleteOne();

      return res.status(200).json({ message: "Password reset successful" });
    }

    res.status(400).json({ message: "Invalid purpose" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "OTP verification failed" });
  }
});

// 🔐 CHANGE PASSWORD (Logged-in user)
router.post("/change-password", authMiddleware, validateChangePassword, async (req, res) => {
  try {
    if (handleValidationErrors(req, res)) return;

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to change password" });
  }
});

module.exports = router;
