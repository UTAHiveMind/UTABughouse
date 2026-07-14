import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DayPilot, DayPilotCalendar, DayPilotMonth, DayPilotNavigator } from "@daypilot/daypilot-lite-react";
import "../../styles/CalendarDaypilot.css";
import { axiosGetData } from '../../utils/api';
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
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

const TutorCalendar = () => {
  const navigate = useNavigate();
  const [view, setView] = useState("Week");
  const [startDate, setStartDate] = useState(DayPilot.Date.today());
  const [events, setEvents] = useState([]);
  const [dayView, setDayView] = useState();
  const [weekView, setWeekView] = useState();
  const [monthView, setMonthView] = useState();
  const [userData, setUserData] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [error, setError] = useState('');
  const isMobile = useIsMobile();

  const onTimeRangeSelected = async (args) => {
    args.control.clearSelection();
  };

  // Fetch user session
  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        const sessionResponse = await axiosGetData(`${BACKEND_URL}/api/auth/session`);
        if (sessionResponse && sessionResponse.user) {
          setUserData(sessionResponse.user);
        } else {
          console.error("No user session found");
          throw new Error("No active session found.");
        }
      } catch (error) {
        console.error("Error fetching user session:", error);
        alert("Authentication failed. Please log in again.");
      }
    };

    fetchUserSession();
  }, []);

  // Fetch tutor sessions
  const fetchTutorSessions = useCallback(async () => {
    if (!userData || !userData.id) return;

    try {
      const response = await axios.get(`${BACKEND_URL}/api/sessions/tutor/${userData.id}`, {
        withCredentials: true
      });
      setUpcomingSessions(response.data);
    } catch (error) {
      console.error("Error fetching tutor sessions:", error);
    }
  }, [userData]);

  // Load sessions once user is known
  useEffect(() => {
    if (userData && userData.id) {
      fetchTutorSessions();
    }
  }, [userData, fetchTutorSessions]);

  // Format and set events for DayPilot
  useEffect(() => {
    if (!upcomingSessions || upcomingSessions.length === 0) return;
  
    const formattedEvents = upcomingSessions.map((session) => {

        const utcDate = new Date(session.sessionTime);

        const options = {
          timeZone: 'America/Chicago',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        };

        const parts = new Intl.DateTimeFormat('en-US', options)
          .formatToParts(utcDate)
          .reduce((acc, part) => {
            acc[part.type] = part.value;
            return acc;
          }, {});

        const localDateStr = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00`;
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
          text: `👨‍🎓${session.studentID?.firstName || 'Student'}\n 📚${session.courseID?.code || 'Course'}`,
          toolTip: `Student: ${session.studentID?.firstName || 'N/A'} ${session.studentID?.lastName || ''}
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
    <div className="container">
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
        </div>

        <DayPilotCalendar
          viewType={"Day"}
          startDate={startDate}
          events={events}
          visible={view === "Day"}
          durationBarVisible={false}
          controlRef={setDayView}
          headerDateFormat={"dddd, MMMM d"}
          businessBeginsHour={8}
          businessEndsHour={18}
          showNonBusiness={false}
        />
        <DayPilotCalendar
          viewType={"Week"}
          startDate={startDate}
          events={events}
          visible={view === "Week"}
          durationBarVisible={false}
          controlRef={setWeekView}
          headerDateFormat={"ddd, MMM d"}
          businessBeginsHour={8}
          businessEndsHour={18}
          showNonBusiness={false}
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
};

export default TutorCalendar;