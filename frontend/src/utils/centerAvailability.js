import moment from "moment";

export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const DEFAULT_CENTER_AVAILABILITY = DAYS.map((day) => ({
  day,
  enabled: true,
  startTime: "00:00",
  endTime: "23:59",
}));

const TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

export const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const normalizeCenterAvailability = (value) => {
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
      endTime:
        timeToMinutes(endTime) > timeToMinutes(startTime)
          ? endTime
          : defaultSlot.endTime,
    };
  });
};

export const getDayCenterAvailability = (centerAvailability, day) =>
  normalizeCenterAvailability(centerAvailability).find((slot) => slot.day === day);

export const isWithinCenterAvailability = (start, end, centerAvailability) => {
  const day = moment(start).format("dddd");
  const slot = getDayCenterAvailability(centerAvailability, day);

  if (!slot?.enabled) {
    return false;
  }

  const startMinutes = moment(start).hours() * 60 + moment(start).minutes();
  const endMinutes = moment(end).hours() * 60 + moment(end).minutes();

  return (
    startMinutes >= timeToMinutes(slot.startTime) &&
    endMinutes <= timeToMinutes(slot.endTime) &&
    startMinutes < endMinutes
  );
};

export const getCalendarBounds = (centerAvailability) => {
  const enabledSlots = normalizeCenterAvailability(centerAvailability).filter(
    (slot) => slot.enabled
  );

  if (!enabledSlots.length) {
    return {
      min: moment().hours(0).minutes(0).seconds(0).toDate(),
      max: moment().hours(23).minutes(59).seconds(0).toDate(),
      startHour: 0,
      endHour: 24,
    };
  }

  const minMinutes = Math.min(...enabledSlots.map((slot) => timeToMinutes(slot.startTime)));
  const maxMinutes = Math.max(...enabledSlots.map((slot) => timeToMinutes(slot.endTime)));

  return {
    min: moment()
      .hours(Math.floor(minMinutes / 60))
      .minutes(minMinutes % 60)
      .seconds(0)
      .toDate(),
    max: moment()
      .hours(Math.floor(maxMinutes / 60))
      .minutes(maxMinutes % 60)
      .seconds(0)
      .toDate(),
    startHour: Math.floor(minMinutes / 60),
    endHour: Math.ceil(maxMinutes / 60),
  };
};

export const formatCenterAvailabilitySummary = (centerAvailability) => {
  const slots = normalizeCenterAvailability(centerAvailability).filter(
    (slot) => slot.enabled
  );

  if (slots.length === 7 && slots.every((slot) => slot.startTime === "00:00" && slot.endTime === "23:59")) {
    return "24/7";
  }

  if (!slots.length) {
    return "No open hours";
  }

  return slots
    .map((slot) => `${slot.day}: ${slot.startTime} - ${slot.endTime}`)
    .join(", ");
};

export const fetchCenterAvailability = async (backendUrl) => {
  const response = await fetch(`${backendUrl}/api/bughouse`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch center availability: ${response.status}`);
  }

  const settings = await response.json();
  return normalizeCenterAvailability(settings.centerAvailability);
};
