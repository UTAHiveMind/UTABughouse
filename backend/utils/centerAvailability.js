const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DEFAULT_CENTER_AVAILABILITY = DAYS.map((day) => ({
  day,
  enabled: true,
  startTime: "00:00",
  endTime: "23:59",
}));

const TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function normalizeCenterAvailability(value) {
  const byDay = new Map(
    Array.isArray(value) ? value.map((slot) => [slot.day, slot]) : []
  );

  return DEFAULT_CENTER_AVAILABILITY.map((defaultSlot) => {
    const slot = byDay.get(defaultSlot.day) || {};
    const startTime = TIME_PATTERN.test(slot.startTime)
      ? slot.startTime
      : defaultSlot.startTime;
    const endTime = TIME_PATTERN.test(slot.endTime)
      ? slot.endTime
      : defaultSlot.endTime;

    return {
      day: defaultSlot.day,
      enabled: slot.enabled !== false,
      startTime,
      endTime: timeToMinutes(endTime) > timeToMinutes(startTime)
        ? endTime
        : defaultSlot.endTime,
    };
  });
}

function getDayCenterAvailability(centerAvailability, day) {
  return normalizeCenterAvailability(centerAvailability).find(
    (slot) => slot.day === day
  );
}

function isWithinCenterAvailability(slot, centerAvailability) {
  const centerSlot = getDayCenterAvailability(centerAvailability, slot.day);

  if (!centerSlot || !centerSlot.enabled) {
    return false;
  }

  const slotStart = timeToMinutes(slot.startTime);
  const slotEnd = timeToMinutes(slot.endTime);
  const centerStart = timeToMinutes(centerSlot.startTime);
  const centerEnd = timeToMinutes(centerSlot.endTime);

  return slotStart >= centerStart && slotEnd <= centerEnd && slotStart < slotEnd;
}

module.exports = {
  DAYS,
  DEFAULT_CENTER_AVAILABILITY,
  normalizeCenterAvailability,
  getDayCenterAvailability,
  isWithinCenterAvailability,
  timeToMinutes,
};
