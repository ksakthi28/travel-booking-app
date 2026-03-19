const express = require("express");
const Booking = require("../models/Booking");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// 📋 GET ALL BOOKINGS (ADMIN ONLY)
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

// ✅ APPROVE BOOKING & SET AMOUNT
router.put("/:id/approve", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { distance, amount } = req.body;

    if (!distance || !amount) {
      return res.status(400).json({ message: "Distance and amount required" });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.distance = distance;
    booking.amount = amount;
    booking.status = "approved";

    await booking.save();

    res.json({
      message: "Booking approved successfully",
      booking
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Approval failed" });
  }
});

// ❌ CANCEL/REJECT BOOKING
router.put("/:id/cancel", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({
      message: "Booking cancelled successfully",
      booking
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Cancellation failed" });
  }
});

module.exports = router;
