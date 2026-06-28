const mongoose = require("mongoose");
const {
  DAYS,
  DEFAULT_CENTER_AVAILABILITY,
} = require("../utils/centerAvailability");

const centerAvailabilitySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: DAYS,
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    startTime: {
      type: String,
      default: "00:00",
    },
    endTime: {
      type: String,
      default: "23:59",
    },
  },
  { _id: false }
);

const bugHouseSchema = new mongoose.Schema(
  {
    logo: {
      type: String, // Will store base64 string
      required: false,
    },
    contactInfo: {
      email: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    
    tutorRequestsEnabled: {
      type: Boolean,
      default: true,
    },

    centerAvailability: {
      type: [centerAvailabilitySchema],
      default: DEFAULT_CENTER_AVAILABILITY,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BugHouse", bugHouseSchema, 'bugHouse');
