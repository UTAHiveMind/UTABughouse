const express = require("express");
const router = express.Router();
const Session = require("../../models/Session");

// Get schedule for a tutor
router.get("/tutor/:tutorID", async (req, res) => {
    try {
        const sessions = await Session.find({ tutorID: req.params.tutorID })
            .populate("studentID", "firstname lastname") // Fetch student details
            .sort({ sessionTime: 1 }); // Sort by session time
    } catch (err) {
        console.error("Error fetching tutor schedule:", err);
        res.status(500).json({ message: "Failed to fetch tutor schedule" });
    }
});

module.exports = router;
