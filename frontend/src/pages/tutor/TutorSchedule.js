import React from "react";
import TutorSidebar from "../../components/Sidebar/TutorSidebar";
import TutorCalendar from "./TutorCalendar";
import styles from "../../styles/TutorSchedule.module.css";
import { useSidebar } from "../../components/Sidebar/SidebarContext";

function TutorSchedule() {
  const { isCollapsed } = useSidebar();

  return (
    <div className={styles.container}>
      <TutorSidebar selected="schedule" />

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
          <h1 className={styles.heading}>Calendar</h1>
        </div>

        {/* SAME AS FORM CARD WRAPPER */}
        <div className={styles.formWrapper}>
          <div className={styles.formCard}>
            <TutorCalendar />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorSchedule;