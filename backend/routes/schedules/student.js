const express = require("express");
const router = express.Router();
const Session = require("../../models/Session");

// Get schedule for a student
router.get("/student/:studentID", async (req, res) => {
    try {
        const sessions = await Session.find({ studentID: req.params.studentID })
            .populate("tutorID", "firstname lastname") // Fetch tutor details
            .sort({ sessionTime: 1 }); // Sort by session time
        res.status(200).json(sessions);
    } catch (err) {
        console.error("Error fetching student schedule:", err);
        res.status(500).json({ message: "Failed to fetch student schedule" });
    }
});

module.exports = router;