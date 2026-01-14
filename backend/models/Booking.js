const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  carName: {
    type: String,
    required: true
  },
  pickupDate: {
    type: String,
    required: true
  },
  dropDate: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
