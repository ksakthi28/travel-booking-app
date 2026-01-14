const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ SERVE FRONTEND FILES (THIS FIXES EVERYTHING)
app.use(express.static(path.join(__dirname, "../frontend")));

// Routes
app.use("/api/bookings", require("./routes/booking"));
app.use("/api/auth", require("./routes/auth")); // if exists

module.exports = app;
