import styles from "../../styles/TutorNotifications.module.css";
import TutorSidebar from "../../components/Sidebar/TutorSidebar";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSidebar } from "../../components/Sidebar/SidebarContext";

const PROTOCOL = process.env.REACT_APP_PROTOCOL || "https";
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "4000";
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

function TutorNotifications() {
  const { isCollapsed } = useSidebar();

  const [sessionLoading, setSessionLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setError("Failed to authenticate user.");
      } finally {
        setSessionLoading(false);
      }
    };

    fetchUserSession();
  }, []);

  useEffect(() => {
    if (userData !== null)
      axios
        .get(`${BACKEND_URL}/api/notifications/${userData?.id}`)
        .then((response) => {
          setNotifications(response.data);
        })
        .catch((error) => {
          console.error("Error fetching notifications:", error);
        })
        .finally(() => {
          setTimeout(() => setLoading(false), 2000);
        });
  }, [userData]);

  return (
    <div className={styles.container}>
      <TutorSidebar selected="tutor-notifications" />

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
          <h1 className={styles.heading}>Notifications</h1>
        </div>

        {/* CONTENT CARD */}
        <div className={styles.cardWrapper}>
          {loading && (
            <div className={styles.spinnerContainer}>
              <div className={styles.spinner}></div>
            </div>
          )}

          {!loading &&
            notifications &&
            notifications.map((notification, index) => (
              <div key={index} className={styles.card}>
                <h2 className={styles.cardTitle}>
                  {notification.message}
                </h2>
                <p className={styles.cardCreatedAt}>
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default TutorNotifications;