import React, { useEffect, useState,  useCallback } from 'react';
import { DayPilot, DayPilotCalendar, DayPilotMonth, DayPilotNavigator } from "@daypilot/daypilot-lite-react";
import "../../styles/CalendarDaypilot.css";
import { axiosGetData } from '../../utils/api'; // Import the API utility
import axios from 'axios';


// Mobile View
import useIsMobile from '../../hooks/useIsMobile';

/* Hello I am Rajesh, I was working on most of database and UI,
   this is only for calendar which i would recommend next team
   to swtich to FullCalendar instead of react-big-calendar because
   rbc calendar is old schooled and doesn't let you do alot of stuffs 
   technically. It's hard to make it look modern with rbc.
*/

// Get configuration from environment variables
const PROTOCOL = process.env.REACT_APP_PROTOCOL || 'https';
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || 'localhost';
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || '4000';

// Construct the backend URL dynamically
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;


const StudentCalendar = () => {

  const [view, setView] = useState("Week");
  const [startDate, setStartDate] = useState(DayPilot.Date.today());
  const [events, setEvents] = useState([]);
  const [dayView, setDayView] = useState();
  const [weekView, setWeekView] = useState();
  const [monthView, setMonthView] = useState();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tutors, setTutors] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [error, setError] = useState('');
  const isMobile = useIsMobile();
  

  const onTimeRangeSelected = async (args) => {
    args.control.clearSelection();
  };

  // Fetch the user session data
  useEffect(() => {
      const fetchUserSession = async () => {
          try {
              const sessionResponse = await axiosGetData(`${BACKEND_URL}/api/auth/session`);
              
              if (sessionResponse && sessionResponse.user) {
                  setUserData(sessionResponse.user);
              } else {
                  console.error("No user session found");
                  throw new Error("No active session found. Please log in again.");
              }
          } catch (error) {
              console.error("Error fetching user session:", error);
              alert("Failed to authenticate. Please log in again.");
          }
      };
      
      fetchUserSession();
  }, []);

  // Define fetchUpcomingSessions as a useCallback function
  const fetchUpcomingSessions = useCallback(async () => {
    if (!userData || !userData.id) return;
    
    try {
      const response = await axios.get(`${BACKEND_URL}/api/sessions/student/${userData.id}`, {
        withCredentials: true
      });
      setUpcomingSessions(response.data);
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
    }
  }, [userData]);


  // Initial data fetch once session is loaded
  useEffect(() => {
    if (userData && userData.id) {
      const fetchTutors = async () => {
        try {
          const response = await axios.get(`${BACKEND_URL}/api/users/tutors`, {
            withCredentials: true
          });
          setTutors(response.data);
          setLoading(false);
        } catch (error) {
          setError('Error loading tutors');
          setLoading(false);
        }
      };

      fetchTutors();
      fetchUpcomingSessions();
    }
  }, [userData, fetchUpcomingSessions]);

  useEffect(() => {
    if (!upcomingSessions || upcomingSessions.length === 0) return;
  
    const formattedEvents = upcomingSessions.map((session) => {
      // Convert UTC to CDT manually (Central Time = UTC-5 or UTC-6 depending on daylight saving)
      const utcDate = new Date(session.sessionTime);
  
      const options = {
        timeZone: 'America/Chicago', // CDT zone
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
  
      // Get the parts from the localized string
      const parts = new Intl.DateTimeFormat('en-US', options)
        .formatToParts(utcDate)
        .reduce((acc, part) => {
          acc[part.type] = part.value;
          return acc;
        }, {});
  
      // Build a date string like "2024-04-10T14:00:00"
      const localDateStr = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00`;
  
      // Convert to DayPilot date object
      const start = new DayPilot.Date(localDateStr);
      const end = start.addMinutes(session.duration || 60);
  
      // Set color based on status
      let backColor;
      switch (session.status.toLowerCase()) {
        case 'scheduled':
          backColor = '#3498db'; // blue
          break;
        case 'completed':
          backColor = '#93c47d'; // green
          break;
        case 'cancelled':
          backColor = '#e74c3c'; // red
          break;
        default:
          backColor = '#bdc3c7'; // gray fallback
      }
  
      return {
        id: session._id,
          text: `👨‍🎓${session.tutorID?.firstName || 'Tutor'}\n 📚${session.courseID?.code || 'Course'}`,
          toolTip: `Tutor: ${session.tutorID?.firstName || 'N/A'} ${session.tutorID?.lastName || ''}
        Course: ${session.courseID?.title || 'N/A'}
        Status: ${session.status}`,
          start,
          end,
          backColor
      };
    });
  
    setEvents(formattedEvents);
  }, [upcomingSessions]);
  
  
  
  return (
    <div className={"container"}>
      <div className={"navigator"}>
        <DayPilotNavigator
          selectMode={view}
          showMonths={isMobile ? 1 : 3}
          skipMonths={1}
          onTimeRangeSelected={args => setStartDate(args.day)}
          events={events}
        />
      </div>
      <div className={"content"}>
        <div className={"toolbar"}>
          <div className={"toolbar-group"}>
            <button onClick={() => setView("Day")} className={view === "Day" ? "selected" : ""}>Day</button>
            <button onClick={() => setView("Week")} className={view === "Week" ? "selected" : ""}>Week</button>
            <button onClick={() => setView("Month")} className={view === "Month" ? "selected" : ""}>Month</button>
          </div>
          <button onClick={() => setStartDate(DayPilot.Date.today())} className={"standalone"}>Today</button>
        </div>

        <DayPilotCalendar
          viewType={"Day"}
          startDate={startDate}
          events={events}
          visible={view === "Day"}
          durationBarVisible={false}
          controlRef={setDayView}
          headerDateFormat={"dddd, MMMM d"}
          businessBeginsHour={8} // Start at 10 AM
          businessEndsHour={18}   // End at 6 PM
          showNonBusiness={false} // Hides non-business hours
        />
        <DayPilotCalendar
          viewType={"Week"}
          startDate={startDate}
          events={events}
          visible={view === "Week"}
          durationBarVisible={false}
          controlRef={setWeekView}
          headerDateFormat={"ddd, MMM d"}
          businessBeginsHour={8} // Start at 10 AM
          businessEndsHour={18}   // End at 6 PM
          showNonBusiness={false} // Hides non-business hours
        />
        <DayPilotMonth
          startDate={startDate}
          events={events}
          visible={view === "Month"}
          eventBarVisible={false}
          controlRef={setMonthView}
        />
      </div>
    </div>
  );
}
export default StudentCalendar;