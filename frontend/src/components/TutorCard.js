import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import Feedback from "../pages/student/Feedback";
import FindMyTutorProfile from "../pages/student/FindmyTutorProfile";
import styles from "../styles/component/TutorCard.module.css";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const PROTOCOL = process.env.REACT_APP_PROTOCOL || "https";
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "4000";
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;


const TutorCard = ({ user }) => {
  const navigate = useNavigate(); //Define navigate
  const [courseMap, setCourseMap] = useState({});

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/courses`, {
          withCredentials: true,
        });
        const map = {};
        res.data.forEach((course) => {
          map[course._id] = course.name;
        });
        setCourseMap(map);
      } catch (err) {
        console.error("Failed to load course list:", err);
      }
    };

    fetchCourses();
  }, []);

  // Get profile picture URL, fallback to default avatar if not available
  const getProfilePicture = () => {
    if (user.profile && user.profile.profilePicture) {
      return user.profile.profilePicture;
    }
    return "https://gravatar.com/avatar/3cee6af8588784b73feeca82f894957a?s=400&d=mp&r=x";
  };

  // Get courses from profile if available
  const getCourses = () => {
    if (Array.isArray(user.courseNames) && user.courseNames.length > 0 ){
      console.log("user.courseName for", user.firstName, user.courseNames);
      return user.courseNames;
    }
    return ["None"];
  };

  return (
    <div className={styles.card}>
      <div className={styles.tutor}>
        <div className={styles.imageCrop}>
          <img
            className={styles.avatar}
            src={getProfilePicture()}
            alt={`${user.firstName} ${user.lastName}`}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "https://gravatar.com/avatar/3cee6af8588784b73feeca82f894957a?s=400&d=mp&r=x";
            }}
          />
        </div>
        <div className={styles.bio}>
          <div className={styles.name}>
            {user.firstName} {user.lastName}
          </div>
          <div className={styles.skills}>
            {getCourses().map((course) => (
              <div className={styles.skill} key={uuidv4()}>
                {course}
              </div>
            ))}
          </div>
          <div className={styles.ratings}>
            <i
              className={
                user.rating >= 1
                  ? `fa fa-star ${styles.color}`
                  : `fa-regular fa-star ${styles.color}`
              }
            ></i>
            <i
              className={
                user.rating >= 2
                  ? `fa fa-star ${styles.color}`
                  : `fa-regular fa-star ${styles.color}`
              }
            ></i>
            <i
              className={
                user.rating >= 3
                  ? `fa fa-star ${styles.color}`
                  : `fa-regular fa-star ${styles.color}`
              }
            ></i>
            <i
              className={
                user.rating >= 4
                  ? `fa fa-star ${styles.color}`
                  : `fa-regular fa-star ${styles.color}`
              }
            ></i>
            <i
              className={
                user.rating >= 5
                  ? `fa fa-star ${styles.color}`
                  : `fa-regular fa-star ${styles.color}`
              }
            ></i>
            {user.rating != null && (
              <>
                <span className={styles.ratingNum}>
                  {user.rating.toFixed(1)}
                </span>
                <span> ({user.numberOfRating})</span>
              </>
            )}
          </div>
        </div>
      </div>
      <hr className={styles.separater}></hr>
      <div className={styles.tutorButtons}>
        <button
          className={styles.tutorButton}
          onClick={() => navigate("/feedback")}
        >
          Rate
        </button>
        <button
          className={styles.tutorButton}
          onClick={() => navigate(`/FindMyTutorProfile/${user._id}`)}
        >
          Profile
        </button>
      </div>
    </div>
  );
};

TutorCard.propTypes = {
  user: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    rating: PropTypes.number,
    profile: PropTypes.shape({
      profilePicture: PropTypes.string,
      courses: PropTypes.arrayOf(PropTypes.string),
    }),
  }).isRequired,
};

export default TutorCard;
