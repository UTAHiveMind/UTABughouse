import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import axios from "axios";
import "react-big-calendar/lib/css/react-big-calendar.css";
import styles from "../../styles/FindMyTutorProfile.module.css";
import AdminSidebar from "../../components/Sidebar/AdminSidebar";

// Get configuration from environment variables
const PROTOCOL = process.env.REACT_APP_PROTOCOL || 'https';
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || 'localhost';
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || '4000';

// Construct the backend URL dynamically
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

const localizer = momentLocalizer(moment);

// Define custom formats for the calendar
const formats = {
  dayFormat: 'dddd', // Use full day name (Monday, Tuesday, etc.)
};

// Custom components for the calendar
const customComponents = {
  work_week: {
    header: ({ date }) => {
      return (
        <div style={{ textAlign: "center", fontWeight: "bold" }}>
          {moment(date).format('dddd')}
        </div>
      );
    },
  }
};

function ViewProfile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [courseList, setCourseList] = useState([]);  //added
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [adminSession, setAdminSession] = useState(null);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [isCalendarFullscreen, setIsCalendarFullscreen] = useState(false);

  const courseMap = courseList.reduce((map, course) => {
    map[course._id] = `${course.title} (${course.code})`;
    return map;
  }, {});

  // Get admin session info
  useEffect(() => {
    const fetchAdminSession = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/auth/session`, {
          withCredentials: true
        });
        if (response.data && response.data.user && response.data.user.role === 'Admin') {
          setAdminSession(response.data.user);
        }
      } catch (error) {
        console.error("Error fetching admin session:", error);
      }
    };
    fetchAdminSession();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await axios.get(
          `${BACKEND_URL}/api/users/${userId}`
        );
        setUser(userResponse.data);
        setNewRole(userResponse.data.role); // Initialize with current role
        return userResponse.data;
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load user data");
        return null;
      }
    };

    const fetchProfileByRole = async (userRole, userId) => {
      try {
        const endpoint = getProfileEndpoint(userRole, userId);
        if (!endpoint) return null;
        
        const profileResponse = await axios.get(endpoint);
        return profileResponse.data;
      } catch (error) {
        console.error(`Error fetching ${userRole} profile:`, error);
        setError(`Failed to load ${userRole.toLowerCase()} profile`);
        return null;
      }
    };

    const fetchTutorAvailability = async (userId) => {
      try {
        const availabilityResponse = await axios.get(
          `${BACKEND_URL}/api/availability/${userId}`
        );

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

        return formattedEvents;
      } catch (error) {
        console.error("Error fetching availability:", error);
        return [];
      }
    };

    // Helper function to get the appropriate endpoint for profile
    const getProfileEndpoint = (role, id) => {
      switch (role) {
        case 'Tutor':
          return `${BACKEND_URL}/api/profile/tutor/${id}`;
        case 'Student':
          return `${BACKEND_URL}/api/profile/student/${id}`;
        case 'Admin':
          return null; // Admins don't have profiles for now
        default:
          return `${BACKEND_URL}/api/profile/${id}`; // Fallback to general endpoint
      }
    };

    // Fetch course List
    const fetchCourses = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/courses`);
        setCourseList(res.data);
      } catch (err) {
        console.error("Failed to load course list", err);
      }
    };
    fetchCourses();

    const fetchData = async () => {
      try {
        // First get the user data to determine role
        const userData = await fetchUserData();
        
        if (!userData) {
          setLoading(false);
          return;
        }
        
        // Then fetch the appropriate profile based on role
        const profileData = await fetchProfileByRole(userData.role, userId);
        setProfile(profileData);
        
        // Only fetch availability for tutors
        if (userData.role === 'Tutor') {
          const availabilityData = await fetchTutorAvailability(userId);
          setEvents(availabilityData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error in data fetching:", error);
        setError("Failed to load profile data");
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Handle role change
  const handleRoleChange = async () => {
    if (!user || !newRole || user.role === newRole) {
      return;
    }

    try {
      setLoading(true);
      
      // Call the API to update the user's role
      await axios.put(
        `${BACKEND_URL}/api/profile/update-role/${userId}`,
        { newRole },
        { withCredentials: true }
      );
      
      setSuccessMessage(`User role successfully changed from ${user.role} to ${newRole}`);
      setUser({ ...user, role: newRole });
      setIsChangingRole(false);
      
      // Refresh data to get the updated profile
      window.location.reload();
      
    } catch (error) {
      console.error("Error updating user role:", error);
      setError("Failed to update user role. " + 
        (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // SCHEDULE EDITING FUNCTIONS (copied from SetAvailability.js)

  // Prevent overlapping events
  const hasOverlap = (newStart, newEnd) => {
    return events.some(
        ({ start, end }) =>
            (newStart >= start && newStart < end) || // New start overlaps
            (newEnd > start && newEnd <= end) || // New end overlaps
            (newStart <= start && newEnd >= end) // Encompasses existing event
    );
  };

  // Handle slot selection (add new events)
  const handleSelectSlot = (slotInfo) => {
    // Check if it's a weekend day
    const day = moment(slotInfo.start).format('dddd');
    if (['Saturday', 'Sunday'].includes(day)) {
      alert("Cannot set availability for weekends");
      return;
    }

    if (
      !hasOverlap(slotInfo.start, slotInfo.end) &&
      slotInfo.start.getHours() >= 10 &&
      slotInfo.end.getHours() <= 18
    ) {
      const newEvent = {
        id: Date.now(), // Temporary unique ID
        start: slotInfo.start,
        end: slotInfo.end,
        title: 'Available'
      };
      setEvents((prevEvents) => [...prevEvents, newEvent]);
    } else {
      alert("Cannot create overlapping availability or outside of 10 AM - 6 PM");
    }
  };

  // Handle event deletion
  const handleEventDelete = (event) => {
    if (window.confirm("Do you want to remove this availability slot?")) {
      setEvents((prevEvents) => prevEvents.filter((e) => e.id !== event.id));
    }
  };

  // Save the updated schedule
  const handleSaveSchedule = async () => {
    try {
      setLoading(true);
      
      // Convert events to availability slots
      const formattedEvents = events
        .map((event) => ({
          day: moment(event.start).format("dddd"),
          startTime: moment(event.start).format("HH:mm"),
          endTime: moment(event.end).format("HH:mm"),
        }))
        .filter(event => !['Saturday', 'Sunday'].includes(event.day)) // Filter out weekends
        .sort((a, b) => { // Sort by day of week
          const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
          return days.indexOf(a.day) - days.indexOf(b.day);
        });

      // Call the API to update the availability
      await axios.post(
        `${BACKEND_URL}/api/availability/${userId}/submit`,
        { availability: formattedEvents },
        { withCredentials: true }
      );
      
      setSuccessMessage("Tutor's schedule has been successfully updated");
      setIsEditingSchedule(false);
      setIsCalendarFullscreen(false);
      
    } catch (error) {
      console.error("Error updating schedule:", error);
      setError("Failed to update schedule. " + 
        (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Cancel editing
  const handleCancelEditSchedule = async () => {
    try {
      // Reset to original state by refetching
      const availabilityResponse = await axios.get(
        `${BACKEND_URL}/api/availability/${userId}`
      );

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
      setIsEditingSchedule(false);
      setIsCalendarFullscreen(false);
      
    } catch (error) {
      console.error("Error resetting schedule:", error);
      setError("Failed to reset schedule. Please reload the page.");
    }
  };

  // Toggle fullscreen calendar for editing
  const toggleCalendarFullscreen = () => {
    setIsCalendarFullscreen(!isCalendarFullscreen);
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

  const handleResetTutorRequest = async () => {
    try {
      await axios.put(`${BACKEND_URL}/api/tutor-request/reset/${userId}`, {}, {
        withCredentials: true,
      });
      setSuccessMessage("Tutor Request has successfully been reset.")
      window.location.reload();
    } catch (err) {
      console.error("Error resetting tutor request:", err);
      setError("Failed to reset tutor request")
    }
  };

  if (loading) {
    return (
      <div className={styles.spinnerContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <AdminSidebar />
        <div className={styles.mainContent}>
          <div className={styles.error}>{error}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <AdminSidebar />
        <div className={styles.mainContent}>
          <p>User not found.</p>
        </div>
      </div>
    );
  }

  if (!profile && user.role !== 'Admin') {
    return (
      <div className={styles.container}>
        <AdminSidebar />
        <div className={styles.mainContent}>
          <p>Profile not found for this user.</p>
        </div>
      </div>
    );
  }

  const userName = profile?.name || `${user?.firstName} ${user?.lastName}`;

  // Display only the calendar in fullscreen mode when editing
  if (isCalendarFullscreen && isEditingSchedule) {
    return (
      <div className={styles.fullscreenContainer}>
        <div className={styles.fullscreenHeader}>
          <h2>Editing {userName}'s Availability</h2>
          <div className={styles.scheduleControls}>
            <button 
              onClick={handleSaveSchedule}
              className={styles.saveButton}
            >
              Save Schedule
            </button>
            <button 
              onClick={handleCancelEditSchedule}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button 
              onClick={toggleCalendarFullscreen}
              className={styles.exitFullscreenButton}
            >
              Exit Fullscreen
            </button>
          </div>
        </div>
        
        <div className={styles.editingInstructions}>
          <p>Click and drag on the calendar to add availability slots.</p>
          <p>Click on existing slots to remove them.</p>
          <p>Availability can only be set between 10 AM - 6 PM, Monday to Friday.</p>
        </div>
        
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 'calc(100vh - 150px)', width: "100%" }}
          views={["work_week"]}
          defaultView="work_week"
          date={moment().toDate()}
          toolbar={false}
          min={moment().hours(10).minutes(0).toDate()}
          max={moment().hours(18).minutes(0).toDate()}
          step={30}
          timeslots={2}
          formats={formats}
          components={customComponents}
          eventPropGetter={eventStyleGetter}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleEventDelete}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <AdminSidebar />
      <div className={styles.mainContent}>
        {successMessage && (
          <div className={styles.successMessage}>
            {successMessage}
          </div>
        )}
        
        <div className={styles.profileContainer}>
          <div className={styles.profileSection}>
            <div className={styles.profileHeader}>
              <h1 className={styles.heading}>
                {userName}'s Profile <span className={styles.roleBadge}>{user.role}</span>
              </h1>
              
              {/* Role change controls for admin */}
              {adminSession && (
                <div className={styles.roleControls}>
                  {isChangingRole ? (
                    <div className={styles.roleChangeForm}>
                      <select 
                        value={newRole} 
                        onChange={(e) => setNewRole(e.target.value)}
                        className={styles.roleSelect}
                      >
                        <option value="Student">Student</option>
                        <option value="Tutor">Tutor</option>
                        <option value="Admin">Admin</option>
                      </select>
                      <button 
                        onClick={handleRoleChange}
                        className={styles.saveButton}
                        disabled={user.role === newRole}
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => {
                          setIsChangingRole(false);
                          setNewRole(user.role);
                        }}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => setIsChangingRole(true)}
                        className={styles.changeRoleButton}
                      >
                        Change Role
                      </button>

                      {/* Show Reset Tutor Request button ONLY if student was rejected */}
                      {user.role === "Student" && profile?.tutorRequestStatus === "rejected" && (
                        <button
                          onClick={handleResetTutorRequest}
                          className={styles.resetButton}
                          style={{ marginLeft: "8px" }}
                        >
                          Reset Tutor Request
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            
            {profile?.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt={userName}
                className={styles.profileImage}
              />
            ) : (
              <div className={styles.profilePlaceholder}>
                <span>No Image</span>
              </div>
            )}
            
            <div className={styles.profileInfo}>
              <p><strong>Name:</strong> {userName}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Student ID:</strong> {user.studentID || 'Not provided'}</p>
              {user.phone && <p><strong>Phone:</strong> {user.phone}</p>}
              
              {/* Render fields based on user role */}
              {user.role === 'Tutor' && profile && (
                <>
                  <p><strong>Bio:</strong> {profile.bio || 'Not provided'}</p>
                  <p><strong>Courses:</strong> 
                    {profile.courses && profile.courses.length > 0    //this is updated
                      ? profile.courses.map(course => {
                        if (typeof course === 'string') {
                          return courseMap[course] || course;
                        }
                        return course.name || `${course.title} (${course.code})`;
                      }).join(', ') 
                      : 'Not provided'}
                  </p> 
                  <p><strong>Skills:</strong> {profile.skills || 'Not provided'}</p>
                  <p><strong>Major:</strong> {profile.major || 'Not Specified'}</p>
                  <p><strong>Year:</strong> {profile.currentYear || 'Not Specified'}</p>
                </>
              )}
              
              {user.role === 'Student' && profile && (
                <>
                  <p><strong>Bio:</strong> {profile.bio || 'Not provided'}</p>
                  <p><strong>Major:</strong> {profile.major || 'Not Specified'}</p>
                  <p><strong>Year:</strong> {profile.currentYear || 'Not Specified'}</p>
                  <p><strong>Learning Style:</strong> {profile.preferredLearningStyle || 'Not Specified'}</p>
                  <p><strong>Academic Goals:</strong> {profile.academicGoals || 'Not provided'}</p>
                  {profile.coursesEnrolled && profile.coursesEnrolled.length > 0 && (
                    <p><strong>Courses Enrolled:</strong> {profile.coursesEnrolled.join(', ')}</p>
                  )}
                  {profile.areasOfInterest && profile.areasOfInterest.length > 0 && (
                    <p><strong>Areas of Interest:</strong> {profile.areasOfInterest.join(', ')}</p>
                  )}
                </>
              )}
              
              {user.role === 'Admin' && (
                <p><strong>Role:</strong> Administrator</p>
              )}
            </div>
          </div>
        </div>

        {/* Only show availability calendar for tutors */}
        {user.role === 'Tutor' && (
          <div className={styles.calendarContainer}>
            <div className={styles.calendarHeader}>
              <h2 className={styles.heading}>Availability</h2>
              
              {/* Edit Schedule button for admin */}
              {adminSession && (
                <div className={styles.scheduleControls}>
                  {isEditingSchedule ? (
                    <>
                      <button 
                        onClick={handleSaveSchedule}
                        className={styles.saveButton}
                      >
                        Save Schedule
                      </button>
                      <button 
                        onClick={handleCancelEditSchedule}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={toggleCalendarFullscreen}
                        className={styles.fullscreenButton}
                      >
                        Edit in Fullscreen
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setIsEditingSchedule(true)}
                      className={styles.editScheduleButton}
                    >
                      Edit Schedule
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {isEditingSchedule && (
              <div className={styles.editingInstructions}>
                <p>Click and drag on the calendar to add availability slots.</p>
                <p>Click on existing slots to remove them.</p>
                <p>For easier editing, use the "Edit in Fullscreen" button above.</p>
                <p>Availability can only be set between 10 AM - 6 PM, Monday to Friday.</p>
              </div>
            )}
            
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
              formats={formats}
              components={customComponents}
              eventPropGetter={eventStyleGetter}
              selectable={isEditingSchedule}
              onSelectSlot={isEditingSchedule ? handleSelectSlot : undefined}
              onSelectEvent={isEditingSchedule ? handleEventDelete : undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewProfile;