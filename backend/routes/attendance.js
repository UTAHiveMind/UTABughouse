const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const User = require('../models/User');
const TutorProfile = require('../models/TutorProfile');

async function findUserForSwipe({ cardID, firstName, lastName, studentID }) {
  let user = null;
  if (cardID) user = await User.findOne({ cardID });
  if (!user && studentID) user = await User.findOne({ studentID });
  if (!user && firstName && lastName) {
    user = await User.findOne({
      firstName: new RegExp(`^${firstName}$`, 'i'),
      lastName: new RegExp(`^${lastName}$`, 'i'),
    });
  }
  if (user && !user.cardID && cardID) {
    user.cardID = cardID;
    await user.save();
  }
  return user;
}

async function findUserForIdInput(idInput) {
  let user = await User.findOne({ cardID: idInput });

  if (!user && mongoose.Types.ObjectId.isValid(idInput)) {
    user = await User.findById(idInput);
  }

  if (!user) {
    user = await User.findOne({ studentID: idInput });
  }

  if (!user) {
    const profile = await TutorProfile.findOne({ studentID: idInput });
    if (profile) {
      user = await User.findById(profile.userId);
    }
  }

  return user;
}

// Shared attendance check-in/out logic
async function handleAttendanceForUser(user, res) {
  try {
    const now = new Date();
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);

    let sessionsToday = [];

    if (user.role === 'Tutor') {
      sessionsToday = await Session.find({
        tutorID: user._id,
        sessionTime: { $gte: startOfDay, $lte: endOfDay },
        status: 'Scheduled'
      })
      .populate('studentID', 'firstName lastName')
      .populate('tutorID', 'firstName lastName');
    } else if (user.role === 'Student') {
      sessionsToday = await Session.find({
        studentID: user._id,
        sessionTime: { $gte: startOfDay, $lte: endOfDay },
        status: 'Scheduled'
      })
      .populate('studentID', 'firstName lastName')
      .populate('tutorID', 'firstName lastName');
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported user role.' });
    }

    if (!sessionsToday.length) {
      return res.status(404).json({ success: false, message: "No scheduled session found for today." });
    }

    const closestSession = sessionsToday.reduce((prev, curr) => {
      return Math.abs(new Date(curr.sessionTime) - now) < Math.abs(new Date(prev.sessionTime) - now)
        ? curr : prev;
    });

    const sessionEnd = new Date(closestSession.sessionTime.getTime() + closestSession.duration * 60000);

    let attendance;
    if (user.role === 'Tutor') {
      attendance = await Attendance.findOne({ sessionID: closestSession._id, tutorID: user._id });
    } else if (user.role === 'Student') {
      attendance = await Attendance.findOne({ sessionID: closestSession._id, studentID: user._id });
    }

    // Case 1: No attendance yet — CHECK IN
    if (!attendance || attendance.wasNoShow === true) {
      const diffInMinutes = (now - closestSession.sessionTime) / 60000;
      let checkInStatus = 'On Time';
      if (diffInMinutes < -5) checkInStatus = 'Early';
      else if (diffInMinutes > 5) checkInStatus = 'Late';

      if (user.role === 'Tutor') {
        attendance = new Attendance({
          sessionID: closestSession._id,
          tutorID: user._id,
          checkInTime: now,
          checkInStatus,
          wasNoShow: false
        });
        await attendance.save();
        message = `Tutor ${user.firstName} checked in for their session with student ${closestSession.studentID.firstName}.`;
      } else if (user.role === 'Student') {
        attendance = new Attendance({
          sessionID: closestSession._id,
          studentID: user._id,
          checkInTime: now,
          checkInStatus,
          wasNoShow: false
        });
        await attendance.save();
        message = `Checked in for session with tutor ${closestSession.tutorID.firstName}.`;
      }

      return res.status(201).json({
        success: true,
        message,
        session: {
          tutorName: `${closestSession.tutorID.firstName} ${closestSession.tutorID.lastName}`,
          studentName: `${closestSession.studentID.firstName} ${closestSession.studentID.lastName}`,
          sessionTime: closestSession.sessionTime,
          duration: closestSession.duration
        }
      });
    }
    // Case 2: Already checked in, not yet checked out — CHECK OUT
    else if (!attendance.checkOutTime) {
      const duration = Math.max(1, Math.round((now - attendance.checkInTime) / 60000));
      let checkOutStatus = 'On Time';
      if (now < sessionEnd) checkOutStatus = 'Early';
      else if (now > sessionEnd.getTime() + 5 * 60000) checkOutStatus = 'Late';

      attendance.checkOutTime = now;
      attendance.duration = duration;
      attendance.checkOutStatus = checkOutStatus;
      attendance.updatedAt = new Date();
      await attendance.save();

      message = user.role === 'Tutor'
        ? `Tutor ${user.firstName} checked out from their session with student ${closestSession.studentID.firstName}. Duration: ${duration} minutes.`
        : `Checked out from session with tutor ${closestSession.tutorID.firstName}. Duration: ${duration} minutes.`;

      return res.status(200).json({
        success: true,
        message,
        session: {
          tutorName: `${closestSession.tutorID.firstName} ${closestSession.tutorID.lastName}`,
          studentName: `${closestSession.studentID.firstName} ${closestSession.studentID.lastName}`,
          sessionTime: closestSession.sessionTime,
          duration
        }
      });
    }
    // Case 3: Already fully checked in and out
    else {
      return res.status(200).json({
        success: true,
        message: "Already checked in and out for this session.",
        session: {
          tutorName: `${closestSession.tutorID.firstName} ${closestSession.tutorID.lastName}`,
          studentName: `${closestSession.studentID.firstName} ${closestSession.studentID.lastName}`,
          sessionTime: closestSession.sessionTime,
          duration: closestSession.duration
        }
      });
    }
  } catch (error) {
    console.error("Error in attendance handler:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}

// GET all attendance records
router.get('/all', async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find()
      .populate('studentID', 'firstName lastName')
      .populate({
        path: 'sessionID',
        populate: { path: 'tutorID', select: 'firstName lastName' }
      });
    res.json(attendanceRecords);
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    res.status(500).json({
      message: 'Error fetching attendance records',
      error: error.message
    });
  }
});

router.get('/fromDtoD', async (req, res) => {
  try {
    const {fromDate, toDate} = req.query;

    const start = new Date(fromDate);
    const end = new Date(toDate);

    //Check to see if date value is not a number
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        message: 'Invalid date format provided. Please use YYYY-MM-DD.' 
      });
    }

    const attendanceRecords = await Attendance.find()
    .populate('studentID', 'firstName lastName')
    .populate({path: 'sessionID', 
              match: {
                  sessionTime: {
                      $gte: start,
                      $lte: end
                  }
              }, populate: {
                      path: 'tutorID',
                      select: 'firstName lastName'
              }});
    const filterRecords = attendanceRecords.filter(record => record.sessionID !== null);
    res.json(filterRecords);
  } catch (error) {
      console.error("Error fetching attendance records:", error);
      res.status(500).json({
        message: 'Error fetching attendance records',
        error: error.message
      });
  }
});

// POST /check for swipe (cardID, studentID, or names)
router.post('/check', async (req, res) => {
  const { cardID, firstName, lastName, studentID } = req.body;

  try {
    const user = await findUserForSwipe({ cardID, firstName, lastName, studentID });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return await handleAttendanceForUser(user, res);

  } catch (error) {
    console.error("Error checking card:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// Public login-screen card swipe: identify user only (no session / attendance logic)
router.post('/public-welcome', async (req, res) => {
  const { idInput, cardID, firstName, lastName, studentID } = req.body;

  try {
    let user = null;
    if (idInput !== undefined && idInput !== null && String(idInput).trim() !== '') {
      user = await findUserForIdInput(String(idInput).trim());
    } else {
      user = await findUserForSwipe({ cardID, firstName, lastName, studentID });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return res.status(200).json({
      success: true,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: displayName || 'Guest',
    });
  } catch (error) {
    console.error('Error in public-welcome:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.post('/manual-checkin', async (req, res) => {
  const { idInput } = req.body;

  try {
    if (idInput === undefined || idInput === null || String(idInput).trim() === '') {
      return res.status(400).json({ success: false, message: 'ID is required.' });
    }

    const user = await findUserForIdInput(String(idInput).trim());

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return await handleAttendanceForUser(user, res);

  } catch (error) {
    console.error('Error in manual check-in:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
