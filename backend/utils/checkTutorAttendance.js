const User = require('../models/User');
const CardSwipeLog = require('../models/CardSwipeLog');
const Notification = require('../models/Notification');

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const GRACE_PERIOD_MINUTES = 10; // how late before we flag them

function timeStringToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

async function notifyAdminsIfNeeded(tutor, shift, shiftStart) {
  const admins = await User.find({ role: 'Admin' });
  const message = `Tutor ${tutor.firstName} ${tutor.lastName} has not clocked in for their ${shift.day} shift starting at ${shift.startTime}.`;

  for (const admin of admins) {
    // avoid duplicate spam: skip if we already notified this admin about this shift today
    const existing = await Notification.findOne({
      userId: admin._id,
      message,
      createdAt: { $gte: shiftStart }
    });

    if (!existing) {
      await Notification.create({ userId: admin._id, message });
    }
  }
}

async function getTutorShiftStatus() {
  const now = new Date();
  const todayName = DAYS[now.getDay()];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const tutors = await User.find({ role: 'Tutor' });
  const results = [];

  for (const tutor of tutors) {
    const todaysShifts = (tutor.availability || []).filter(a => a.day === todayName);

    for (const shift of todaysShifts) {
      const startMinutes = timeStringToMinutes(shift.startTime);
      const endMinutes = timeStringToMinutes(shift.endTime);

      // only care about shifts currently in progress
      if (nowMinutes < startMinutes || nowMinutes > endMinutes) continue;

      const shiftStart = new Date(now);
      shiftStart.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);

      const swipe = await CardSwipeLog.findOne({
        userID: tutor._id,
        swipeTime: { $gte: shiftStart }
      }).sort({ swipeTime: -1 });

      const isLate = !swipe && (nowMinutes - startMinutes) > GRACE_PERIOD_MINUTES;

      results.push({
        tutorId: tutor._id,
        tutorName: `${tutor.firstName} ${tutor.lastName}`,
        shift,
        clockedIn: !!swipe,
        clockInTime: swipe ? swipe.swipeTime : null,
        isLate
      });

      if (isLate) {
        await notifyAdminsIfNeeded(tutor, shift, shiftStart);
      }
    }
  }

  return results;
}

module.exports = { getTutorShiftStatus };