import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from '../../styles/UserReport.module.css';
import { useParams, useNavigate } from 'react-router-dom';

const BACKEND_URL = 'http://localhost:4000';

const StudentUserReport = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [courseHistory, setCourseHistory] = useState([]);
  const [viewOption, setViewOption] = useState('sessions');
  const [sessionSort, setSessionSort] = useState('recent'); 
  const [courseSort, setCourseSort] = useState('most');     
  const navigate = useNavigate();

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await axios.get(`${BACKEND_URL}/api/users/${userId}`);
        setUser(userRes.data);

        const sessionsRes = await axios.get(`${BACKEND_URL}/api/sessions/student/${userId}`);
        setSessions(sessionsRes.data);

        const coursesRes = await axios.get(`${BACKEND_URL}/api/sessions/student/${userId}/courses`);
        setCourseHistory(coursesRes.data);
      } catch (error) {
        console.error('Error fetching student report data', error);
      }
    };

    fetchData();
  }, [userId]);

  if (!user) return <p>Loading student data...</p>;

  const sortedSessions = [...sessions].sort((a, b) => {
    if (sessionSort === 'recent') {
      return new Date(b.sessionTime) - new Date(a.sessionTime);
    } else {
      return new Date(a.sessionTime) - new Date(b.sessionTime);
    }
  });

  const sortedCourses = [...courseHistory].sort((a, b) => {
    if (courseSort === 'most') {
      return b.visitCount - a.visitCount;
    } else {
      return a.visitCount - b.visitCount;
    }
  });

  return (
    <div className={styles.mainContent}>
      <div className={styles.topBar}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          ← Back
        </button>
      </div>

      <h1 className={styles.heading}>Student Report</h1>

      <div className={styles.reportSection}>
        <h2>Student Information</h2>
        <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Phone:</strong> {user.phone}</p>
        <p><strong>Major:</strong> {user.major && user.major.trim() !== "" ? user.major : "N/A"}</p>
        <p><strong>Student ID:</strong> {user.studentID}</p>
      </div>

      <div className={styles.reportSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <select
            value={viewOption}
            onChange={(e) => setViewOption(e.target.value)}
            style={{ padding: '6px 10px', fontSize: '1rem' }}
          >
            <option value="sessions">Session History</option>
            <option value="courses">Full Course History</option>
          </select>

          <select
            value={viewOption === 'sessions' ? sessionSort : courseSort}
            onChange={(e) => {
              const value = e.target.value;
              if (viewOption === 'sessions') {
                setSessionSort(value);
              } else {
                setCourseSort(value);
              }
            }}
            style={{ padding: '6px 10px', fontSize: '1rem' }}
          >
            {viewOption === 'sessions' ? (
              <>
                <option value="recent">Sort by: Most Recent</option>
                <option value="oldest">Sort by: Oldest</option>
              </>
            ) : (
              <>
                <option value="most">Sort by: Most Course Visits</option>
                <option value="least">Sort by: Least Course Visits</option>
              </>
            )}
          </select>
        </div>

        {viewOption === 'sessions' ? (
          sortedSessions.length > 0 ? (
            <ul className={styles.sessionList}>
              {sortedSessions.map((session, index) => (
                <li key={index} className={styles.sessionItem}>
                  <span>{formatDateTime(session.sessionTime)}</span>
                  <span>Tutor: {session.tutorID?.firstName} {session.tutorID?.lastName}</span>
                  <span>Course: {session.courseID?.code} - {session.courseID?.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No sessions found.</p>
          )
        ) : (
          sortedCourses.length > 0 ? (
            <ul className={styles.sessionList}>
              {sortedCourses.map((course, index) => (
                <li key={index} className={styles.sessionItem}>
                  <span>{course.code} - {course.title}</span>
                  <span>Visits: {course.visitCount}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No courses found.</p>
          )
        )}
      </div>
    </div>
  );
};

export default StudentUserReport;
