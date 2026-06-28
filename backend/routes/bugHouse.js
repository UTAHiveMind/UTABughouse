const express = require("express");
const router = express.Router();
const BugHouse = require("../models/BugHouse");
const multer = require('multer');
const upload = multer();
const {
  DEFAULT_CENTER_AVAILABILITY,
  normalizeCenterAvailability,
} = require("../utils/centerAvailability");

// Get BugHouse settings
router.get("/", async (req, res) => {
  try {
    let settings = await BugHouse.findOne();

    // Return a default object if nothing is in DB yet, fixes Logo bug
    if (!settings) {
      settings = new BugHouse({
        logo: "",
        contactInfo: {
          email: "",
          phone: "",
          address: "",
        },
        centerAvailability: DEFAULT_CENTER_AVAILABILITY,
      });
      await settings.save();
    }
    settings.centerAvailability = normalizeCenterAvailability(settings.centerAvailability);
    res.json(settings);
  } catch (error) {
    console.error("Error fetching BugHouse settings:", error);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});

// Update BugHouse settings (admin only)
router.put("/", upload.single('logo'), async (req, res) => {
  try {
    // Get contact info and the request boolean from body (it was sent as JSON string)
    const contactInfo = JSON.parse(req.body.contactInfo);
    const tutorRequestsEnabled = JSON.parse(req.body.tutorRequestsEnabled);
    const centerAvailability = normalizeCenterAvailability(
      req.body.centerAvailability ? JSON.parse(req.body.centerAvailability) : undefined
    );

    
    // Get logo file from multer
    let logo = null;
    if (req.file) {
      // Convert file buffer to base64
      logo = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    let settings = await BugHouse.findOne();

    if (!settings) {
      settings = new BugHouse({ 
        logo: logo,
        contactInfo: contactInfo,
        tutorRequestsEnabled,
        centerAvailability,
      });
    } else {
      if (logo) {
        settings.logo = logo;
      }
      settings.contactInfo = contactInfo;
      settings.tutorRequestsEnabled = tutorRequestsEnabled;
      settings.centerAvailability = centerAvailability;
    }

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error("Error updating BugHouse settings:", error);
    res.status(500).json({ message: "Failed to update settings" });
  }
});

module.exports = router;
