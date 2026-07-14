import React, { useEffect, useState } from "react";
import styles from "../styles/ViewTutors.module.css";
import TutorCard from "./TutorCard";

export const SearchResultsTutorProfiles = ({
  results /*, setResults, allTutors, search*/,
}) => {
  const [users, setUsers] = useState([]);
  //const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutorsWithProfiles = async () => {
      setUsers(results);
    };
    fetchTutorsWithProfiles();
    //setLoading(false);
  }, [results]);

  /*if (loading) {
    return <p>Loading...</p>;
  }*/

  /*if (loading) {
    return (
      <div className={styles.container}>
        <StudentSidebar />
        <div className={styles.mainContent}>
          <div className={styles.spinnerContainer}>
            <div className={styles.spinner}></div>
            <p>Loading tutors...</p>
          </div>
        </div>
      </div>
    );
  }*/

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div className={styles.cardContainer}>
          {users.length > 0 ? (
            users.map((user) => (
              <TutorCard user={user} key={user._id}></TutorCard>
            ))
          ) : (
            <p className={styles.noTutors}>No tutors found.</p>
          )}
        </div>
      </div>
    </div>
  );
};
