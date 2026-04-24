import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/Sidebar/AdminSidebar";
import styles from "../../styles/TutorRequests.module.css";
import { useSidebar } from "../../components/Sidebar/SidebarContext";

const PROTOCOL = process.env.REACT_APP_PROTOCOL || "https";
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "4000";
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

const TutorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    getRequests();
  }, []);

  const getRequests = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/tutor-request/pending`, {
        withCredentials: true,
      });

      setRequests(response.data);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Failed to load requests.");
    }
  };

  const handleReview = async (userId, decision) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/tutor-request/review`,
        { userId, decision },
        { withCredentials: true }
      );

      getRequests();
    } catch (err) {
      console.error(`Error submitting ${decision}:`, err);
    }
  };

  const viewPDF = (base64Data) => {
    try {
      const base64String = base64Data.split(";base64,")[1];
      const byteCharacters = atob(base64String);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const file = new Blob([byteArray], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);

      window.open(fileURL, "_blank");
    } catch (err) {
      console.error("Failed to open PDF:", err);
    }
  };

  return (
    <div className={styles.container}>
      <AdminSidebar selected="tutor-requests" />

      <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ""}`}>
        <div className={`${styles.headerSection} ${isCollapsed ? styles.headerSectionCollapsed : ""}`}>
          <h1 className={styles.heading}>Incoming Tutor Requests</h1>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <table className={styles.requestTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Student ID</th>
              <th>Resume</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan="4">No pending requests.</td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req._id}>
                  <td>{req.name}</td>
                  <td>{req.studentID}</td>

                  <td>
                    {req.resume ? (
                      <button
                        className={styles.linkButton}
                        onClick={() => viewPDF(req.resume)}
                      >
                        View Resume
                      </button>
                    ) : (
                      "No resume"
                    )}
                  </td>

                  <td>
                    <button
                      className={styles.approveButton}
                      onClick={() => handleReview(req.userId._id, "approved")}
                    >
                      Approve
                    </button>

                    <button
                      className={styles.rejectButton}
                      onClick={() => handleReview(req.userId._id, "rejected")}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TutorRequests;