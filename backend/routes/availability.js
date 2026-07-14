const express = require("express");
const moment = require("moment");
const router = express.Router();
const User = require("../models/User");
const TutorProfile = require("../models/TutorProfile");

// Get tutor availability
router.get("/:id", async (req, res) => {
    try {
        const tutor = await User.findById(req.params.id);

        if (!tutor || tutor.role !== "Tutor") {
            return res.status(404).json({ message: "Tutor not found" });
        }

        // Filter out any invalid or weekend availability
        const validAvailability = tutor.availability.filter(slot => 
            slot.startTime !== "00:00" && 
            slot.endTime !== "00:00" &&
            !['Saturday', 'Sunday'].includes(slot.day)
        );

        res.status(200).json(validAvailability);
    } catch (err) {
        console.error("Error fetching availability:", err);
        res.status(500).json({ message: "Failed to fetch availability" });
    }
});

// Submit availability
router.post("/:id/submit", async (req, res) => {
    const { availability } = req.body;

    if (!Array.isArray(availability)) {
        return res.status(400).json({ message: "Invalid availability format" });
    }

    try {
        const tutor = await User.findById(req.params.id);

        if (!tutor || tutor.role !== "Tutor") {
            return res.status(404).json({ message: "Tutor not found" });
        }

        // Validate and sort availability by day
        const validAvailability = availability
            .filter(slot => {
                // Validate time format
                const isValidTime = (time) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
                // Only accept weekdays
                const isWeekday = !['Saturday', 'Sunday'].includes(slot.day);
                return isValidTime(slot.startTime) && isValidTime(slot.endTime) && isWeekday;
            })
            .sort((a, b) => {
                const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                return days.indexOf(a.day) - days.indexOf(b.day);
            });

        // Update tutor's availability with only the valid slots
        tutor.availability = validAvailability;
        await tutor.save();

        res.status(200).json({ message: "Availability successfully updated" });
    } catch (err) {
        console.error("Error submitting availability:", err);
        res.status(500).json({ message: "Failed to submit availability" });
    }
});

// Helper: merge overlapping or consecutive time ranges
function mergeTimeRanges(slots) {
  if (!slots.length) return [];

  // Sort by start time
  slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  const merged = [];
  let current = { ...slots[0] };

  for (let i = 1; i < slots.length; i++) {
    const next = slots[i];

    if (current.endTime >= next.startTime) {
      current.endTime = next.endTime > current.endTime ? next.endTime : current.endTime;
    } else {
      merged.push({ ...current });
      current = { ...next };
    }
  }

  merged.push(current);
  return merged.map(r => `${r.startTime}–${r.endTime}`);
}

// Route to Get weekly availability of tutors
// I had to use both model because user Model doesn't have profilepic
router.get("/week/:startDate", async (req, res) => {
  const { startDate } = req.params;
  const start = new Date(startDate);
  const weekDates = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(Date.UTC(start.getUTCFullYear(), 
    start.getUTCMonth(), start.getUTCDate() + i));

    weekDates.push(day.toISOString().split("T")[0]);
  }

  try {
    // Get all tutors
    const baseTutors = await User.find({ role: "Tutor" }).lean();

    // Get their extended profile data
    const tutorProfiles = await TutorProfile.find({
      userId: { $in: baseTutors.map(t => t._id) }
    }).lean();

    // Merge into complete tutor objects
    const tutors = baseTutors.map(tutor => {
      const profile = tutorProfiles.find(p => p.userId.toString() === tutor._id.toString());
      return {
        _id: tutor._id,
        availability: tutor.availability || [],
        name: profile?.name || `${tutor.firstName || ""} ${tutor.lastName || ""}`.trim(),
        profilePic: profile?.profilePicture || "",
      };
    });

    const availabilityMap = {};

    for (let date of weekDates) {
      const dayOfWeek = new Date(date).toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "America/Chicago",
      });

      availabilityMap[date] = tutors
        .filter(tutor => tutor.availability?.some(a => a.day === dayOfWeek))
        .sort((a,b) => a.name.localeCompare(b.name))
        .map(tutor => {
          const slotsForDay = tutor.availability.filter(a => a.day === dayOfWeek);
          const slotStrings = mergeTimeRanges(slotsForDay);

          return {
            tutorId: tutor._id,
            name: tutor.name,
            profilePic: tutor.profilePic,
            slots: slotStrings,
          };
        });
    }

    res.json(availabilityMap);
  } catch (err) {
    console.error("Error fetching weekly availability:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;