import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import styles from "../../styles/TutorProfile.module.css";
import TutorSidebar from "../../components/Sidebar/TutorSidebar";
import Select from "react-select";
import { useSidebar } from "../../components/Sidebar/SidebarContext";

const PROTOCOL = process.env.REACT_APP_PROTOCOL || "https";
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "4000";
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

function TutorProfile() {
  const [profile, setProfile] = useState({
    studentID: "",
    profilePicture: null,
    name: "",
    bio: "",
    courses: [],
    skills: "",
    major: "",
    currentYear: ""
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [userData, setUserData] = useState(null);
  const [courseList, setCourseList] = useState([]);
  const [courseMap, setCourseMap] = useState({});
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/auth/session`, {
          withCredentials: true
        });

        if (response.data && response.data.user) {
          setUserData(response.data.user);
        } else {
          setError("No user session found. Please log in again.");
        }
      } catch (error) {
        console.error("Error fetching user session:", error);
        setError("Failed to authenticate user. Please log in again.");
      } finally {
        setSessionLoading(false);
      }
    };

    fetchUserSession();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/courses`, {
          withCredentials: true
        });

        setCourseList(response.data);

        const map = {};
        response.data.forEach((course) => {
          map[course._id] = `${course.title} (${course.code})`;
        });

        setCourseMap(map);
      } catch (err) {
        console.error("Failed to fetch courses", err);
      }
    };

    fetchCourses();
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!userData || !userData.id) return;

    try {
      const response = await axios.get(`${BACKEND_URL}/api/profile/${userData.id}`, {
        withCredentials: true
      });

      setProfile((prev) => ({
        ...prev,
        ...response.data,
        courses: Array.isArray(response.data.courses) ? response.data.courses : []
      }));
    } catch (profileError) {
      if (profileError.response && profileError.response.status === 404) {
        const defaultProfile = {
          studentID: userData.studentID || "",
          profilePicture: null,
          name: `${userData.firstName} ${userData.lastName}`,
          bio: "",
          courses: [],
          skills: "",
          major: "",
          currentYear: ""
        };

        setProfile(defaultProfile);
      } else {
        console.error("Error loading profile:", profileError);
        setError("Error loading profile. Please try refreshing the page.");
      }
    } finally {
      setLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    if (userData && userData.id) {
      fetchProfile();
    }
  }, [userData, fetchProfile]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setProfile((prevProfile) => ({
          ...prevProfile,
          profilePicture: reader.result
        }));
      };

      reader.readAsDataURL(file);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!userData || !userData.id) {
      setError("User session expired. Please log in again.");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("userId", userData.id);
      formData.append("name", profile.name);
      formData.append("bio", profile.bio);
      formData.append("courses", JSON.stringify(profile.courses));
      formData.append("skills", profile.skills);
      formData.append("major", profile.major);
      formData.append("currentYear", profile.currentYear);

      if (profile.profilePicture?.startsWith("data:image")) {
        const response = await fetch(profile.profilePicture);
        const blob = await response.blob();
        formData.append("profilePicture", blob, "profile.jpg");
      }

      await axios.post(`${BACKEND_URL}/api/profile/tutor`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true
      });

      setSuccessMessage("Profile saved successfully!");
      setIsEditing(false);
      fetchProfile();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setError("Error saving profile. Please try again.");
    }
  };

  if (sessionLoading || loading) {
    return (
      <div className={styles.container}>
        <TutorSidebar selected="profile" />

        <div
          className={`${styles.mainContent} ${
            isCollapsed ? styles.mainContentCollapsed : ""
          }`}
        >
          <div
            className={`${styles.headerSection} ${
              isCollapsed ? styles.headerSectionCollapsed : ""
            }`}
          >
            <h1 className={styles.heading}>Profile</h1>
          </div>

          <div className={styles.spinnerContainer}>
            <div className={styles.spinner}></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className={styles.container}>
        <TutorSidebar selected="profile" />

        <div
          className={`${styles.mainContent} ${
            isCollapsed ? styles.mainContentCollapsed : ""
          }`}
        >
          <div
            className={`${styles.headerSection} ${
              isCollapsed ? styles.headerSectionCollapsed : ""
            }`}
          >
            <h1 className={styles.heading}>Profile</h1>
          </div>

          <div className={styles.error}>
            Session expired or not found. Please log in again.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <TutorSidebar selected="tutor-profile" />

      <div
        className={`${styles.mainContent} ${
          isCollapsed ? styles.mainContentCollapsed : ""
        }`}
      >
        <div
          className={`${styles.headerSection} ${
            isCollapsed ? styles.headerSectionCollapsed : ""
          }`}
        >
          <h1 className={styles.heading}>Profile</h1>
        </div>

        <div className={styles.profileContainer}>
          {error && <div className={styles.error}>{error}</div>}
          {successMessage && <div className={styles.success}>{successMessage}</div>}

          <div className={styles.profileSection}>
            <div className={styles.imageSection}>
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt="Profile"
                  className={styles.profileImage}
                />
              ) : (
                <div className={styles.profilePlaceholder}>
                  <span>No Image</span>
                </div>
              )}

              {isEditing && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className={styles.fileInput}
                />
              )}
            </div>

            <div className={styles.profileInfo}>
              <p>
                <strong>Name:</strong>{" "}
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    required
                    className={styles.inputField}
                  />
                ) : (
                  profile.name || "Not provided"
                )}
              </p>

              <p>
                <strong>Student ID:</strong> {profile.studentID || "Not provided"}
              </p>

              <p>
                <strong>Bio:</strong>{" "}
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    className={styles.textareaField}
                  />
                ) : (
                  profile.bio || "Not provided"
                )}
              </p>

              <p>
                <strong>Courses:</strong>{" "}
                {isEditing ? (
                  <Select
                    isMulti
                    name="courses"
                    value={courseList
                      .filter((course) =>
                        profile.courses.some((c) =>
                          typeof c === "string" ? c === course._id : c._id === course._id
                        )
                      )
                      .map((course) => ({
                        value: course._id,
                        label: `${course.title} (${course.code})`
                      }))}
                    options={courseList.map((course) => ({
                      value: course._id,
                      label: `${course.title} (${course.code})`
                    }))}
                    onChange={(selectedOptions) =>
                      setProfile((prev) => ({
                        ...prev,
                        courses: selectedOptions.map((opt) => opt.value)
                      }))
                    }
                    className={styles.selectField}
                    classNamePrefix="react-select"
                    placeholder="Select courses..."
                  />
                ) : profile.courses.length > 0 ? (
                  <ul className={styles.courseList}>
                    {profile.courses.map((course) => (
                      <li key={course.id || course._id || course}>
                        {course.title && course.code
                          ? `${course.title} (${course.code})`
                          : courseMap[course._id || course] || "Unknown Course"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span>Not provided</span>
                )}
              </p>

              <p>
                <strong>Skills:</strong>{" "}
                {isEditing ? (
                  <input
                    type="text"
                    name="skills"
                    value={profile.skills}
                    onChange={handleChange}
                    className={styles.inputField}
                  />
                ) : (
                  profile.skills || "Not provided"
                )}
              </p>

              <p>
                <strong>Major:</strong>{" "}
                {isEditing ? (
                  <select
                    name="major"
                    value={profile.major}
                    onChange={handleChange}
                    className={styles.inputField}
                  >
                    <option value="">Select Major</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Computer Engineer">Computer Engineer</option>
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="N/A">N/A</option>
                  </select>
                ) : (
                  profile.major || "Not provided"
                )}
              </p>

              <p>
                <strong>Year:</strong>{" "}
                {isEditing ? (
                  <select
                    name="currentYear"
                    value={profile.currentYear}
                    onChange={handleChange}
                    required
                    className={styles.inputField}
                  >
                    <option value="">Select Year</option>
                    <option value="Freshman">Freshman</option>
                    <option value="Sophomore">Sophomore</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                    <option value="Master's Student">Master's Student</option>
                    <option value="PhD Student">PhD Student</option>
                  </select>
                ) : (
                  profile.currentYear || "Not provided"
                )}
              </p>
            </div>

            <div className={styles.buttonGroup}>
              <button
                className={styles.editButton}
                onClick={() => {
                  if (isEditing) {
                    handleSubmit();
                  } else {
                    setIsEditing(true);
                  }
                }}
              >
                {isEditing ? "Save" : "Edit"}
              </button>

              {isEditing && (
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setIsEditing(false);
                    fetchProfile();
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorProfile;