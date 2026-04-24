import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import styles from "../../styles/TutorDetails.module.css";
import AdminSideBar from "../../components/Sidebar/AdminSidebar";
import { useSidebar } from "../../components/Sidebar/SidebarContext";
import { FaFileCsv, FaArrowLeft } from "react-icons/fa";

const PROTOCOL = process.env.REACT_APP_PROTOCOL || "https";
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "4000";
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

const DEFAULT_AVATAR =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMjU2Ij48cmVjdCBmaWxsPSIjZTllOWU5IiB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIvPjxjaXJjbGUgY3g9IjEyOCIgY3k9Ijk2IiByPSI0MCIgZmlsbD0iIzU5NjI3NCIvPjxwYXRoIGZpbGw9IiM1OTYyNzQiIGQ9Ik0yMTYsMTk2Yy0wLjQtMzcuOC0zMi43LTY4LTcyLTY4aC0zMmMtMzkuMywwLTcxLjYsMzAuMi03Miw2OEgyMTZ6Ii8+PC9zdmc+";

function TutorDetails() {
  const { tutorId } = useParams();
  const [tutor, setTutor] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    const fetchTutorData = async () => {
      try {
        setLoading(true);

        const response = await axios.get(
          `${BACKEND_URL}/api/users/tutors/${tutorId}/details`
        );

        const data = response.data;

        setTutor({
          _id: data._id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          rating: data.rating,
        });

        setProfile(data.profile);
        setStudents(data.students);
        setSessions(data.sessions);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setError("Failed to load tutor details");
        setLoading(false);
      }
    };

    if (tutorId) fetchTutorData();
  }, [tutorId]);

  const csvCellEscape = (value) => {
    if (value == null || value === undefined) return "";

    const str = String(value);

    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  };

  const buildCsvContent = (data) => {
    const tutorName = tutor
      ? `${tutor.firstName} ${tutor.lastName}`
      : "Unknown Tutor";

    const headers = [
      "Date",
      "Student Name",
      "Session Time",
      "Status",
      "Check-in Time",
      "Check-out Time",
      "Duration",
    ];

    const rows = data.map((r) => {
      const realDuration = r.wasNoShow || r.status === "Cancelled" ? 0 : r.duration;

      const date = new Date(r.sessionTime);
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const yyyy = date.getFullYear();
      const formattedDate = `${mm}-${dd}-${yyyy}`;

      const startTime = new Date(r.sessionTime);
      const endTime = new Date(startTime.getTime() + r.duration * 60000);

      const sessionTime = `${startTime.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })} - ${endTime.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;

      const formatCsvTime = (dateString) => {
        if (!dateString) return "N/A";

        return new Date(dateString).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      };

      return [
        formattedDate,
        r.studentName,
        sessionTime,
        r.status,
        r.wasNoShow ? "No Show" : formatCsvTime(r.checkInTime),
        r.wasNoShow ? "No Show" : formatCsvTime(r.checkOutTime),
        realDuration,
      ]
        .map(csvCellEscape)
        .join(",");
    });

    return tutorName + "\n\n" + headers.join(",") + "\n" + rows.join("\n");
  };

  const handleExport = () => {
    const now = new Date();
    const today = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear());
    const fileName = `tutor_details_report_${month}_${today}_${year}.csv`;

    const csvContent = buildCsvContent(sessions);

    const blob = new Blob(["\ufeff", csvContent], {
      type: "text/csv; charset=utf-8;",
    });

    const urlTemp = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.setAttribute("href", urlTemp);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(urlTemp);
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    const options = { hour: "numeric", minute: "numeric", hour12: true };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <AdminSideBar selected="analytics" />

        <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ""}`}>
          <div className={`${styles.headerSection} ${isCollapsed ? styles.headerSectionCollapsed : ""}`}>
            <h1 className={styles.heading}>Tutor Details</h1>
          </div>

          <div className={styles.messageCard}>
            <p>Loading tutor details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tutor) {
    return (
      <div className={styles.container}>
        <AdminSideBar selected="analytics" />

        <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ""}`}>
          <div className={`${styles.headerSection} ${isCollapsed ? styles.headerSectionCollapsed : ""}`}>
            <h1 className={styles.heading}>Tutor Details</h1>
          </div>

          <div className={styles.messageCard}>
            <p>{error || "Tutor not found."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <AdminSideBar selected="analytics" />

      <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ""}`}>
        <div className={`${styles.headerSection} ${isCollapsed ? styles.headerSectionCollapsed : ""}`}>
          <h1 className={styles.heading}>Tutor Details</h1>

          <button className={styles.backButton} onClick={() => window.history.back()}>
            <FaArrowLeft /> Back
          </button>
        </div>

        <div className={styles.adminCard}>
          <div className={styles.profileHeader}>
            <div className={styles.avatarContainer}>
              <img
                src={profile?.profilePicture || DEFAULT_AVATAR}
                alt={`${tutor.firstName} ${tutor.lastName}`}
                className={styles.avatar}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_AVATAR;
                }}
              />
            </div>

            <div className={styles.tutorInfo}>
              <h2 className={styles.tutorName}>
                {tutor.firstName} {tutor.lastName}
              </h2>

              <div className={styles.ratingContainer}>
                <span className={styles.ratingValue}>{tutor.rating || 0}</span>

                <div className={styles.starRating}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`${styles.star} ${
                        star <= Math.round(tutor.rating || 0)
                          ? styles.filled
                          : styles.empty
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <p className={styles.tutorDetail}>
                <strong>Email:</strong> {tutor.email}
              </p>
              <p className={styles.tutorDetail}>
                <strong>Phone:</strong> {tutor.phone}
              </p>

              {profile && (
                <>
                  <p className={styles.tutorDetail}>
                    <strong>Major:</strong> {profile.major}
                  </p>
                  <p className={styles.tutorDetail}>
                    <strong>Year:</strong> {profile.currentYear}
                  </p>
                </>
              )}
            </div>
          </div>

          {profile?.bio && (
            <div className={styles.sectionCard}>
              <h3>About</h3>
              <p>{profile.bio}</p>
            </div>
          )}

          <div className={styles.statsContainer}>
            <div className={styles.statBox}>
              <span className={styles.statNumber}>{sessions.length}</span>
              <span className={styles.statLabel}>Total Sessions</span>
            </div>

            <div className={styles.statBox}>
              <span className={styles.statNumber}>
                {sessions.filter((s) => s.status === "Completed").length}
              </span>
              <span className={styles.statLabel}>Completed Sessions</span>
            </div>

            <div className={styles.statBox}>
              <span className={styles.statNumber}>
                {sessions.filter((s) => s.status === "Cancelled").length}
              </span>
              <span className={styles.statLabel}>Cancelled Sessions</span>
            </div>

            <div className={styles.statBox}>
              <span className={styles.statNumber}>{students.length}</span>
              <span className={styles.statLabel}>Students Tutored</span>
            </div>
          </div>
        </div>

        <div className={styles.adminCard}>
          <h2 className={styles.sectionTitle}>Students Tutored</h2>

          {students.length === 0 ? (
            <p>No students yet.</p>
          ) : (
            <div className={styles.studentList}>
              {students.map((student) => (
                <div key={student._id} className={styles.studentCard}>
                  <div className={styles.studentAvatar}>
                    {student.firstName?.charAt(0) || "?"}
                    {student.lastName?.charAt(0) || "?"}
                  </div>

                  <div className={styles.studentName}>
                    {student.firstName} {student.lastName}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.adminCard}>
          <div className={styles.historyNav}>
            <h2 className={styles.sectionTitle}>Session History</h2>

            <button className={styles.actionButton} onClick={handleExport}>
              <FaFileCsv /> Export CSV
            </button>
          </div>

          {sessions.length === 0 ? (
            <p>No sessions yet.</p>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.sessionsTable}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {sessions.map((session) => (
                    <tr key={session._id}>
                      <td>{session.studentName || "Unknown Student"}</td>
                      <td>{formatDate(session.sessionTime)}</td>
                      <td>{formatTime(session.sessionTime)}</td>
                      <td>
                        {session.status === "Cancelled" ? 0 : session.duration} minutes
                      </td>
                      <td>
                        <span
                          className={`${styles.status} ${
                            styles[session.status.toLowerCase()]
                          }`}
                        >
                          {session.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TutorDetails;