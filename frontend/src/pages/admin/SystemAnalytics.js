import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/SystemAnalytics.module.css";
import AdminSideBar from "../../components/Sidebar/AdminSidebar";
import { useSidebar } from "../../components/Sidebar/SidebarContext";

// Get configuration from environment variables
const PROTOCOL = process.env.REACT_APP_PROTOCOL || 'https';
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || 'localhost';
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || '4000';

// Construct the backend URL dynamically
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

// Inline default avatar as base64 to avoid HTTP requests
const DEFAULT_AVATAR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMjU2Ij48cmVjdCBmaWxsPSIjZTllOWU5IiB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIvPjxjaXJjbGUgY3g9IjEyOCIgY3k9Ijk2IiByPSI0MCIgZmlsbD0iIzU5NjI3NCIvPjxwYXRoIGZpbGw9IiM1OTYyNzQiIGQ9Ik0yMTYsMTk2Yy0wLjQtMzcuOC0zMi43LTY4LTcyLTY4aC0zMmMtMzkuMywwLTcxLjYsMzAuMi03Miw2OEgyMTZ6Ii8+PC9zdmc+";

// Create a cache object to store the analytics data
// This will persist between renders but will be reset when the page is refreshed
const analyticsCache = {
  data: null,
  timestamp: null,
  cacheDuration: 5 * 60 * 1000 // 5 minutes in milliseconds
};

function SystemAnalytics() {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { isCollapsed } = useSidebar();
  
  // Initialize navigate for routing
  const navigate = useNavigate();
  
  // Define fetchTutors as a useCallback so we can use it both in useEffect and the refresh button
  const fetchTutors = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if we have valid cached data
      const now = new Date();
      if (
        analyticsCache.data && 
        analyticsCache.timestamp && 
        now.getTime() - analyticsCache.timestamp < analyticsCache.cacheDuration
      ) {
        console.log("Using cached tutor analytics data");
        setTutors(analyticsCache.data);
        setLastUpdated(new Date(analyticsCache.timestamp));
        setLoading(false);
        return;
      }
      
      console.log("Fetching fresh tutor analytics data...");
      
      // Step 1: Fetch all tutors from users API
      const tutorsResponse = await axios.get(`${BACKEND_URL}/api/users/tutors`);
      const tutorsList = tutorsResponse.data;
      console.log(`Fetched ${tutorsList.length} tutors from users API`);
      
      // Step 2: Fetch tutor profiles for profile pictures
      const tutorData = await Promise.all(
        tutorsList.map(async (tutor) => {
          try {
            // Get profile picture if available
            const profileResponse = await axios.get(`${BACKEND_URL}/api/profile/${tutor._id}`);
            const profile = profileResponse.data;
            
            // Get session count (completed or scheduled sessions)
            const sessionsResponse = await axios.get(`${BACKEND_URL}/api/sessions?tutorID=${tutor._id}`);
            const totalSessions = tutor.totalSessions;
            
            // Calculate average rating from feedback
            let avgRating = tutor.avgRating || 0;
            
            return {
              id: tutor._id,
              name: `${tutor.firstName} ${tutor.lastName}`,
              profilePic: profile?.profilePicture || DEFAULT_AVATAR,
              avgRating: avgRating,
              totalSessions: totalSessions
            };
          } catch (error) {
            console.log(`Error fetching details for tutor ${tutor._id}:`, error.message);
            // Return basic info if additional data fetching fails
            return {
              id: tutor._id,
              name: `${tutor.firstName} ${tutor.lastName}`,
              profilePic: DEFAULT_AVATAR,
              avgRating: tutor.rating || 0,
              totalSessions: 0
            };
          }
        })
      );
      
      // Update the cache with the new data
      analyticsCache.data = tutorData;
      analyticsCache.timestamp = now.getTime();
      
      setTutors(tutorData);
      setLastUpdated(now);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tutor analytics:", error);
      const errorMessage = error.response 
        ? `Error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}` 
        : "Failed to connect to the server. Please try again later.";
      console.log("Using local fallback data while API is unavailable");
      
      // Fallback to local data
      setTutors([
        {
          id: 1,
          name: "Jane Smith",
          profilePic: DEFAULT_AVATAR,
          avgRating: 4.8,
          totalSessions: 24
        },
        {
          id: 2,
          name: "John Doe",
          profilePic: DEFAULT_AVATAR,
          avgRating: 4.5,
          totalSessions: 18
        },
        {
          id: 3,
          name: "Sarah Johnson",
          profilePic: DEFAULT_AVATAR,
          avgRating: 0,
          totalSessions: 3
        }
      ]);
      setError(`${errorMessage} (Using sample data for display purposes)`);
      setLoading(false);
    }
  }, []);

  // Fetch tutors data from API on component mount
  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  // Function to manually refresh the data
  const handleRefresh = () => {
    // Clear the cache and re-fetch
    analyticsCache.data = null;
    analyticsCache.timestamp = null;
    fetchTutors();
  };

  // Handle click on a tutor row to navigate to detail page
  const handleTutorClick = (tutorId) => {
    navigate(`/tutor/${tutorId}`);
  };

  // Format the last updated time
  const formatLastUpdated = (date) => {
    if (!date) return "";
    
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    }).format(date);
  };

  return (
    <div className={styles.container}>
      <AdminSideBar selected="analytics"></AdminSideBar>
      <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ""}`}>
        <div className={styles.headerContainer}>
          <h1 className={styles.heading}>System Analytics</h1>
          
          {lastUpdated && (
            <div className={styles.refreshContainer}>
              <span className={styles.lastUpdated}>
                Last updated: {formatLastUpdated(lastUpdated)}
              </span>
              <button 
                className={styles.refreshButton}
                onClick={handleRefresh}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh Data"}
              </button>
            </div>
          )}
        </div>
        
        <div className={styles.analyticsSection}>
          <h2 className={styles.sectionTitle}>Tutor Performance</h2>
          
          {loading ? (
            <div className={styles.loadingContainer}>
              <p>Loading tutor data...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p>{error}</p>
            </div>
          ) : tutors.length === 0 ? (
            <div className={styles.emptyContainer}>
              <p>No tutor data available.</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.tutorTable}>
                <thead>
                  <tr>
                    <th className={styles.imageColumn}></th>
                    <th>Tutor Name</th>
                    <th>Average Rating</th>
                    <th>Total Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {tutors.map(tutor => (
                    <tr 
                      key={tutor.id} 
                      onClick={() => handleTutorClick(tutor.id)}
                      className={styles.clickableRow}
                    >
                      <td className={styles.imageCell}>
                        <img 
                          src={tutor.profilePic} 
                          alt={`${tutor.name}'s profile`} 
                          className={styles.profilePic}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = DEFAULT_AVATAR;
                          }}
                        />
                      </td>
                      <td>{tutor.name}</td>
                      <td>
                        <div className={styles.ratingContainer}>
                          <span className={styles.ratingValue}>
                            {tutor.avgRating || 0}
                          </span>
                          <div className={styles.starRating}>
                            {[1, 2, 3, 4, 5].map(star => (
                              <span 
                                key={star} 
                                className={`${styles.star} ${
                                  star <= Math.round(tutor.avgRating) 
                                    ? styles.filled 
                                    : styles.empty
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td>{tutor.totalSessions}</td>
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

export default SystemAnalytics;