const mongoose = require("mongoose");

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

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BugHouse", bugHouseSchema, 'bugHouse');
