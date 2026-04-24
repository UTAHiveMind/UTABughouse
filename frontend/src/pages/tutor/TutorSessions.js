import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import styles from "../../styles/TutorSessions.module.css";
import TutorSideBar from "../../components/Sidebar/TutorSidebar";
import { useSidebar } from "../../components/Sidebar/SidebarContext";

const PROTOCOL = process.env.REACT_APP_PROTOCOL || "https";
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "4000";
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

function TutorSessions() {
  const { isCollapsed } = useSidebar();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState(null);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/auth/session`, {
          withCredentials: true
        });

        if (response.data && response.data.user) {
          setUserData(response.data.user);
        } else {
          setError("No user session found. Please log in again.");
        }
      } catch (error) {
        console.error("Error fetching user session:", error);
        setError("Failed to authenticate user. Please log in again.");
      } finally {
        setSessionLoading(false);
      }
    };

    fetchUserSession();
  }, []);

  const fetchSessions = useCallback(async () => {
    if (!userData || !userData.id) return;

    try {
      setError("");
      const response = await axios.get(
        `${BACKEND_URL}/api/sessions/tutor/${userData.id}`,
        { withCredentials: true }
      );
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);

      if (error.response) {
        setError(
          `Failed to load sessions: ${
            error.response.data.message || error.response.statusText
          }`
        );
      } else if (error.request) {
        setError("Server not responding. Please try again later.");
      } else {
        setError(`Failed to load sessions: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    if (userData && userData.id) {
      fetchSessions();
    }
  }, [userData, fetchSessions]);

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);

    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC"
      });
  };

  const handleStatusChange = async (sessionId, newStatus) => {
    if (!userData || !userData.id) {
      setError("User session expired. Please log in again.");
      return;
    }

    try {
      const res = await axios.put(
        `${BACKEND_URL}/api/sessions/${sessionId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );

      if (res.status === 200 && res.data.success) {
        console.log("Session status updated:", res.data.message);
        fetchSessions();
      } else {
        console.warn("Unexpected response:", res);
        setError("Unexpected response from server.");
      }
    } catch (error) {
      console.error("Error updating session status:", error);
      const msg =
        error.response?.data?.message || error.message || "Unknown error";
      setError("Failed to update session: " + msg);
    }
  };

  const fetchAttendance = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/attendance/all`, {
        withCredentials: true
      });

      const myAttendance = response.data.filter(
        (record) => record.sessionID?.tutorID?._id === userData?.id
      );

      setAttendance(myAttendance);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  }, [userData]);

  useEffect(() => {
    if (userData) {
      fetchSessions();
      fetchAttendance();
    }
  }, [userData, fetchSessions, fetchAttendance]);

  if (sessionLoading || loading) {
    return (
      <div className={styles.container}>
        <TutorSideBar selected="sessions" />

        <div
          className={`${styles.mainContent} ${
            isCollapsed ? styles.mainContentCollapsed : ""
          }`}
        >
          <div
            className={`${styles.headerSection} ${
              isCollapsed ? styles.headerSectionCollapsed : ""
            }`}
          >
            <h1 className={styles.heading}>Tutor Sessions</h1>
          </div>

          <div className={styles.spinnerContainer}>
            <div className={styles.spinner}></div>
            <p>Loading sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className={styles.container}>
        <TutorSideBar selected="sessions" />

        <div
          className={`${styles.mainContent} ${
            isCollapsed ? styles.mainContentCollapsed : ""
          }`}
        >
          <div
            className={`${styles.headerSection} ${
              isCollapsed ? styles.headerSectionCollapsed : ""
            }`}
          >
            <h1 className={styles.heading}>Tutor Sessions</h1>
          </div>

          <div className={styles.error}>
            Session expired or not found. Please log in again.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <TutorSideBar selected="sessions" />

      <div
        className={`${styles.mainContent} ${
          isCollapsed ? styles.mainContentCollapsed : ""
        }`}
      >
        <div
          className={`${styles.headerSection} ${
            isCollapsed ? styles.headerSectionCollapsed : ""
          }`}
        >
          <h1 className={styles.heading}>Tutor Sessions</h1>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.sessionsContainer}>
          <div className={styles.sessionSection}>
            <h2 className={styles.sectionTitle}>Upcoming Sessions</h2>

            {sessions.filter(
              (session) =>
                session.status === "Scheduled" && session.studentID
            ).length > 0 ? (
              <div className={styles.sessionsList}>
                {sessions
                  .filter(
                    (session) =>
                      session.status === "Scheduled" && session.studentID
                  )
                  .sort(
                    (a, b) =>
                      new Date(a.sessionTime) - new Date(b.sessionTime)
                  )
                  .map((session) => (
                    <div key={session._id} className={styles.sessionCard}>
                      <div className={styles.sessionInfo}>
                        <p>
                          <strong>Student:</strong>{" "}
                          {session.studentID
                            ? `${session.studentID.firstName} ${session.studentID.lastName}`
                            : "Unknown Student"}
                        </p>

                        {session.courseID && (
                          <p>
                            <strong>Course:</strong> {session.courseID.code} -{" "}
                            {session.courseID.title}
                          </p>
                        )}

                        <p>
                          <strong>Date & Time:</strong>{" "}
                          {formatDateTime(session.sessionTime)}
                        </p>

                        <p>
                          <strong>Duration:</strong> {session.duration} minutes
                        </p>

                        <p>
                          <strong>Status:</strong>{" "}
                          <span
                            className={`${styles.statusBadge} ${styles.statusScheduled}`}
                          >
                            {session.status}
                          </span>
                        </p>

                        {session.specialRequest && (
                          <p>
                            <strong>Special Request:</strong>{" "}
                            {session.specialRequest}
                          </p>
                        )}
                      </div>

                      <div className={styles.sessionActions}>
                        <button
                          className={`${styles.actionButton} ${styles.completeButton}`}
                          onClick={() =>
                            handleStatusChange(session._id, "Completed")
                          }
                        >
                          Mark as Completed
                        </button>

                        <button
                          className={`${styles.actionButton} ${styles.noShowButton}`}
                          onClick={() =>
                            handleStatusChange(session._id, "No Show")
                          }
                        >
                          Mark as No Show
                        </button>

                        <button
                          className={`${styles.actionButton} ${styles.cancelButton}`}
                          onClick={() =>
                            handleStatusChange(session._id, "Cancelled")
                          }
                        >
                          Cancel Session
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className={styles.noSessions}>No upcoming sessions</p>
            )}
          </div>

          <div className={styles.sessionSection}>
            <h2 className={styles.sectionTitle}>Completed Sessions</h2>

            {sessions.filter(
              (session) =>
                session.status === "Completed" && session.studentID
            ).length > 0 ? (
              <div className={styles.sessionsList}>
                {sessions
                  .filter(
                    (session) =>
                      session.status === "Completed" && session.studentID
                  )
                  .sort(
                    (a, b) =>
                      new Date(b.sessionTime) - new Date(a.sessionTime)
                  )
                  .map((session) => {
                    const attendanceRecord = attendance.find(
                      (record) =>
                        record.sessionID?._id === session._id &&
                        record.userID?._id === userData?._id
                    );

                    return (
                      <div key={session._id} className={styles.sessionCard}>
                        <div className={styles.sessionInfo}>
                          <p>
                            <strong>Student:</strong>{" "}
                            {session.studentID
                              ? `${session.studentID.firstName} ${session.studentID.lastName}`
                              : "Unknown Student"}
                          </p>

                          {session.courseID && (
                            <p>
                              <strong>Course:</strong> {session.courseID.code} -{" "}
                              {session.courseID.title}
                            </p>
                          )}

                          <p>
                            <strong>Date & Time:</strong>{" "}
                            {formatDateTime(session.sessionTime)}
                          </p>

                          <p>
                            <strong>Duration:</strong> {session.duration} minutes
                          </p>

                          <p>
                            <strong>Status:</strong>{" "}
                            <span
                              className={`${styles.statusBadge} ${styles.statusCompleted}`}
                            >
                              {session.status}
                            </span>
                          </p>

                          {attendanceRecord?.checkInTime && (
                            <p>
                              <strong>Check-in Time:</strong>{" "}
                              {formatDateTime(attendanceRecord.checkInTime)}
                            </p>
                          )}

                          {attendanceRecord?.checkOutTime && (
                            <p>
                              <strong>Check-out Time:</strong>{" "}
                              {formatDateTime(attendanceRecord.checkOutTime)}
                            </p>
                          )}

                          {session.specialRequest && (
                            <p>
                              <strong>Special Request:</strong>{" "}
                              {session.specialRequest}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className={styles.noSessions}>No completed sessions found.</p>
            )}
          </div>

          <div className={styles.sessionSection}>
            <h2 className={styles.sectionTitle}>Cancelled Sessions</h2>

            {sessions.filter(
              (session) =>
                session.status === "Cancelled" && session.studentID
            ).length > 0 ? (
              <div className={styles.sessionsList}>
                {sessions
                  .filter(
                    (session) =>
                      session.status === "Cancelled" && session.studentID
                  )
                  .sort(
                    (a, b) =>
                      new Date(b.sessionTime) - new Date(a.sessionTime)
                  )
                  .map((session) => (
                    <div key={session._id} className={styles.sessionCard}>
                      <div className={styles.sessionInfo}>
                        <p>
                          <strong>Student:</strong>{" "}
                          {session.studentID
                            ? `${session.studentID.firstName} ${session.studentID.lastName}`
                            : "Unknown Student"}
                        </p>

                        {session.courseID && (
                          <p>
                            <strong>Course:</strong> {session.courseID.code} -{" "}
                            {session.courseID.title}
                          </p>
                        )}

                        <p>
                          <strong>Date & Time:</strong>{" "}
                          {formatDateTime(session.sessionTime)}
                        </p>

                        <p>
                          <strong>Duration:</strong> {session.duration} minutes
                        </p>

                        <p>
                          <strong>Status:</strong>{" "}
                          <span
                            className={`${styles.statusBadge} ${styles.statusCancelled}`}
                          >
                            {session.status}
                          </span>
                        </p>

                        {session.specialRequest && (
                          <p>
                            <strong>Special Request:</strong>{" "}
                            {session.specialRequest}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className={styles.noSessions}>No cancelled sessions</p>
            )}
          </div>

          <div className={styles.sessionSection}>
            <h2 className={styles.sectionTitle}>No Show Sessions</h2>

            {sessions.filter(
              (session) => session.status === "No Show" && session.studentID
            ).length > 0 ? (
              <div className={styles.sessionsList}>
                {sessions
                  .filter(
                    (session) =>
                      session.status === "No Show" && session.studentID
                  )
                  .sort(
                    (a, b) =>
                      new Date(b.sessionTime) - new Date(a.sessionTime)
                  )
                  .map((session) => (
                    <div key={session._id} className={styles.sessionCard}>
                      <div className={styles.sessionInfo}>
                        <p>
                          <strong>Student:</strong>{" "}
                          {session.studentID
                            ? `${session.studentID.firstName} ${session.studentID.lastName}`
                            : "Unknown Student"}
                        </p>

                        {session.courseID && (
                          <p>
                            <strong>Course:</strong> {session.courseID.code} -{" "}
                            {session.courseID.title}
                          </p>
                        )}

                        <p>
                          <strong>Date & Time:</strong>{" "}
                          {formatDateTime(session.sessionTime)}
                        </p>

                        <p>
                          <strong>Duration:</strong> {session.duration} minutes
                        </p>

                        <p>
                          <strong>Status:</strong>{" "}
                          <span
                            className={`${styles.statusBadge} ${styles.statusNoShow}`}
                          >
                            {session.status}
                          </span>
                        </p>

                        {session.specialRequest && (
                          <p>
                            <strong>Special Request:</strong>{" "}
                            {session.specialRequest}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className={styles.noSessions}>No no-show sessions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorSessions;