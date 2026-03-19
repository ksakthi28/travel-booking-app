const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

// Middleware — restrict CORS to same-site origin only
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:5000",
  credentials: true,
}));
app.use(express.json());

// ✅ SERVE FRONTEND FILES (THIS FIXES EVERYTHING)
app.use(express.static(path.join(__dirname, "../frontend")));

// Routes
app.use("/api/bookings", require("./routes/booking"));
app.use("/api/admin/bookings", require("./routes/adminBookings"));
app.use("/api/auth", require("./routes/auth")); // if exists

module.exports = app;
