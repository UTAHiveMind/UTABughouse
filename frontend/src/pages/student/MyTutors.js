// import React, { useEffect, useState } from "react";
// import axios from "axios";
import styles from "../../styles/MyTutors.module.css";
import StudentSidebar from "../../components/Sidebar/StudentSidebar";

function MyTutors() {
  return (
    <div className={styles.container}>
      <StudentSidebar selected="my-tutors"></StudentSidebar>
      <div className={styles.mainContent}>
        <h1 className={styles.heading}>My Tutors</h1>
      </div>
    </div>
  );
}

export default MyTutors;
