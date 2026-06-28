import React, { useEffect, useState } from 'react';
import styles from '../../styles/StudentWeeklyCalendar.module.css';
import {
  DAYS,
  DEFAULT_CENTER_AVAILABILITY,
  fetchCenterAvailability,
  getCalendarBounds,
} from '../../utils/centerAvailability';

const PROTOCOL = process.env.REACT_APP_PROTOCOL || 'https';
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || 'localhost';
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || '4000';
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

const StudentWeeklyCalendar = ({ schedule }) => {
  const [centerAvailability, setCenterAvailability] = useState(DEFAULT_CENTER_AVAILABILITY);
  const calendarBounds = getCalendarBounds(centerAvailability);
  const days = DAYS;
  const hours = Array.from(
    { length: Math.max(calendarBounds.endHour - calendarBounds.startHour, 1) },
    (_, i) => i + calendarBounds.startHour
  );

  useEffect(() => {
    const loadCenterAvailability = async () => {
      try {
        setCenterAvailability(await fetchCenterAvailability(BACKEND_URL));
      } catch (error) {
        console.error("Error fetching center availability:", error);
      }
    };

    loadCenterAvailability();
  }, []);
  

  const renderTimeSlots = (day) => {
    return hours.map((hour) => {
      const matchingSession = schedule.find((session) => {
        // Convert session time to 24-hour format
        const [time, modifier] = session.time.split(' '); // Split time and AM/PM
        let sessionHour = parseInt(time.split(':')[0], 10);
  
        if (modifier === 'PM' && sessionHour !== 12) {
          sessionHour += 12; // Convert PM hours to 24-hour format
        } else if (modifier === 'AM' && sessionHour === 12) {
          sessionHour = 0; // Handle midnight (12 AM)
        }
  
        return session.day === day && sessionHour === hour;
      });
  
      return (
        <div 
          key={`${day}-${hour}`} 
          className={`${styles.timeSlot} ${matchingSession ? styles.hasSession : ''}`}
        >
          {matchingSession ? (
            <div className={styles.sessionDetails}>
              <p>{matchingSession.time}</p>
              <p>{matchingSession.title}</p>
            </div>
          ) : null}
        </div>
      );
    });
  };
  
  return (
    <div className={styles.weeklyCalendar}>
      <div className={styles.timeLabels}>
        {hours.map((hour) => (
          <div key={hour} className={styles.hourLabel}>
            {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
          </div>
        ))}
      </div>
      <div className={styles.calendarGrid}>
        {days.map((day) => (
          <div key={day} className={styles.dayColumn}>
            <div className={styles.dayHeader}>{day}</div>
            {renderTimeSlots(day)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentWeeklyCalendar;
