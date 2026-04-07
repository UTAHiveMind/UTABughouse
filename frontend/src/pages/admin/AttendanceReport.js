import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import styles from "../../styles/AttendanceReport.module.css";
import AdminSideBar from "../../components/Sidebar/AdminSidebar";
import { useSidebar } from "../../components/Sidebar/SidebarContext";
import { useNavigate } from "react-router-dom";
import { FaFileCsv } from 'react-icons/fa';

// Get configuration from environment variables
const PROTOCOL = process.env.REACT_APP_PROTOCOL || 'https';
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || 'localhost';
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || '4000';

// Construct the backend URL dynamically
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

// Create a cache object to store the attendance data
const attendanceCache = {
  data: null,
  timestamp: null,
  cacheDuration: 5 * 60 * 1000 // 5 minutes in milliseconds
};

// Helper function to calculate end time based on start time and duration
function calculateEndTime(startTime, duration) {
  if (!startTime || !duration) return 'N/A';
  
  try {
    // Parse duration (assuming format like "60 mins" or "1 hour 30 mins")
    let durationMinutes = 0;
    
    if (typeof duration === 'string') {
      if (duration.includes('hour')) {
        const hourPart = duration.match(/(\d+)\s*hour/);
        if (hourPart && hourPart[1]) {
          durationMinutes += parseInt(hourPart[1]) * 60;
        }
      }
      
      const minutePart = duration.match(/(\d+)\s*min/);
      if (minutePart && minutePart[1]) {
        durationMinutes += parseInt(minutePart[1]);
      }
      
      // If we couldn't parse the duration, try a direct integer parse
      if (durationMinutes === 0) {
        const directMinutes = parseInt(duration);
        if (!isNaN(directMinutes)) {
          durationMinutes = directMinutes;
        } else {
          return 'N/A';
        }
      }
    } else if (typeof duration === 'number') {
      durationMinutes = duration;
    } else {
      return 'N/A';
    }
    
    // Create a date object from the start time (assumes format like "10:00 AM")
    if (typeof startTime !== 'string') return 'N/A';
    
    const [time, period] = startTime.split(' ');
    if (!time || !period) return 'N/A';
    
    let [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 'N/A';
    
    // Convert to 24-hour format
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    // Create a date object and add the duration
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setTime(date.getTime() + durationMinutes * 60 * 1000);
    
    // Format the end time
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error calculating end time:', error);
    return 'N/A';
  }
}

// Helper function to format date and time from ISO string
function formatDateTime(isoString) {
  if (!isoString) return { date: 'N/A', time: 'N/A' };
  
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return { date: 'N/A', time: 'N/A' };
    
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    return { date: formattedDate, time: formattedTime };
  } catch (error) {
    console.error('Error formatting date/time:', error);
    return { date: 'N/A', time: 'N/A' };
  }
}

function AttendanceReport() {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [allSessionsCount, setAllSessionsCount] = useState(0);
  const [lastMonthCount, setLastMonthCount] = useState(0);
  const [noShowCount, setNoShowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  const test = 1;

  // Date range filter state (from input type='date')
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  //Convert "yyyy-mm-dd" string from input into local Date object
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };
  //Parse selected date range
  const start = parseLocalDate(fromDate);
  const end = parseLocalDate(toDate);

  //Set end date to end of the day
  if (end) {
    end.setHours(23, 59, 59, 999);
  }
  
  // Define fetchAttendance as a useCallback
  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if we have valid cached data
      const now = new Date();
      if (
        attendanceCache.data && 
        attendanceCache.timestamp && 
        now.getTime() - attendanceCache.timestamp < attendanceCache.cacheDuration
      ) {
        console.log("Using cached attendance data");
        setAttendanceRecords(attendanceCache.data);
        setLastUpdated(new Date(attendanceCache.timestamp));
        setLoading(false);
        return;
      }
      
      console.log("Fetching fresh attendance data...");
      
      try {
        // Fetch all attendance records with populated data
        const attendanceResponse = await axios.get(`${BACKEND_URL}/api/attendance/all`);
        let attendanceList = attendanceResponse.data || [];
        
        console.log("Raw attendance data:", attendanceList);
        
        // Fetch all sessions to get the total count
        const sessionsResponse = await axios.get(`${BACKEND_URL}/api/sessions`);
        const sessionsList = sessionsResponse.data || [];
        
        // Store counts for statistics
        setAllSessionsCount(sessionsList.length);
        
        // Calculate last month sessions
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        const lastMonthSessions = sessionsList.filter(session => {
          try {
            const sessionDate = new Date(session.sessionTime);
            return sessionDate >= lastMonth;
          } catch (error) {
            return false;
          }
        });
        
        setLastMonthCount(lastMonthSessions.length);
        
        // Calculate no-show count
        const noShows = attendanceList.filter(record => record.wasNoShow === true);
        setNoShowCount(noShows.length);
        
        // Process the attendance records data
        const processedRecords = attendanceList.map(record => {
          // Get student info
          const studentName = record.studentID 
            ? `${record.studentID.firstName || ''} ${record.studentID.lastName || ''}`.trim()
            : 'Unknown Student';
            
          // Get tutor info
          const tutorName = record.sessionID && record.sessionID.tutorID 
            ? `${record.sessionID.tutorID.firstName || ''} ${record.sessionID.tutorID.lastName || ''}`.trim()
            : 'Unknown Tutor';
          
          // Format date and time from sessionTime
          const sessionTime = record.sessionID ? record.sessionID.sessionTime : null;
          const rawDate = new Date(record.sessionID.sessionTime);
          const { date, time } = formatDateTime(sessionTime);
          
          // Split the date for the multi-line display
          let formattedDate = date;
          if (date !== 'N/A') {
            const dateParts = date.split(',');
            if (dateParts.length === 2) {
              formattedDate = `${dateParts[0]},${dateParts[1]}`;
            }
          }
          
          // Format check-in and check-out times
          const checkInDateTime = formatDateTime(record.checkInTime);
          const checkOutDateTime = formatDateTime(record.checkOutTime);
          
          return {
            id: record._id || 'N/A',
            sessionId: record.sessionID ? record.sessionID._id : 'N/A',
            studentName,
            tutorName,
            rawDateTime: rawDate, 
            date: formattedDate,
            startTime: time,
            duration: record.sessionID ? record.sessionID.duration : (record.duration || 'N/A'),
            endTime: calculateEndTime(time, record.sessionID ? record.sessionID.duration : record.duration),
            checkInTime: checkInDateTime.time,
            checkOutTime: checkOutDateTime.time,
            checkInStatus: record.checkInStatus || 'N/A',
            checkOutStatus: record.checkOutStatus || 'N/A',
            wasNoShow: record.wasNoShow,
            status: record.sessionID && record.sessionID.status === 'Cancelled' ? 'Cancelled' : 
                   (record.wasNoShow ? 'No Show' : 
                   (record.checkOutTime ? 'Completed' : 
                   (record.checkInTime ? 'In Progress' : 'Scheduled')))
          };
        });
        
        // Sort attendance records by date (most recent first)
        processedRecords.sort((a, b) => {
          try {
            return new Date(b.date) - new Date(a.date);
          } catch (error) {
            return 0;
          }
        });
        
        console.log("Processed attendance records:", processedRecords);
        
        // Update the cache with the new data
        attendanceCache.data = processedRecords;
        attendanceCache.timestamp = now.getTime();
        
        setAttendanceRecords(processedRecords);
        setLastUpdated(now);
        setLoading(false);
        
        // Clear any previous errors
        if (error) setError(null);
      } catch (axiosError) {
        console.error("Detailed Axios Error:", {
          message: axiosError.message,
          response: axiosError.response ? {
            status: axiosError.response.status,
            data: axiosError.response.data,
            headers: axiosError.response.headers
          } : 'No response',
          request: axiosError.request ? 'Request exists' : 'No request',
          config: axiosError.config ? {
            url: axiosError.config.url,
            method: axiosError.config.method,
            headers: axiosError.config.headers
          } : 'No config'
        });
  
        const errorMessage = axiosError.response 
          ? `Error: ${axiosError.response.status} - ${axiosError.response.data?.message || axiosError.response.statusText}` 
          : "Failed to connect to the server. Please try again later.";
        
        // Fallback to local sample data
        const sampleRecords = [
          {
            id: 1,
            studentName: "Emily Johnson",
            tutorName: "John Doe",
            date: "March 20, 2024",
            startTime: "10:00 AM",
            duration: "90 mins",
            endTime: "11:30 AM",
            checkInTime: "09:55 AM",
            checkOutTime: "11:28 AM",
            checkInStatus: "Early",
            checkOutStatus: "On Time",
            wasNoShow: false,
            status: "Completed"
          },
          {
            id: 2,
            studentName: "Michael Chen",
            tutorName: "Sarah Smith",
            date: "March 19, 2024",
            startTime: "02:00 PM",
            duration: "75 mins",
            endTime: "03:15 PM",
            checkInTime: "02:10 PM",
            checkOutTime: "03:20 PM",
            checkInStatus: "Late",
            checkOutStatus: "Late",
            wasNoShow: false,
            status: "Completed"
          },
          {
            id: 3,
            studentName: "Alex Wong",
            tutorName: "Maria Garcia",
            date: "March 18, 2024",
            startTime: "11:00 AM",
            duration: "60 mins",
            endTime: "12:00 PM",
            checkInTime: "N/A",
            checkOutTime: "N/A",
            checkInStatus: "No Show",
            checkOutStatus: "No Show",
            wasNoShow: true,
            status: "No Show"
          }
        ];
        
        setAttendanceRecords(sampleRecords);
        setError(`${errorMessage} (Using sample data for display purposes)`);
        setAllSessionsCount(sampleRecords.length + 5); // Sample total count
        setLastMonthCount(sampleRecords.length + 3); // Sample last month count
        setNoShowCount(1); // Sample no-show count
        setLoading(false);
      }
    } catch (generalError) {
      console.error("General Error:", generalError);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  }, [error]);

  // Fetch attendance data on component mount
  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);
  
  // Add enhanced styles for the statistics, tables, and status badges
  useEffect(() => {
    // This will add the styles if they don't exist in your CSS file already
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      /* Header Styles */
      .${styles.headerContainer} {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
      }
      
      .${styles.heading} {
        font-size: 28px;
        font-weight: 700;
        color: #fff;
        margin: 0;
      }
      
      .${styles.refreshContainer} {
        display: flex;
        align-items: center;
        gap: 15px;
      }
      
      .${styles.lastUpdated} {
        color: rgba(255, 255, 255, 0.85);
        font-size: 14px;
      }
      
      .${styles.refreshButton}, .${styles.csvButton}{
        background-color: rgba(255, 255, 255, 0.15);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 8px;
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .${styles.refreshButton}:hover, .${styles.csvButton}:hover {
        background-color: rgba(255, 255, 255, 0.25);
      }
      
      .${styles.refreshButton}:disabled, .${styles.csvButton}:disabled  {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      /* Statistics Container Styles */
      .statisticsContainer {
        display: flex;
        justify-content: space-between;
        margin-bottom: 40px;
        flex-wrap: wrap;
        gap: 30px;
      }
      
      .statCard {
        flex: 1;
        min-width: 200px;
        background: linear-gradient(145deg, #ffffff, #f8f9fa);
        border-radius: 16px;
        padding: 28px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
        border: 1px solid #e1e4e8;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      
      .statCard:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      }
      
      .statTitle {
        margin: 0 0 12px 0;
        font-size: 15px;
        color: #5a6775;
        text-transform: uppercase;
        letter-spacing: 0.7px;
        font-weight: 600;
      }
      
      .statValue {
        margin: 0;
        font-size: 32px;
        font-weight: bold;
        background: linear-gradient(90deg, #3498db, #2980b9);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-fill-color: transparent;
      }
      
      /* Enhanced Table Styles */
      .${styles.tableContainer} {
        border-radius: 16px;
        overflow-x: auto;
        overflow-y: auto;
        max-height: 600px; /* Limit height to enable vertical scrolling */
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        transition: all 0.3s ease;
        border: 1px solid #e9ecef;
        margin-top: 30px;
      }
      
      .${styles.attendanceTable} {
        width: 100%;
        min-width: 1200px; /* Ensure table doesn't compress too much */
        border-collapse: separate;
        border-spacing: 0;
        table-layout: fixed;
      }
      
      .${styles.attendanceTable} thead {
        background: linear-gradient(to right, #f8f9fa, #e9ecef);
        position: sticky;
        top: 0;
        z-index: 10;
      }
      
      .${styles.attendanceTable} th {
        padding: 15px;
        padding-right: 50px;
        font-weight: 600;
        color: #394b59;
        text-transform: uppercase;
        font-size: 13px;
        letter-spacing: 0.7px;
        border-bottom: 2px solid #dee2e6;
        text-align: left;
        white-space: nowrap;
      }
      
      .${styles.attendanceTable} td {
        padding: 15px;
        padding-right: 50px;
        vertical-align: middle;
        transition: background-color 0.2s ease;
        border-bottom: 1px solid #eaeaea;
        white-space: nowrap;
      }
      
      .${styles.attendanceTable} tr:nth-child(odd) {
        background-color: #ffffff; /* White for odd rows */
      }

      .${styles.attendanceTable} tr:nth-child(even) {
        background-color: #f2f2f2; /* Light gray for even rows */
      }
      
      .${styles.attendanceTable} tr:hover td {
        background-color: #e3f2fd;
      }
      
      .${styles.attendanceTable} tr:last-child td {
        border-bottom: none;
      }
      
      /* Status badge styles */
      .statusBadge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-left: 8px;
      }
      
      .statusCompleted {
        background-color: #d4edda;
        color: #155724;
      }
      
      .statusInProgress {
        background-color: #fff3cd;
        color: #856404;
      }
      
      .statusScheduled {
        background-color: #cce5ff;
        color: #004085;
      }
      
      .statusCancelled {
        background-color: #f8d7da;
        color: #721c24;
      }
      
      .statusNoShow {
        background-color: #f8d7da;
        color: #721c24;
      }
      
      .checkStatusEarly {
        background-color: #d1ecf1;
        color: #0c5460;
      }
      
      .checkStatusOnTime {
        background-color: #d4edda;
        color: #155724;
      }
      
      .checkStatusLate {
        background-color: #fff3cd;
        color: #856404;
      }
      
      .checkStatusNoShow {
        background-color: #f8d7da;
        color: #721c24;
      }
      
      .durationBadge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 20px;
        background-color: #e9ecef;
        color: #495057;
        font-size: 12px;
        font-weight: 600;
      }
      
      .${styles.sectionTitle} {
        font-size: 24px;
        color: #2c3e50;
        margin-bottom: 30px;
        padding-bottom: 15px;
        border-bottom: 2px solid #e1e4e8;
        position: relative;
      }
      
      .${styles.sectionTitle}::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 80px;
        height: 2px;
        background: #3498db;
      }
      
      .${styles.attendanceSection} {
        background-color: #ffffff;
        border-radius: 16px;
        padding: 35px;
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
        margin-bottom: 35px;
      }
      
      /* Loading and Error States */
      .${styles.loadingContainer}, 
      .${styles.errorContainer}, 
      .${styles.emptyContainer} {
        padding: 30px;
        text-align: center;
        border-radius: 12px;
        background-color: #f8f9fa;
        margin-top: 20px;
      }
      
      .${styles.loadingContainer} {
        color: #007bff;
      }
      
      .${styles.errorContainer} {
        color: #dc3545;
      }
      
      .${styles.emptyContainer} {
        color: #6c757d;
      }
      
      /* Responsive Fixes */
      @media (max-width: 768px) {
        .statisticsContainer {
          flex-direction: column;
        }
        
        .statCard {
          width: 100%;
          margin-right: 0;
          margin-bottom: 16px;
        }
        
        .${styles.attendanceTable} {
          display: block;
          overflow-x: auto;
        }
        
        .${styles.attendanceTable} th,
        .${styles.attendanceTable} td {
          padding: 15px;
        }

        /* Responsive Fixes */
      @media (max-width: 768px) {
        .statisticsContainer {
          flex-direction: row;
        }
        
        .statCard {
          width: 100%;
          margin-right: 0;
          margin-bottom: 16px;
        }

      .statisticsContainer {
        display: flex;
        justify-content: space-between;
        margin-bottom: 40px;
        flex-wrap: wrap;
        gap: 5px;
      }

        .statCard {
        // flex: 1;
        min-width: 2px;
        background: linear-gradient(145deg, #ffffff, #f8f4ff) !important;
        border-radius: 16px;
        padding: 1px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
        border: 1px solid #e1e4e8;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
        text-align: center;
      }
        
        .${styles.attendanceTable} {
          display: block;
          overflow-x: auto;
        }
        
        .${styles.attendanceTable} th,
        .${styles.attendanceTable} td {
          padding: 15px;
        }
      
      }
    `;
    document.head.appendChild(styleElement);
    
    // Cleanup function to remove the style element when component unmounts
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

// Function to handle escape each CSV cell
function csvCellEscape (value) {
  if (value == null || value == undefined) return "";

  const str = String(value);
  //the cell value should be wrapped by "" if they contain any characters below
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

//Function build the csv content from database
function buildCsvContent(data) {
    //Headers of columns
    const headers = [
      "Student Name",
      "Tutor Name",
      "Date",
      "Session Time",
      "Check-in Time",
      "Check-out Time",
      "Duration",
      "Status",
    ];

  const rows = data.map(r => {
    //Combine start and end time
    const sessionTime = `${r.startTime || "N/A"} to ${r.endTime || "N/A"}`;
    //If no show or the session status is cancelled -> the duration is 0
    const realDuration = r.wasNoShow || r.status === "Cancelled" ? 0 : r.duration;
    return [
      r.studentName,
      r.tutorName,
      r.date,
      sessionTime,
      r.wasNoShow ? "No Show" : r.checkInTime,
      r.wasNoShow ? "No Show" : r.checkOutTime,
      realDuration,
      r.status,
    ].map(csvCellEscape).join(','); //Escape each cell to match the CSV format
  });

  //join headers and all rows to be a complete csv
  return headers.join(',') + "\n" + rows.join('\n');
}

//Function handle csv file export
const handleExport = () => {
  const now = new Date(); //Initiate the current time to name the dowload file
  const today = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());
  //Create file name as format: attendance_report_MM_DD_YYYY.csv
  const fileName = `attendance_report_${month}_${today}_${year}.csv`;

  //Building the csv content from database by call buildCsvContent function
  const csvContent = buildCsvContent(attendanceRecords);

  //Initiate the Blob
  const blob = new Blob (["\ufeff", csvContent], {type: 'text/csv; charset=utf-8;'});
  const urlTemp = URL.createObjectURL(blob);  //Create temporary link

  const link = document.createElement('a'); //Create anchor tag to trigger download
  link.setAttribute('href', urlTemp);
  link.setAttribute('download', fileName);

  link.style.visibility = 'hidden';

  //Add to DOM -> click -> remove it
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  //Free the memory
  URL.revokeObjectURL(urlTemp);
}








  // Function to manually refresh the data
  const handleRefresh = () => {
    // Clear the cache and re-fetch
    attendanceCache.data = null;
    attendanceCache.timestamp = null;
    fetchAttendance();
  };

  // Format the last updated time
  const formatLastUpdated = (date) => {
    if (!date) return "";
    
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    }).format(date);
  };
  
  // Function to format the duration for better display
  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    
    if (typeof duration === 'number') {
      // If it's a number, assume it's minutes
      if (duration >= 60) {
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
      }
      return `${duration}m`;
    }
    
    // If it's already a formatted string, return it
    return duration;
  };

  return (
    <div className={styles.container}>
      <AdminSideBar selected="analytics"></AdminSideBar>
      <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ""}`}>
        <div className={styles.headerContainer}>
          <h1 className={styles.heading}>Attendance Report</h1>
          
          {lastUpdated && (
            <div className={styles.refreshContainer}>
              <span className={styles.lastUpdated}>
                Last updated: {formatLastUpdated(lastUpdated)}
              </span>
              <button 
                className={styles.csvButton}
                onClick={handleExport}>
                <FaFileCsv /> Export CSV
              </button>
              <button 
                className={styles.refreshButton}
                onClick={handleRefresh}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh Data"}
              </button>

              <button 
                className={styles.refreshButton}
                onClick={() => navigate("/advanced-reports")}
              >
                View Advanced Reports
              </button>
            </div>
          )}
        </div>
        
        <div className={styles.attendanceSection}>
          <div className="statisticsContainer">
            <div className="statCard">
              <h3 className="statTitle">Total Booked Sessions</h3>
              <p className="statValue">{loading ? "..." : allSessionsCount}</p>
            </div>
            <div className="statCard">
              <h3 className="statTitle">Last Month's Sessions</h3>
              <p className="statValue">{loading ? "..." : lastMonthCount}</p>
            </div>
            <div className="statCard">
              <h3 className="statTitle">Completed Sessions</h3>
              <p className="statValue">{loading ? "..." : attendanceRecords.filter(record => record.status === 'Completed').length}</p>
            </div>
            <div className="statCard">
              <h3 className="statTitle">No-Show Sessions</h3>
              <p className="statValue">{loading ? "..." : noShowCount}</p>
            </div>
          </div>
          <div style={{display: 'flex', justifyContent: "space-between",}}>
            <h2 className={styles.sectionTitle}>Attendance Records</h2>
            <div style={{display: 'flex', gap: "10px"}}>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}></input>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}></input>
            </div>
          </div>
          
          
          {loading ? (
            <div className={styles.loadingContainer}>
              <p>Loading attendance data...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p>{error}</p>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className={styles.emptyContainer}>
              <p>No attendance records available.</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.sessionsTable}>
                <thead>
                  <tr>
                    <th style={{ width: '13%', paddingRight: '50px', paddingLeft: '40px' }}>Student</th>
                    <th style={{ width: '13%', paddingRight: '50px' }}>Tutor</th>
                    <th style={{ width: '11%', paddingRight: '50px', minWidth: '120px' }}>Date</th>
                    <th style={{ width: '13%', paddingRight: '50px', whiteSpace: 'nowrap' }}>Session Time</th>
                    <th style={{ width: '13%', paddingRight: '50px' }}>Check-In</th>
                    <th style={{ width: '13%', paddingRight: '50px' }}>Check-Out</th>
                    <th style={{ width: '11%', paddingRight: '50px' }}>Duration</th>
                    <th style={{ width: '13%', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.filter(record => {
                    // Show all data
                    if (!fromDate || !toDate) return true;
                    // otherwise, show the selected time range
                    return (record.rawDateTime >= start && record.rawDateTime <= end);
                    }
                  ).map(record => ( 
                    <tr key={record.id}>
                      <td style={{ fontWeight: '500', paddingLeft: '40px', paddingRight: '50px' }}>{record.studentName}</td>
                      <td style={{ fontWeight: '500', paddingRight: '50px' }}>{record.tutorName}</td>
                      <td style={{ paddingRight: '50px', whiteSpace: 'normal' }}>
                        {record.date?.includes(',') ? ( /*Checks that the date has a comma before trying to split and trim it*/
                          <>
                            <div>{record.date.split(',')[0]},</div>
                            <div>{record.date.split(',')[1].trim()}</div>
                          </>
                        ) : (
                          <div>{record.date}</div>
                        )}
                      </td>
                      <td style={{ paddingRight: '50px', whiteSpace: 'nowrap' }}>
                        <span>{record.startTime} to {record.endTime}</span>
                      </td>
                      <td style={{ minWidth: '120px', paddingRight: '50px', whiteSpace: 'nowrap' }}>
                        {record.checkInTime !== 'N/A' ? (
                          <span>
                            {record.checkInTime} <span className={`statusBadge checkStatus${record.checkInStatus.replace(/\s/g, '')}`}>{record.checkInStatus}</span>
                          </span>
                        ) : (
                          record.wasNoShow ? (
                            <span className="statusBadge checkStatusNoShow">No Show</span>
                          ) : (
                            <span style={{ color: '#6c757d' }}>Not Checked In</span>
                          )
                        )}
                      </td>
                      <td style={{ minWidth: '120px', paddingRight: '50px', whiteSpace: 'nowrap' }}>
                        {record.checkOutTime !== 'N/A' ? (
                          <span>
                            {record.checkOutTime} <span className={`statusBadge checkStatus${record.checkOutStatus.replace(/\s/g, '')}`}>{record.checkOutStatus}</span>
                          </span>
                        ) : (
                          record.wasNoShow ? (
                            <span className="statusBadge checkStatusNoShow">No Show</span>
                          ) : (
                            record.checkInTime !== 'N/A' ? 
                              <span style={{ color: '#856404', fontWeight: '500' }}>In Progress</span> : 
                              <span style={{ color: '#6c757d' }}>Not Started</span>
                          )
                        )}
                      </td>
                      <td style={{ minWidth: '100px', paddingRight: '50px' }}>
                        <span className="durationBadge">
                          {formatDuration(record.duration)}
                        </span>
                      </td>
                      <td style={{ minWidth: '120px', textAlign: 'center' }}>
                        <span className={`statusBadge status${record.status.replace(/\s/g, '')}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AttendanceReport;