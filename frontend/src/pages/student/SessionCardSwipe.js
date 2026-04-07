import React from "react";
import styles from "../../styles/SessionCardSwipe.module.css";
import StudentSidebar from "../../components/Sidebar/StudentSidebar";
import { useSidebar } from "../../components/Sidebar/SidebarContext";
import SessionCardSwipeCore from "../../components/SessionCardSwipeCore";

function SessionCardSwipe() {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <div className={styles.container}>
      <button
        className={styles.sidebarToggle}
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
      >
        {isCollapsed ? "☰" : "←"}
      </button>

      <StudentSidebar selected="student-card-swipe" />

      <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ""}`}>
        <h1 className={styles.heading}>Student Session Check-In/Out</h1>

        <SessionCardSwipeCore instruction="Please swipe your student ID card to check in or out." />
      </div>
    </div>
  );
}

export default SessionCardSwipe;
