import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/Sidebar/AdminSidebar";
import styles from "../../styles/Feedback.module.css";
import { useSidebar } from "../../components/Sidebar/SidebarContext";

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    fetch("/api/feedback")
      .then((res) => res.json())
      .then((data) => setReviews(data))
      .catch(console.error);
  }, []);

  return (
    <div className={styles.container}>
      <AdminSidebar selected="admin-reviews" />

      <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ""}`}>
        <div className={`${styles.headerSection} ${isCollapsed ? styles.headerSectionCollapsed : ""}`}>
          <h1 className={styles.heading}>Tutor Reviews</h1>
        </div>

        <table className={styles.reviewTable}>
          <thead>
            <tr>
              <th>Tutor</th>
              <th>Student</th>
              <th>Rating</th>
              <th>Feedback</th>
              <th>Submitted</th>
            </tr>
          </thead>

          <tbody>
            {reviews.length === 0 ? (
              <tr>
                <td colSpan="5">No reviews found.</td>
              </tr>
            ) : (
              reviews.map((review) => (
                <tr
                  key={review._id}
                  onClick={() => setSelectedReview(review)}
                >
                  <td>
                    {review.tutorUniqueId
                      ? `${review.tutorUniqueId.firstName || ""} ${review.tutorUniqueId.lastName || ""}`.trim()
                      : "Unknown"}
                  </td>

                  <td>
                    {review.studentUniqueId
                      ? `${review.studentUniqueId.firstName || ""} ${review.studentUniqueId.lastName || ""}`.trim()
                      : "Unknown"}
                  </td>

                  <td>
                    <span className={styles.starsDisplay}>
                      {"★".repeat(review.rating) + "☆".repeat(5 - review.rating)}
                    </span>
                  </td>

                  <td className={styles.feedbackCell}>
                    {review.feedbackText}
                  </td>

                  <td>
                    {new Date(review.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {selectedReview && (
          <div className={styles.detailCard}>
            <h2>Review Details</h2>

            <p>
              <strong>Tutor:</strong>{" "}
              {selectedReview.tutorUniqueId
                ? `${selectedReview.tutorUniqueId.firstName || ""} ${selectedReview.tutorUniqueId.lastName || ""}`.trim()
                : "Unknown"}
            </p>

            <p>
              <strong>Student:</strong>{" "}
              {selectedReview.studentUniqueId
                ? `${selectedReview.studentUniqueId.firstName || ""} ${selectedReview.studentUniqueId.lastName || ""}`.trim()
                : "Unknown"}
            </p>

            <p>
              <strong>Rating:</strong>{" "}
              <span className={styles.starsDisplay}>
                {"★".repeat(selectedReview.rating) + "☆".repeat(5 - selectedReview.rating)}
              </span>
            </p>

            <p>
              <strong>Feedback:</strong>
              <br />
              {selectedReview.feedbackText}
            </p>

            <p>
              <strong>Submitted on:</strong>{" "}
              {new Date(selectedReview.createdAt).toLocaleString()}
            </p>

            <button
              onClick={() => setSelectedReview(null)}
              className={styles.actionButton}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviews;