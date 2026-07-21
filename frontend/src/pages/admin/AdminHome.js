import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/Sidebar/AdminSidebar';
import styles from '../../styles/AdminHome.module.css';
import { useSidebar } from "../../components/Sidebar/SidebarContext";

const PROTOCOL = process.env.REACT_APP_PROTOCOL || 'https';
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || 'localhost';
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || '4000';
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

function AdminHome({ user }) {
  const [tutorStatuses, setTutorStatuses] = useState([]);
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/attendance/tutor-shift-status`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTutorStatuses(data.data);
      })
      .catch((err) => console.error('Error fetching tutor shift status:', err));
  }, []);

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <AdminSidebar selected="home" />
      
      {/* Main Content */}
      <div 
        className={`${styles.content} ${isCollapsed ? styles.contentCollapsed : ""}`} 
      >
        <div className={styles.pageHeader}>
          <h1>Admin Dashboard</h1>
          <p>Welcome to the administration panel. Manage your educational platform from here.</p>
        </div>

        <div className={styles.pageHeader}>
          <h2>Tutors On Shift Right Now</h2>
        </div>
        <ul>
          {tutorStatuses.length === 0 && <li>No tutors currently scheduled.</li>}
          {tutorStatuses.map((tutorStatus) => (
            <li
              key={`${tutorStatus.tutorId}-${tutorStatus.shift.startTime}`}
              style={{ color: tutorStatus.isLate ? 'red' : 'green' }}
            >
              {tutorStatus.tutorName} - {tutorStatus.clockedIn
                ? `Clocked in at ${new Date(tutorStatus.clockInTime).toLocaleTimeString()}`
                : 'Not clocked in'}
            </li>
          ))}
        </ul>
        
        <div className={styles.cardsContainer}>
          {/* User Management Card */}
          <div className={styles.adminCard} onClick={() => navigate("/manage-users")}>
            <div className={styles.cardIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h2>User Management</h2>
            <p>Create, edit, and manage user accounts. Assign roles and permissions to tutors and students.</p>
            <div className={styles.cardAction}>
              <span>View and Manage Users</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
            </div>
          </div>

          {/* Analytics Card */}
          <div className={styles.adminCard} onClick={() => navigate("/analytics")}>
            <div className={styles.cardIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
                <line x1="2" y1="20" x2="22" y2="20"></line>
              </svg>
            </div>
            <h2>System Analytics</h2>
            <p>Monitor system analytics, track student engagement, and analyze tutor performance.</p>
            <div className={styles.cardAction}>
              <span>View Analytics</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
            </div>
          </div>

          {/* Tutor Reviews Card */}
          {user?.role === 'admin' && (
            <div className={styles.adminCard} onClick={() => navigate("/admin-reviews")}>
              <div className={styles.cardIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M21 11.5a8.38 8.38 0 01-6.2 8.1 8.5 8.5 0 01-9.6-12.1A8.38 8.38 0 0112 3v1.5"></path>
                  <path d="M12 12l-4-4m0 0l4-4m-4 4h12"></path>
                </svg>
              </div>
              <h2>Tutor Reviews</h2>
              <p>View feedback and ratings students left for tutors.</p>
              <div className={styles.cardAction}>
                <span>View Reviews</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
              </div>
            </div>
          )}

          {/* Settings Card */}
          <div className={styles.adminCard} onClick={() => navigate("/admin-settings")}>
            <div className={styles.cardIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </div>
            <h2>Settings</h2>
            <p>Configure system settings and customize platform functionality.</p>
            <div className={styles.cardAction}>
              <span>Go to Settings</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminHome;
