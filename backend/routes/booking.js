const express = require("express");
const Booking = require("../models/Booking");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// 📋 GET MY BOOKINGS (PROTECTED)
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id });
    res.status(200).json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

// 🚗 CREATE BOOKING (PROTECTED)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { carName, pickupDate, dropDate } = req.body;

    const booking = new Booking({
      user: req.user.id,
      carName,
      pickupDate,
      dropDate
    });

    await booking.save();

    res.status(201).json({
      message: "Booking created successfully",
      booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Booking failed" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // 🔐 Ensure user owns this booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await booking.deleteOne();
    res.json({ message: "Booking deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
