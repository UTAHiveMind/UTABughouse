import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import axios from "axios";
import "react-big-calendar/lib/css/react-big-calendar.css";
import styles from "../../styles/FindMyTutorProfile.module.css";
import StudentSidebar from "../../components/Sidebar/StudentSidebar";

// Get configuration from environment variables
const PROTOCOL = process.env.REACT_APP_PROTOCOL || 'https';
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || 'localhost';
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || '4000';

// Construct the backend URL dynamically
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

const localizer = momentLocalizer(moment);

function FindMyTutorProfile() {
  const { tutorId } = useParams();
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTutorProfile = async () => {
      try {
        console.log("Fetching profile for tutor ID:", tutorId);
        const profileResponse = await axios.get(
          `${BACKEND_URL}/api/profile/${tutorId}`,
          { withCredentials: true }
        );
        console.log("Profile data received:", profileResponse.data);
        setProfile(profileResponse.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        // Handle 404 for tutor profile
        if (error.response && error.response.status === 404) {
          console.log("Tutor profile not found, this is expected for new tutors");
          // Set an empty profile to prevent errors
          setProfile({
            name: "",
            bio: "",
            courses: [],
            skills: "",
            major: "",
            currentYear: ""
          });
        } else {
          setError("Error loading tutor profile");
        }
      }
    };

    const fetchTutorAvailability = async () => {
      try {
        console.log("Fetching availability for tutor ID:", tutorId);
        const availabilityResponse = await axios.get(
          `${BACKEND_URL}/api/availability/${tutorId}`,
          { withCredentials: true }
        );

        console.log("Availability data received:", availabilityResponse.data);

        // Convert availability data to calendar events
        const formattedEvents = [];
        // Start from Monday of current week
        const currentDate = moment().startOf('week').add(1, 'days');

        availabilityResponse.data.forEach((slot) => {
          // Skip slots with empty times
          if (slot.startTime === "00:00" && slot.endTime === "00:00") {
            return;
          }

          // Skip weekend days
          if (['Saturday', 'Sunday'].includes(slot.day)) {
            return;
          }
          
          // Get the day index (0-4 for Monday-Friday)
          const dayMapping = {
            'Monday': 0,
            'Tuesday': 1,
            'Wednesday': 2,
            'Thursday': 3,
            'Friday': 4
          };
          
          // Create date for this week's occurrence of the day
          const eventDate = currentDate.clone().add(dayMapping[slot.day], 'days');
          
          // Create start and end times
          const startDateTime = eventDate.clone()
            .set('hour', parseInt(slot.startTime.split(':')[0]))
            .set('minute', parseInt(slot.startTime.split(':')[1]));
          
          const endDateTime = eventDate.clone()
            .set('hour', parseInt(slot.endTime.split(':')[0]))
            .set('minute', parseInt(slot.endTime.split(':')[1]));

          formattedEvents.push({
            id: `${slot.day}-${slot.startTime}-${slot.endTime}`,
            start: startDateTime.toDate(),
            end: endDateTime.toDate(),
            title: 'Available'
          });
        });

        setEvents(formattedEvents);
      } catch (error) {
        console.error("Error fetching availability:", error);
      }
    };

    const fetchUserData = async () => {
      try {
        console.log("Fetching user data for tutor ID:", tutorId);
        const userResponse = await axios.get(
          `${BACKEND_URL}/api/users/${tutorId}`,
          { withCredentials: true }
        );
        console.log("User data received:", userResponse.data);
        setUser(userResponse.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Error loading tutor information");
      }
    };

    const fetchData = async () => {
      try {
        const results = await Promise.allSettled([
          fetchTutorProfile(),
          fetchTutorAvailability(),
          fetchUserData()
        ]);
        
        // Check if all promises were rejected
        const allFailed = results.every(result => result.status === 'rejected');
        if (allFailed) {
          setError("Failed to load tutor information. Please try again later.");
        }
      } catch (error) {
        console.error("Error in fetching data:", error);
        setError("An error occurred while loading tutor information");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tutorId]);

  // Custom day header component
  const customDayHeader = ({ label }) => {
    const dayName = label.split(" ")[0]; // Extract only the day name
    return <div style={{ textAlign: "center", fontWeight: "bold" }}>{dayName}</div>;
  };

  // Event style getter
  const eventStyleGetter = () => ({
    style: {
      backgroundColor: '#4CAF50',
      borderRadius: '3px',
      opacity: 0.8,
      color: 'white',
      border: '0',
      display: 'block'
    }
  });

  if (loading) {
    return (
      <div className={styles.container}>
        <StudentSidebar />
        <div className={styles.mainContent}>
          <div className={styles.spinnerContainer}>
            <div className={styles.spinner}></div>
            <p>Loading tutor profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <StudentSidebar />
        <div className={styles.mainContent}>
          <div className={styles.error}>{error}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <StudentSidebar />
        <div className={styles.mainContent}>
          <div className={styles.error}>Tutor not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <StudentSidebar />
      <div className={styles.mainContent}>
        <div className={styles.profileContainer}>
          <div className={styles.profileSection}>
            <h1 className={styles.heading}>
              {profile?.name || `${user?.firstName} ${user?.lastName}`}'s Profile
            </h1>
            {profile?.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt={profile.name || `${user?.firstName} ${user?.lastName}`}
                className={styles.profileImage}
              />
            ) : (
              <div className={styles.profilePlaceholder}>
                <span>No Image</span>
              </div>
            )}
            <div className={styles.profileInfo}>
              <p><strong>Name:</strong> {profile?.name || `${user?.firstName} ${user?.lastName}`}</p>
              <p><strong>Bio:</strong> {profile?.bio || "Not provided"}</p>
              <p><strong>Courses:</strong> {profile?.courses?.length > 0
                ? profile.courses.map((course, index) => (
                    <span key={course._id || index}>
                      {course.code} - {course.title}{index < profile.courses.length - 1 ? ', ' : ''}
                    </span>
                  ))
                : "Not provided"}
              </p>

              <p><strong>Skills:</strong> {profile?.skills || "Not provided"}</p>
              <p><strong>Major:</strong> {profile?.major || "Not provided"}</p>
              <p><strong>Year:</strong> {profile?.currentYear || "Not provided"}</p>
            </div>
          </div>
        </div>

        <div className={styles.calendarContainer}>
          <h2 className={styles.heading}>Availability</h2>
          {events.length > 0 ? (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500, width: "100%" }}
              views={["work_week"]}
              defaultView="work_week"
              date={moment().toDate()}
              toolbar={false}
              min={moment().hours(10).minutes(0).toDate()}
              max={moment().hours(18).minutes(0).toDate()}
              step={30}
              timeslots={2}
              eventPropGetter={eventStyleGetter}
              components={{
                work_week: {
                  header: customDayHeader,
                },
              }}
            />
          ) : (
            <div className={styles.noAvailability}>
              This tutor has not set their availability yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FindMyTutorProfile;