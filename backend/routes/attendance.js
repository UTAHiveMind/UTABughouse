const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const User = require('../models/User');
const TutorProfile = require('../models/TutorProfile');
const CardSwipeLog = require('../models/CardSwipeLog');
const BugHouse = require('../models/BugHouse');
const {
  DEFAULT_CENTER_AVAILABILITY,
  normalizeCenterAvailability,
} = require('../utils/centerAvailability');

const CHECK_IN_STATUSES = ['Early', 'On Time', 'Late', 'No Show', 'Cancelled'];
const CHECK_OUT_STATUSES = ['Early', 'On Time', 'Late', 'No Show', 'Cancelled', 'Timed Out'];
const VISIT_TYPES = ['Session', 'Walk-In'];
const TIMEOUT_SWEEP_INTERVAL_MS = 60 * 1000;

function requireAdmin(req, res, next) {
  if (req.session?.user?.role !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }

  return next();
}

function getDayName(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function getClosingDateForAttendance(checkInTime, centerAvailability) {
  const checkInDate = new Date(checkInTime);
  if (isNaN(checkInDate.getTime())) return null;

  const dayName = getDayName(checkInDate);
  const slot = normalizeCenterAvailability(centerAvailability).find(
    (availability) => availability.day === dayName
  );

  if (!slot || !slot.enabled || !slot.endTime) return null;

  const [hours, minutes] = slot.endTime.split(':').map(Number);
  const closingDate = new Date(checkInDate);
  closingDate.setHours(hours, minutes, 0, 0);

  return closingDate;
}

async function getCenterAvailabilitySettings() {
  const settings = await BugHouse.findOne();
  return normalizeCenterAvailability(
    settings?.centerAvailability || DEFAULT_CENTER_AVAILABILITY
  );
}

async function timeoutOpenStudentAttendance(now = new Date()) {
  const centerAvailability = await getCenterAvailabilitySettings();
  const openRecords = await Attendance.find({
    checkInTime: { $exists: true, $ne: null },
    $and: [
      {
        $or: [
          { checkOutTime: { $exists: false } },
          { checkOutTime: null }
        ]
      },
      {
        $or: [
          { studentID: { $exists: true, $ne: null } },
          { visitType: 'Walk-In' }
        ]
      }
    ]
  });

  const updates = openRecords.map(async (record) => {
    const closingDate = getClosingDateForAttendance(record.checkInTime, centerAvailability);

    if (!closingDate || now <= closingDate || new Date(record.checkInTime) > closingDate) {
      return null;
    }

    record.checkOutTime = closingDate;
    record.duration = Math.max(
      1,
      Math.round((closingDate - new Date(record.checkInTime)) / 60000)
    );
    record.checkOutStatus = 'Timed Out';
    record.updatedAt = now;
    return record.save();
  });

  const results = await Promise.all(updates);
  return results.filter(Boolean).length;
}

let timeoutSweepInProgress = false;

if (process.env.NODE_ENV !== 'test') {
  const timeoutSweep = setInterval(async () => {
    if (timeoutSweepInProgress || mongoose.connection.readyState !== 1) return;

    timeoutSweepInProgress = true;
    try {
      const timedOutCount = await timeoutOpenStudentAttendance();
      if (timedOutCount > 0) {
        console.log(`[AttendanceTimeout] Timed out ${timedOutCount} open attendance record(s).`);
      }
    } catch (error) {
      console.error('[AttendanceTimeout] Error timing out open attendance records:', error);
    } finally {
      timeoutSweepInProgress = false;
    }
  }, TIMEOUT_SWEEP_INTERVAL_MS);

  if (typeof timeoutSweep.unref === 'function') {
    timeoutSweep.unref();
  }
}

function parseOptionalDate(value, fieldName) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    const error = new Error(`${fieldName} must be a valid date.`);
    error.statusCode = 400;
    throw error;
  }

  return date;
}

function calculateDuration(checkInTime, checkOutTime) {
  if (!checkInTime || !checkOutTime) return undefined;
  return Math.max(1, Math.round((checkOutTime - checkInTime) / 60000));
}

async function findUserForSwipe({ cardID, firstName, lastName, studentID }) {
  let user = null;
  console.log("[UserLookup] findUserForSwipe called with:", { cardID, firstName, lastName, studentID });
  
  if (cardID) {
    console.log("[UserLookup] Searching by cardID:", cardID);
    user = await User.findOne({ cardID });
    if (user) console.log("[UserLookup] Found user by cardID");
  }
  
  if (!user && studentID) {
    console.log("[UserLookup] Searching by studentID:", studentID);
    user = await User.findOne({ studentID });
    if (user) console.log("[UserLookup] Found user by studentID");
  }
  
  if (!user && firstName && lastName) {
    console.log("[UserLookup] Searching by name:", firstName, lastName);
    user = await User.findOne({
      firstName: new RegExp(`^${firstName}$`, 'i'),
      lastName: new RegExp(`^${lastName}$`, 'i'),
    });
    if (user) console.log("[UserLookup] Found user by name");
  }
  
  if (!user) {
    console.log("[UserLookup] User not found");
    return null;
  }
  
  if (user && !user.cardID && cardID) {
    console.log("[UserLookup] Updating user with cardID:", cardID);
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

function normalizeIdNumber(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function getIdNumberFromSwipe({ idInput, cardID, studentID }) {
  return normalizeIdNumber(studentID || cardID || idInput);
}

// Helper function to log card swipes (for any swipe attempt, even if user not found)
async function logCardSwipeAttempt(swipeData, isWelcomeFlow = false, userFound = null, userRole = null) {
  try {
    if (userFound) {
      console.log("[CardSwipeLog] Logging card swipe for user:", userFound.firstName, userFound.lastName);
      const cardSwipeLog = new CardSwipeLog({
        userID: userFound._id,
        role: userFound.role,
        firstName: userFound.firstName,
        lastName: userFound.lastName,
        cardID: swipeData.cardID || null,
        studentID: userFound.studentID || null,
        swipeTime: new Date(),
        cardFormat: swipeData.cardFormat || 'Track1',
        isWelcomeFlow
      });
      await cardSwipeLog.save();
      console.log("[CardSwipeLog] Card swipe logged successfully:", cardSwipeLog._id);
    } else {
      // Log failed swipe attempts too for audit trail
      console.log("[CardSwipeLog] Logging failed swipe attempt with data:", swipeData);
      const cardSwipeLog = new CardSwipeLog({
        firstName: swipeData.firstName || "UNKNOWN",
        lastName: swipeData.lastName || "UNKNOWN",
        cardID: swipeData.cardID || null,
        studentID: swipeData.studentID || null,
        swipeTime: new Date(),
        cardFormat: swipeData.cardFormat || 'Track1',
        isWelcomeFlow,
        userID: null,
        role: userRole || "UNKNOWN"
      });
      await cardSwipeLog.save();
      console.log("[CardSwipeLog] Unknown user swipe logged:", cardSwipeLog._id);
    }
  } catch (error) {
    console.error("[CardSwipeLog] Error logging card swipe:", error);
  }
}

// Shared attendance check-in/out logic
async function handleAttendanceForUser(user, res) {
  try {
    await timeoutOpenStudentAttendance();

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
      let message = '';
      if (diffInMinutes < -5) checkInStatus = 'Early';
      else if (diffInMinutes > 5) checkInStatus = 'Late';

      if (user.role === 'Tutor') {
        attendance = new Attendance({
          sessionID: closestSession._id,
          tutorID: user._id,
          visitType: "Session",
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
          studentIdNumber: user.studentID || "",
          visitType: "Session",
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
      let message = '';
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
    await timeoutOpenStudentAttendance();

    const attendanceRecords = await Attendance.find()
      .sort({ createdAt: -1 })  //Show newest records first
      .limit(50)                //Limit initial results to 50 records for better performance
      .populate('studentID', 'firstName lastName studentID')
      .populate('tutorID', 'firstName lastName')
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

//Get Attendance records within a date range
router.get('/fromDtoD', async (req, res) => {
  try {
    await timeoutOpenStudentAttendance();

    const {fromDate, toDate} = req.query; //Extract query parameters from URL to get fromDate and toDate

    //Convert string to date object
    const start = new Date(fromDate);
    const end = new Date(toDate);

    //Check to see if date value is not a number or isValid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        message: 'Invalid date format provided. Please use YYYY-MM-DD.' 
      });
    }

    const attendanceRecords = await Attendance.find()
    .sort({ createdAt: -1 })
    .limit(500)   // Increase limit for filtered queries to avoid missing results
    .populate('studentID', 'firstName lastName studentID')
    .populate('tutorID', 'firstName lastName')
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
    // Keep sessions whose populated session is in range, and walk-ins by their check-in time.
    const filterRecords = attendanceRecords.filter(record => {
      if (record.visitType === "Walk-In") {
        const walkInDate = new Date(record.checkInTime || record.createdAt);
        return walkInDate >= start && walkInDate <= end;
      }

      return record.sessionID !== null;
    });
    res.json(filterRecords);  //Return the data back to the browser client
  } catch (error) { //Handle error
      console.error("Error fetching attendance records:", error);
      res.status(500).json({
        message: 'Error fetching attendance records',
        error: error.message
      });
  }
});

router.put('/:attendanceId', requireAdmin, async (req, res) => {
  try {
    const { attendanceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(attendanceId)) {
      return res.status(400).json({ success: false, message: 'Invalid attendance ID.' });
    }

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Attendance entry not found.' });
    }

    const {
      studentIdNumber,
      checkInTime,
      checkOutTime,
      checkInStatus,
      checkOutStatus,
      visitType,
      tutorID,
      duration,
      wasNoShow,
    } = req.body;

    const parsedCheckIn = parseOptionalDate(checkInTime, 'checkInTime');
    const parsedCheckOut = parseOptionalDate(checkOutTime, 'checkOutTime');

    if (parsedCheckIn !== undefined) attendance.checkInTime = parsedCheckIn;
    if (parsedCheckOut !== undefined) attendance.checkOutTime = parsedCheckOut;

    if (
      attendance.checkInTime &&
      attendance.checkOutTime &&
      attendance.checkOutTime < attendance.checkInTime
    ) {
      return res.status(400).json({
        success: false,
        message: 'Check-out time cannot be before check-in time.'
      });
    }

    if (studentIdNumber !== undefined) {
      attendance.studentIdNumber = normalizeIdNumber(studentIdNumber);
    }

    if (visitType !== undefined) {
      if (!VISIT_TYPES.includes(visitType)) {
        return res.status(400).json({ success: false, message: 'Invalid attendance type.' });
      }
      attendance.visitType = visitType;
    }

    if (tutorID !== undefined) {
      if (tutorID === null || tutorID === '') {
        attendance.tutorID = undefined;
      } else {
        if (!mongoose.Types.ObjectId.isValid(tutorID)) {
          return res.status(400).json({ success: false, message: 'Invalid tutor ID.' });
        }

        const tutor = await User.findOne({ _id: tutorID, role: 'Tutor' });
        if (!tutor) {
          return res.status(400).json({ success: false, message: 'Selected tutor was not found.' });
        }

        attendance.tutorID = tutor._id;
      }
    }

    if (checkInStatus !== undefined) {
      if (!CHECK_IN_STATUSES.includes(checkInStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid check-in status.' });
      }
      attendance.checkInStatus = checkInStatus;
    }

    if (checkOutStatus !== undefined) {
      if (!CHECK_OUT_STATUSES.includes(checkOutStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid check-out status.' });
      }
      attendance.checkOutStatus = checkOutStatus;
    }

    if (wasNoShow !== undefined) {
      attendance.wasNoShow = Boolean(wasNoShow);
    }

    if (duration !== undefined && duration !== '') {
      const numericDuration = Number(duration);
      if (!Number.isFinite(numericDuration) || numericDuration < 0) {
        return res.status(400).json({ success: false, message: 'Duration must be a positive number.' });
      }
      attendance.duration = Math.round(numericDuration);
    } else {
      const calculatedDuration = calculateDuration(attendance.checkInTime, attendance.checkOutTime);
      if (calculatedDuration !== undefined) attendance.duration = calculatedDuration;
    }

    attendance.updatedAt = new Date();
    await attendance.save();

    const updatedAttendance = await Attendance.findById(attendance._id)
      .populate('studentID', 'firstName lastName studentID')
      .populate('tutorID', 'firstName lastName')
      .populate({
        path: 'sessionID',
        populate: { path: 'tutorID', select: 'firstName lastName' }
      });

    return res.json({
      success: true,
      message: 'Attendance entry updated.',
      attendance: updatedAttendance
    });
  } catch (error) {
    console.error('Error updating attendance entry:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error updating attendance entry'
    });
  }
});

router.delete('/:attendanceId', requireAdmin, async (req, res) => {
  try {
    const { attendanceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(attendanceId)) {
      return res.status(400).json({ success: false, message: 'Invalid attendance ID.' });
    }

    const deletedAttendance = await Attendance.findByIdAndDelete(attendanceId);
    if (!deletedAttendance) {
      return res.status(404).json({ success: false, message: 'Attendance entry not found.' });
    }

    return res.json({ success: true, message: 'Attendance entry deleted.' });
  } catch (error) {
    console.error('Error deleting attendance entry:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting attendance entry',
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
      // Log the failed attempt (for audit trail)
      await logCardSwipeAttempt({ cardID, cardFormat: 'Track1', firstName, lastName, studentID }, false, null);
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Log the card swipe
    await logCardSwipeAttempt({ cardID, cardFormat: 'Track1' }, false, user);

    return await handleAttendanceForUser(user, res);

  } catch (error) {
    console.error("Error checking card:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

router.post('/walk-in', async (req, res) => {
  const { idInput, cardID, firstName, lastName, studentID } = req.body;
  const idNumber = getIdNumberFromSwipe({ idInput, cardID, studentID });

  try {
    await timeoutOpenStudentAttendance();

    if (!idNumber) {
      return res.status(400).json({ success: false, message: 'Student ID is required.' });
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const openWalkIn = await Attendance.findOne({
      visitType: "Walk-In",
      studentIdNumber: idNumber,
      checkInTime: { $gte: startOfDay, $lte: endOfDay },
      $or: [
        { checkOutTime: { $exists: false } },
        { checkOutTime: null }
      ]
    }).sort({ checkInTime: -1, createdAt: -1 });

    if (openWalkIn) {
      const duration = Math.max(1, Math.round((now - openWalkIn.checkInTime) / 60000));

      openWalkIn.checkOutTime = now;
      openWalkIn.duration = duration;
      openWalkIn.updatedAt = now;
      await openWalkIn.save();

      await logCardSwipeAttempt({
        cardID: cardID || idInput || studentID,
        cardFormat: cardID ? 'Track1' : (studentID ? 'Track2' : 'Manual'),
        firstName,
        lastName,
        studentID: idNumber
      }, true, null, "Walk-In");

      return res.status(200).json({
        success: true,
        action: "check-out",
        message: `Walk-in ID ${idNumber} checked out. Duration: ${duration} minutes.`,
        attendance: openWalkIn
      });
    }

    const attendance = new Attendance({
      visitType: "Walk-In",
      studentIdNumber: idNumber,
      checkInTime: now,
      checkInStatus: "On Time",
      checkOutStatus: "On Time",
      wasNoShow: false
    });

    await attendance.save();
    await logCardSwipeAttempt({
      cardID: cardID || idInput || studentID,
      cardFormat: cardID ? 'Track1' : (studentID ? 'Track2' : 'Manual'),
      firstName,
      lastName,
      studentID: idNumber
    }, true, null, "Walk-In");

    return res.status(201).json({
      success: true,
      action: "check-in",
      message: `Walk-in ID ${idNumber} checked in.`,
      attendance
    });
  } catch (error) {
    console.error('Error in walk-in attendance:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Public login-screen card swipe: identify user only (no session / attendance logic)
router.post('/public-welcome', async (req, res) => {
  const { idInput, cardID, firstName, lastName, studentID, userRole } = req.body;

  console.log("[PublicWelcome] /public-welcome called with:", { idInput, cardID, firstName, lastName, studentID, userRole });

  try {
    let user = null;
    if (idInput !== undefined && idInput !== null && String(idInput).trim() !== '') {
      console.log("[PublicWelcome] Looking up user by idInput:", idInput);
      user = await findUserForIdInput(String(idInput).trim());
    } else {
      console.log("[PublicWelcome] Looking up user by swipe data:", { cardID, firstName, lastName, studentID });
      user = await findUserForSwipe({ cardID, firstName, lastName, studentID });
    }

    if (!user) {
      console.log("[PublicWelcome] User not found in database");
      // Log the attempt even if user not found (for audit trail)
      const swipeFormat = cardID ? 'Track1' : (studentID ? 'Track2' : 'Manual');
      await logCardSwipeAttempt({ cardID: cardID || idInput, cardFormat: swipeFormat, firstName, lastName, studentID }, true, null, userRole);
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    console.log("[PublicWelcome] User found:", user.firstName, user.lastName);

    // Log the card swipe from public welcome
    const swipeFormat = cardID ? 'Track1' : (studentID ? 'Track2' : 'Manual');
    await logCardSwipeAttempt({ cardID: cardID || idInput, cardFormat: swipeFormat }, true, user, userRole);

    const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return res.status(200).json({
      success: true,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: displayName || 'Guest',
    });
  } catch (error) {
    console.error('[PublicWelcome] Error in public-welcome:', error);
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
      // Log the failed attempt (for audit trail)
      await logCardSwipeAttempt({ cardID: idInput, cardFormat: 'Manual' }, false, null);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Log the manual card swipe
    await logCardSwipeAttempt({ cardID: idInput, cardFormat: 'Manual' }, false, user);

    return await handleAttendanceForUser(user, res);

  } catch (error) {
    console.error('Error in manual check-in:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET card swipe logs
router.get('/swipes/all', async (req, res) => {
  try {
    const swipeLogs = await CardSwipeLog.find()
      .sort({ swipeTime: -1 })
      .limit(100)
      .populate('userID', 'firstName lastName email');
    
    res.json({
      success: true,
      count: swipeLogs.length,
      data: swipeLogs
    });
  } catch (error) {
    console.error("Error fetching card swipe logs:", error);
    res.status(500).json({
      success: false,
      message: 'Error fetching card swipe logs',
      error: error.message
    });
  }
});

// GET card swipe logs for a specific user
router.get('/swipes/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const swipeLogs = await CardSwipeLog.find({ userID: userId })
      .sort({ swipeTime: -1 })
      .limit(100);
    
    res.json({
      success: true,
      count: swipeLogs.length,
      data: swipeLogs
    });
  } catch (error) {
    console.error("Error fetching card swipe logs for user:", error);
    res.status(500).json({
      success: false,
      message: 'Error fetching card swipe logs',
      error: error.message
    });
  }
});

// GET card swipe logs within a date range
router.get('/swipes/range', async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid date format provided. Please use YYYY-MM-DD.' 
      });
    }

    const swipeLogs = await CardSwipeLog.find({
      swipeTime: { $gte: start, $lte: end }
    })
      .sort({ swipeTime: -1 })
      .populate('userID', 'firstName lastName email');
    
    res.json({
      success: true,
      count: swipeLogs.length,
      data: swipeLogs
    });
  } catch (error) {
    console.error("Error fetching card swipe logs:", error);
    res.status(500).json({
      success: false,
      message: 'Error fetching card swipe logs',
      error: error.message
    });
  }
});

module.exports = router;
