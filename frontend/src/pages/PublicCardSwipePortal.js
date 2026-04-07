import React from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../styles/PublicCardSwipe.module.css";

function PublicCardSwipePortal() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <h1 className={styles.title}>Card Swipe</h1>
        <div className={styles.buttonRow}>
          <button type="button" className={styles.choiceButton} onClick={() => navigate("/card-swipe/tutor")}>
            Tutor
          </button>
          <button type="button" className={styles.choiceButton} onClick={() => navigate("/card-swipe/student")}>
            Student
          </button>
        </div>
        <Link to="/login" className={styles.backLink}>
          Back to login
        </Link>
      </div>
    </div>
  );
}

export default PublicCardSwipePortal;