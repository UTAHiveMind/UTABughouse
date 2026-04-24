import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import styles from "../../styles/MySessions.module.css";
import StudentSidebar from "../../components/Sidebar/StudentSidebar";
import { useSidebar } from "../../components/Sidebar/SidebarContext";

const PROTOCOL = process.env.REACT_APP_PROTOCOL || 'https';
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || 'localhost';
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || '4000';

const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

function MySessions() {
  const { isCollapsed } = useSidebar();
  const [userData, setUserData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [attendance, setAttendance] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  const fetchSessions = useCallback(async () => {
    if (!userData || !userData.id) return;

    try {
      const response = await axios.get(`${BACKEND_URL}/api/sessions/student/${userData.id}`, {
        withCredentials: true
      });
      setSessions(response.data);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, [userData]);

  const fetchAttendance = useCallback(async () => {
    if (!userData || !userData.id) return;

    try {
      const response = await axios.get(`${BACKEND_URL}/api/attendance/all`, { withCredentials: true });
      const myAttendance = response.data.filter(
        record => record.studentID && record.studentID._id === userData.id
      );
      setAttendance(myAttendance);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  }, [userData]);

  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/auth/session`, {
          withCredentials: true
        });

        if (response.data && response.data.user) {
          setUserData(response.data.user);
        } else {
          setError("No active session found. Please log in again.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching session:", err);
        setError("Authentication failed. Please try again.");
        setLoading(false);
      }
    };

    fetchUserSession();
  }, []);

  useEffect(() => {
    if (userData) {
      fetchSessions();
      fetchAttendance();
    }
  }, [userData, fetchSessions, fetchAttendance]);

  return (
    <div className={styles.container}>
      <StudentSidebar selected="my-sessions" />

      <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ""}`}>
        <div className={`${styles.headerSection} ${isCollapsed ? styles.headerSectionCollapsed : ""}`}>
          <h1 className={styles.heading}>My Sessions</h1>
        </div>

        <div className={styles.sessionsContainer}>
          {loading ? (
            <div className={styles.spinnerContainer}>
              <div className={styles.spinner}></div>
              <p>Loading sessions...</p>
            </div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : sessions.length === 0 ? (
            <div className={styles.emptyCard}>
              <p className={styles.noSessions}>You have no sessions booked.</p>
            </div>
          ) : (
            <div className={styles.sessionsGrid}>
              {sessions.map((session) => {
                const attendanceForSession = attendance.find(
                  (record) => record.sessionID?._id === session._id
                );

                let displayStatus = session.status;

                if (session.status === 'Scheduled') {
                  if (attendanceForSession?.checkInTime && !attendanceForSession?.checkOutTime) {
                    displayStatus = 'Ongoing';
                  } else if (attendanceForSession?.checkInTime && attendanceForSession?.checkOutTime) {
                    displayStatus = 'Completed';
                  }
                }

                return (
                  <div key={session._id} className={styles.sessionCard}>
                    <p className={styles.tutorName}>
                      {session.tutorID?.firstName} {session.tutorID?.lastName}
                    </p>

                    {session.courseID && (
                      <p className={styles.sessionCourse}>
                        Course: {session.courseID.code} - {session.courseID.title}
                      </p>
                    )}

                    <p className={styles.sessionTime}>
                      {formatDateTime(session.sessionTime)}
                    </p>

                    <p className={styles.sessionDuration}>
                      Duration: {session.duration} minutes
                    </p>

                    <p className={styles.sessionStatus}>
                      Status: {displayStatus}
                    </p>

                    {attendanceForSession?.checkInTime && (
                      <p className={styles.checkInTime}>
                        Checked in: {formatDateTime(attendanceForSession.checkInTime)}
                      </p>
                    )}

                    {attendanceForSession?.checkOutTime && (
                      <p className={styles.checkOutTime}>
                        Checked out: {formatDateTime(attendanceForSession.checkOutTime)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MySessions;