import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import styles from "../../styles/StudentProfile.module.css";
import StudentSidebar from "../../components/Sidebar/StudentSidebar";
import Select from "react-select";
import { useSidebar } from "../../components/Sidebar/SidebarContext";

const PROTOCOL = process.env.REACT_APP_PROTOCOL || "https";
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "4000";
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

function StudentProfile() {
  const [profile, setProfile] = useState({
    studentID: "",
    profilePicture: null,
    name: "",
    bio: "",
    major: "",
    currentYear: "",
    coursesEnrolled: [],
    areasOfInterest: [],
    preferredLearningStyle: "",
    academicGoals: ""
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [userData, setUserData] = useState(null);
  const [courseList, setCourseList] = useState([]);
  const [courseMap, setCourseMap] = useState({});

  const [tutorRequestStatus, setTutorRequestStatus] = useState(null);
  const [tutorRequestPending, setTutorRequestPending] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [tutorRequestsEnabled, setTutorRequestsEnabled] = useState(true);

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

    const fetchTutorSetting = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/bughouse`);
        setTutorRequestsEnabled(response.data?.tutorRequestsEnabled ?? true);
      } catch (err) {
        console.error("Failed to fetch tutorRequestsEnabled:", err);
        setTutorRequestsEnabled(true);
      }
    };

    fetchTutorSetting();
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!userData || !userData.id) return;

    try {
      const response = await axios.get(`${BACKEND_URL}/api/profile/${userData.id}`, {
        withCredentials: true
      });

      setProfile(response.data);
      setTutorRequestStatus(response.data.tutorRequestStatus || null);
      setTutorRequestPending(response.data.tutorRequestPending || false);
    } catch (profileError) {
      if (profileError.response && profileError.response.status === 404) {
        const defaultProfile = {
          studentID: userData.studentID || "",
          profilePicture: null,
          name: `${userData.firstName} ${userData.lastName}`,
          bio: "",
          major: "",
          currentYear: "",
          coursesEnrolled: [],
          areasOfInterest: [],
          preferredLearningStyle: "",
          academicGoals: ""
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
          profilePicture: reader.result,
          hasNewImage: true
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

  const handleArrayChange = (event, field) => {
    const value = event.target.value;
    const arrayValue = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setProfile((prevProfile) => ({
      ...prevProfile,
      [field]: arrayValue
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
      formData.append("major", profile.major);
      formData.append("currentYear", profile.currentYear);
      formData.append("coursesEnrolled", JSON.stringify(profile.coursesEnrolled));
      formData.append("areasOfInterest", JSON.stringify(profile.areasOfInterest));
      formData.append("preferredLearningStyle", profile.preferredLearningStyle);
      formData.append("academicGoals", profile.academicGoals);

      if (profile.profilePicture?.startsWith("data:image")) {
        const response = await fetch(profile.profilePicture);
        const blob = await response.blob();
        formData.append("profilePicture", blob, "profile.jpg");
      }

      await axios.post(`${BACKEND_URL}/api/profile/student`, formData, {
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

  const handleTutorRequest = async () => {
    try {
      const formData = new FormData();

      formData.append("userId", userData.id);
      formData.append("resume", resumeFile);

      await axios.post(`${BACKEND_URL}/api/tutor-request/request`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true
      });

      setTutorRequestPending(true);
      setTutorRequestStatus("pending");

      setError("");
      setSuccessMessage("Request has been sent!");
    } catch (err) {
      console.error("Failed to request tutor role:", err);
      setError("Error submitting request. Try again later.");
    }
  };

  const handleResumeUpload = (event) => {
    const file = event.target.files[0];

    if (file) {
      if (file.type !== "application/pdf") {
        setError("PDF Uploads only!");
        return;
      }

      setResumeFile(file);
      setSuccessMessage("Resume selected successfully.");
    } else {
      setError("Error submitting resume. Try again later.");
    }
  };

  const displayArray = (arr) =>
    Array.isArray(arr) && arr.length > 0 ? arr.join(", ") : "Not provided";

  if (sessionLoading || loading) {
    return (
      <div className={styles.container}>
        <StudentSidebar selected="student-profile" />

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
        <StudentSidebar selected="student-profile" />

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
            <div className={styles.error}>
              Session expired or not found. Please log in again.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <StudentSidebar selected="student-profile" />

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
          {successMessage && (
            <div className={styles.successMessage}>{successMessage}</div>
          )}

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
                  className={styles.inputField}
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
                    className={styles.selectField}
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

              <p>
                <strong>Courses:</strong>{" "}
                {isEditing ? (
                  <Select
                    isMulti
                    name="courses"
                    value={courseList
                      .filter((course) =>
                        profile.coursesEnrolled.includes(course._id)
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
                        coursesEnrolled: selectedOptions.map((opt) => opt.value)
                      }))
                    }
                    className={styles.selectField}
                    classNamePrefix="react-select"
                    placeholder="Select courses..."
                  />
                ) : profile.coursesEnrolled.length > 0 ? (
                  <ul className={styles.courseList}>
                    {profile.coursesEnrolled.map((id) => (
                      <li key={id}>{courseMap[id] || "Unknown Course"}</li>
                    ))}
                  </ul>
                ) : (
                  <span> Not provided</span>
                )}
              </p>

              <p>
                <strong>Areas of Interest:</strong>{" "}
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.areasOfInterest.join(", ")}
                    onChange={(e) => handleArrayChange(e, "areasOfInterest")}
                    className={styles.inputField}
                  />
                ) : (
                  displayArray(profile.areasOfInterest)
                )}
              </p>

              <p>
                <strong>Preferred Learning Style:</strong>{" "}
                {isEditing ? (
                  <select
                    name="preferredLearningStyle"
                    value={profile.preferredLearningStyle}
                    onChange={handleChange}
                    className={styles.selectField}
                  >
                    <option value="">Select Learning Style</option>
                    <option value="Visual">Visual</option>
                    <option value="Auditory">Auditory</option>
                    <option value="Kinesthetic">Kinesthetic</option>
                    <option value="Reading/Writing">Reading/Writing</option>
                    <option value="Multimodal">Multimodal</option>
                  </select>
                ) : (
                  profile.preferredLearningStyle || "Not provided"
                )}
              </p>

              <p>
                <strong>Academic Goals:</strong>{" "}
                {isEditing ? (
                  <textarea
                    name="academicGoals"
                    value={profile.academicGoals}
                    onChange={handleChange}
                    className={styles.inputField}
                  />
                ) : (
                  profile.academicGoals || "Not provided"
                )}
              </p>
            </div>

            <div className={styles.buttonGroup}>
              <button
                className={styles.saveButton}
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

            <div className={styles.roleButtons}>
              <div className={styles.tutorRequestSection}>
                {tutorRequestsEnabled ? (
                  <>
                    {!tutorRequestPending &&
                      tutorRequestStatus !== "approved" &&
                      tutorRequestStatus !== "rejected" && (
                        <>
                          <h3 className={styles.tutorRequestHeading}>
                            Want to be a tutor?
                          </h3>

                          <p className={styles.tutorRequestSubtext}>
                            Upload your resume and apply below.
                          </p>

                          <div className={styles.tutorRequestWrapper}>
                            <input
                              type="file"
                              name="resume"
                              accept="application/pdf"
                              onChange={handleResumeUpload}
                              className={styles.fileInput}
                            />

                            {resumeFile ? (
                              <button
                                className={styles.saveButton}
                                onClick={handleTutorRequest}
                              >
                                Request to Become a Tutor
                              </button>
                            ) : (
                              <button
                                className={styles.disabledButton}
                                disabled
                                title="Please upload a PDF before requesting"
                              >
                                Upload PDF to Enable Tutor Request
                              </button>
                            )}
                          </div>
                        </>
                      )}

                    {tutorRequestStatus === "approved" && (
                      <p>Your tutor request has been approved.</p>
                    )}

                    {tutorRequestStatus === "rejected" && (
                      <p>
                        Your request to become a tutor was rejected. Please
                        contact Admin to retry.
                      </p>
                    )}

                    {tutorRequestStatus === "pending" && (
                      <p>Your request is pending review.</p>
                    )}
                  </>
                ) : (
                  <p className={styles.disabledMessage}>
                    Tutor requests are currently disabled by the admin.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;