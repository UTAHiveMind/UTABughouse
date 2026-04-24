import React, { useEffect, useState } from "react";
import styles from "../../styles/StudentHome.module.css";
import StudentCalendar from "./StudentCalendar";
import StudentSidebar from "../../components/Sidebar/StudentSidebar";
import { useSidebar } from "../../components/Sidebar/SidebarContext";
import { useNavigate } from "react-router-dom";

function StudentHome() {
  const { isCollapsed } = useSidebar();
  const [studentName, setStudentName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const storeUser = JSON.parse(localStorage.getItem("user"));
    if (storeUser?.firstName) {
      setStudentName(storeUser.firstName);
    }
  }, []);

  return (
    <div className={styles.container}>
      <StudentSidebar selected="home" />

      <div
        className={`${styles.mainContent} ${
          isCollapsed ? styles.mainContentCollapsed : ""
        }`}
      >
        {/* BLUE WELCOME SECTION (same style as tutor home) */}
        <div className={styles.headingRow}>
          <div>
            <h1>Welcome, {studentName || "Student"}!</h1>
            <p>Here's your tutoring calendar.</p>
          </div>

          <div className={styles.topTabs}>
            <div
              className={styles.tabCard}
              onClick={() => navigate("/my-sessions")}
            >
              <div className={styles.cardIcon}>📋</div>
              <div>
                <h3>My Sessions</h3>
                <p>Upcoming booked sessions</p>
              </div>
            </div>
          </div>
        </div>

        {/* CALENDAR CARD */}
        <section className={styles.contentCard}>
          <h2 className={styles.calSubHeading}>Calendar</h2>
          <StudentCalendar />
        </section>

        {/* NOTIFICATIONS */}
        <section className={styles.notifications}>
          <h2>Notifications</h2>
          <p>No new notifications</p>
        </section>
      </div>
    </div>
  );
}

export default StudentHome;