import React from "react";
import { useNavigate } from "react-router-dom";
import TutorHome from "./tutor/TutorHome";
import AdminHome from "./admin/AdminHome";
import StudentHome from "./student/StudentHome";
import styles from '../styles/Home.module.css';
import { axiosGetData } from "../utils/api";
import { useEffect, useState } from "react";

// Get configuration from environment variables
const PROTOCOL = process.env.REACT_APP_PROTOCOL || 'https';
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || 'localhost';
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || '4000';

// Construct the backend URL dynamically
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

function Home() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    
    useEffect(() => {
        async function fetchUserSession() {
            try {
                const response = await axiosGetData(`${BACKEND_URL}/api/auth/session`);
                if (response.user) {
                    setUser(response.user);
                } else {
                    navigate("/login", { replace: true }); // Redirect to login if not authenticated
                }
            } catch (error) {
                console.error("Session check failed:", error);
                navigate("/login"); // Redirect to login
            }
        }
        fetchUserSession();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await axiosGetData(`${BACKEND_URL}/api/auth/logout`);
            navigate("/login"); // Redirect after logout
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };
    
    if (!user) {
        return null; // Return null if user is not authenticated
    }
    
    // Conditional rendering based on the user's role
    switch (user.role) {
        case 'Admin':
            return <AdminHome handleLogout={handleLogout}/>;
        case 'Tutor':
            return <TutorHome handleLogout={handleLogout}/>;
        case 'Student':
            return <StudentHome handleLogout={handleLogout}/>;
        default:
            return (
                <div className={styles.container}>
                    <h1 className={styles.heading}>Home Page</h1>
                    <p className={styles.welcome}>Welcome to the home page, guest!</p>
                    <button className={styles.logoutButton} onClick={handleLogout}>Logout</button>
                </div>
            );
    }
}

export default Home;