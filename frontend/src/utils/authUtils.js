import { axiosGetData } from "../utils/api";

// Get configuration from environment variables
const PROTOCOL = process.env.REACT_APP_PROTOCOL || 'https';
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || 'localhost';
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || '4000';

// Construct the backend URL dynamically
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

export const handleLogout = async () => {
    try {
        await axiosGetData(`${BACKEND_URL}/api/auth/logout`); // Call logout API
    } catch (error) {
        console.error("Logout failed:", error);
    }

    localStorage.clear(); // Ensure local storage is cleared
    sessionStorage.clear(); // Clear session storage
    window.location.href = "/login"; // Redirect to login immediately
};