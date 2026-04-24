import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "../../styles/ViewTutors.module.css";
import StudentSidebar from "../../components/Sidebar/StudentSidebar";
import { SearchBar } from "../../components/SearchBar";
import { SearchResultsTutorProfiles } from "../../components/SearchResultsTutorProfiles";
import { SearchInfo } from "../../components/SearchInfo";
import { useSidebar } from "../../components/Sidebar/SidebarContext";

const PROTOCOL = process.env.REACT_APP_PROTOCOL || "https";
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "4000";

const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

function ViewTutors() {
  const { isCollapsed } = useSidebar();
  const [allTutors, setAllTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState("");
  const [clicked, setClicked] = useState(true);

  useEffect(() => {
    const fetchAllTutors = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/users/tutors/ALL`);
        const tutors = response.data.filter((user) => user.role === "Tutor");

        setResults(tutors);
        setAllTutors(tutors);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };
    fetchAllTutors();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <StudentSidebar />
        <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ""}`}>
          <div className={`${styles.headerSection} ${isCollapsed ? styles.headerSectionCollapsed : ""}`}>
            <h1 className={styles.heading}>Our Tutors</h1>
          </div>

          <div className={styles.spinnerContainer}>
            <div className={styles.spinner}></div>
            <p>Loading tutors...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <StudentSidebar selected="find-tutors" />

      <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ""}`}>
        
       
        <div className={`${styles.headerSection} ${isCollapsed ? styles.headerSectionCollapsed : ""}`}>
          <h1 className={styles.heading}>Our Tutors</h1>
        </div>

        <div className={styles.pageContent}>

          <div className={styles.searchCard}>
            <div className={styles.searchBarContainer}>
              <SearchBar
                allTutors={allTutors}
                setResults={setResults}
                setSearch={setSearch}
                setClicked={setClicked}
              />
            </div>

            <SearchInfo
              setResults={setResults}
              allTutors={allTutors}
              search={search}
              setClicked={setClicked}
              clicked={clicked}
            />
          </div>

          <div className={styles.resultsCard}>
            <SearchResultsTutorProfiles results={results} />
          </div>

        </div>
      </div>
    </div>
  );
}

export default ViewTutors;