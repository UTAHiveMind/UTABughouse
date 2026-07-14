import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../styles/TutorHome.module.css';
import TutorSidebar from '../../components/Sidebar/TutorSidebar';
import axios from 'axios';
import TutorCalendar from "./TutorCalendar";
import { useSidebar } from "../../components/Sidebar/SidebarContext";

function TutorHome() {
    const navigate = useNavigate();
    const [ tutorName, setTutorName ] = useState("");
    const { isCollapsed } = useSidebar();
    const [availability, setAvailability] = useState([]);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        // Fetch availability and notifications from the server
        axios.get('/api/notifications/tutor')
            .then((response) => setNotifications(response.data))
            .catch((err) => console.error('Error fetching notifications:', err));
    }, []);

    useEffect(() => {
        const storeUser = JSON.parse(localStorage.getItem("user"));
         console.log("Fetched user:", storeUser);
        if(storeUser?.firstName) {
          setTutorName(storeUser.firstName);
        }
      }, []);

    return (
        <div className={styles.container}>
            {/* Use the TutorSidebar component */}
            <TutorSidebar selected="home"/>

            {/* Main Content */}
      <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ""}`}>
                <div className={styles.headingRow}>
                          <div>
                            <h1>
                              Welcome, {tutorName || "Tutor"} <span role="img">👋</span>
                            </h1>
                            <p>Here's your tutoring calendar</p>
                          </div>
                        </div>

                {/* Schedule Section */}
                <section className = {styles.tutorHomeSec}>
                    <h2 className = {styles.calSubHeading}>Calendar</h2>
                        <TutorCalendar />
                    </section>
            </div>
        </div>
    );
}

export default TutorHome;