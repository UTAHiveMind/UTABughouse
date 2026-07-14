import React, { useState } from 'react';
import styles from '../../styles/StudentWeeklyCalendar.module.css';

const StudentWeeklyCalendar = ({ schedule }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const hours = Array.from({ length: 9 }, (_, i) => i + 10); // 10 AM to 6 PM
  

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
            {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
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