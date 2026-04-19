import React from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import SessionCardSwipeCore from "../components/SessionCardSwipeCore";
import styles from "../styles/SessionCardSwipe.module.css";

const TUTOR_INSTRUCTION = "Please swipe your ID card to check in or out.";
const STUDENT_INSTRUCTION = "Please swipe your student ID card to check in or out.";

function PublicSessionCardSwipe() {
  const { role } = useParams();
  if (role !== "tutor" && role !== "student") {
    return <Navigate to="/card-swipe" replace />;
  }
  const instruction = role === "student" ? STUDENT_INSTRUCTION : TUTOR_INSTRUCTION;
  const capitalizedRole = role === "student" ? "Student" : "Tutor";

  return (
    <div className={styles.container}>
      <div className={styles.mainContentPublic}>
        <Link to="/card-swipe" className={styles.publicBackLink}>
          ← Card Swipe
        </Link>
        <h1 className={styles.heading}>Swipe Your UTA ID</h1>
        <SessionCardSwipeCore instruction={instruction} welcomeFlow userRole={capitalizedRole} />
      </div>
    </div>
  );
}

export default PublicSessionCardSwipe;