const express = require("express");
const Booking = require("../models/Booking");
const authMiddleware = require("../middleware/authMiddleware");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// ─── Validation ───────────────────────────────────────────────
const validateBooking = [
  body("bookingName").notEmpty().withMessage("Booking name is required"),
  body("mobile")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Enter a valid 10-digit mobile number"),
  body("seats")
    .isIn(["4", "6", "7", "10"])
    .withMessage("Seats must be 4, 6, 7, or 10"),
  body("fromPlace").notEmpty().withMessage("From place is required"),
  body("toPlace").notEmpty().withMessage("To place is required"),
  body("pickupDate").isISO8601().withMessage("Invalid pickup date"),
  body("peopleCount").isInt({ min: 1 }).withMessage("People count must be at least 1"),
];

// ─── CREATE BOOKING ────────────────────────────────────────────
router.post("/", authMiddleware, validateBooking, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const {
      bookingName, mobile, seats, fromPlace, toPlace,
      pickupDate, peopleCount, menCount, womenCount, childrenCount
    } = req.body;

    const men = Number(menCount) || 0;
    const women = Number(womenCount) || 0;
    const children = Number(childrenCount) || 0;

    if (men + women + children !== Number(peopleCount)) {
      return res.status(400).json({ message: "People count mismatch (men + women + children ≠ total)" });
    }

    const booking = await Booking.create({
      user: req.user.id,
      bookingName,
      mobile,
      seats,
      fromPlace,
      toPlace,
      pickupDate: new Date(pickupDate),
      peopleCount,
      menCount: men,
      womenCount: women,
      childrenCount: children,
    });

    res.status(201).json({ message: "Booking placed successfully", booking });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Booking failed" });
  }
});

// ─── GET MY BOOKINGS ───────────────────────────────────────────
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

// ─── GET ALL BOOKINGS (ADMIN ONLY) ─────────────────────────────
router.get("/all", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    // Populate user to get their name/email
    const bookings = await Booking.find().populate("user", "name email").sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch all bookings" });
  }
});

// ─── CANCEL BOOKING ────────────────────────────────────────────
router.patch("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    if (booking.status === "approved") {
      return res.status(400).json({ message: "Approved bookings cannot be cancelled. Please contact support." });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Booking cancelled successfully", booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to cancel booking" });
  }
});

// ─── ADMIN UPDATE BOOKING (Approve/Reject) ─────────────────────
router.patch("/:id/admin-update", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const { status, distance, amount } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Update fields
    if (status) booking.status = status;
    if (distance) booking.distance = Number(distance);
    if (amount) booking.amount = Number(amount);

    await booking.save();

    res.json({ message: `Booking ${status} successfully`, booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update booking" });
  }
});

module.exports = router;
