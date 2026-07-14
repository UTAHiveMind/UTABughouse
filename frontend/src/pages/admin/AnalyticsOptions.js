import React from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/Sidebar/AdminSidebar";
import styles from "../../styles/AdminHome.module.css";
import analyticsStyles from "../../styles/AnalyticsOptions.module.css";
import { useSidebar } from "../../components/Sidebar/SidebarContext";

const AnalyticsOptions = () => {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const sidebarWidth = isCollapsed ? "80px" : "270px";

  const handleTutorPerformance = () => {
    navigate("/analytics/tutor-performance");
  };

  const handleAttendanceReports = () => {
    navigate("/analytics/attendance-reports");
  };

  return (
    <div className={styles.container}>
      <AdminSidebar selected="analytics" />
      <div className={`${styles.content} ${isCollapsed ? styles.contentCollapsed : ""}`}>
        <div className={analyticsStyles.pageHeader}>
          <h1>Analytics Dashboard</h1>
          <p>Select an analytics option to view detailed insights</p>
        </div>

        <div className={analyticsStyles.optionsContainer}>
          <div
            className={analyticsStyles.analyticsCard}
            onClick={handleTutorPerformance}
          >
            <div className={analyticsStyles.cardIcon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <h2>Tutor Performance</h2>
            <p>View comprehensive metrics and evaluations for tutors</p>
            <div className={analyticsStyles.cardAction}>
              <span>View Details</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
            </div>
          </div>

          <div
            className={analyticsStyles.analyticsCard}
            onClick={handleAttendanceReports}
          >
            <div className={analyticsStyles.cardIcon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h2>Attendance and Reports</h2>
            <p>Track attendance patterns and generate comprehensive reports</p>
            <div className={analyticsStyles.cardAction}>
              <span>View Details</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsOptions;
