const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    bookingName: {
      type: String,
      required: true
    },

    mobile: {
      type: String,
      required: true
    },

    seats: {
      type: String,
      enum: ["4", "6", "7", "10"],
      required: true
    },

    fromPlace: {
      type: String,
      required: true
    },

    toPlace: {
      type: String,
      required: true
    },

    pickupDate: {
      type: Date,
      required: true
    },

    peopleCount: {
      type: Number,
      required: true
    },

    menCount: {
      type: Number,
      required: true
    },

    womenCount: {
      type: Number,
      required: true
    },

    childrenCount: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "approved", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
