import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import styles from "../../styles/AttendanceReport.module.css";
import AdminSideBar from "../../components/Sidebar/AdminSidebar";
import { useSidebar } from "../../components/Sidebar/SidebarContext";
import { useNavigate } from "react-router-dom";
import { FaFileCsv } from "react-icons/fa";

const PROTOCOL = process.env.REACT_APP_PROTOCOL || "https";
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "4000";
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

const attendanceCache = {
  data: null,
  timestamp: null,
  cacheDuration: 5 * 60 * 1000
};

function calculateEndTime(startTime, duration) {
  if (!startTime || !duration) return "N/A";

  try {
    let durationMinutes = 0;

    if (typeof duration === "string") {
      if (duration.includes("hour")) {
        const hourPart = duration.match(/(\d+)\s*hour/);
        if (hourPart && hourPart[1]) {
          durationMinutes += parseInt(hourPart[1]) * 60;
        }
      }

      const minutePart = duration.match(/(\d+)\s*min/);
      if (minutePart && minutePart[1]) {
        durationMinutes += parseInt(minutePart[1]);
      }

      if (durationMinutes === 0) {
        const directMinutes = parseInt(duration);
        if (!isNaN(directMinutes)) {
          durationMinutes = directMinutes;
        } else {
          return "N/A";
        }
      }
    } else if (typeof duration === "number") {
      durationMinutes = duration;
    } else {
      return "N/A";
    }

    if (typeof startTime !== "string") return "N/A";

    const [time, period] = startTime.split(" ");
    if (!time || !period) return "N/A";

    let [hours, minutes] = time.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return "N/A";

    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setTime(date.getTime() + durationMinutes * 60 * 1000);

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch (error) {
    console.error("Error calculating end time:", error);
    return "N/A";
  }
}

function formatDateTime(isoString) {
  if (!isoString) return { date: "N/A", time: "N/A" };

  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return { date: "N/A", time: "N/A" };

    const formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

    return { date: formattedDate, time: formattedTime };
  } catch (error) {
    console.error("Error formatting date/time:", error);
    return { date: "N/A", time: "N/A" };
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

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const start = parseLocalDate(fromDate);
  const end = parseLocalDate(toDate);

  if (end) {
    end.setHours(23, 59, 59, 999);
  }

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);

      const now = new Date();
      const hasDateFilter = Boolean(fromDate || toDate);

      console.log("fetch triggered. Filter active:", hasDateFilter, "Dates:", {
        fromDate,
        toDate
      });

      if (
        !hasDateFilter &&
        attendanceCache.data &&
        Date.now() - attendanceCache.timestamp < attendanceCache.cacheDuration
      ) {
        console.log("Using cached attendance data");
        setAttendanceRecords(attendanceCache.data);
        setLastUpdated(new Date(attendanceCache.timestamp));
        setLoading(false);
        return;
      }

      console.log("Fetching fresh attendance data...");

      try {
        const params = {};

        if (fromDate) {
          params.fromDate = new Date(fromDate).toISOString();
        } else {
          const past = new Date();
          past.setFullYear(past.getFullYear() - 1);
          params.fromDate = past.toISOString();
        }

        if (toDate) {
          const endOfDay = new Date(toDate);
          endOfDay.setHours(23, 59, 59, 999);
          params.toDate = endOfDay.toISOString();
        } else {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          params.toDate = tomorrow.toISOString();
        }

        const endpoint = hasDateFilter
          ? `${BACKEND_URL}/api/attendance/fromDtoD`
          : `${BACKEND_URL}/api/attendance/all`;

        const attendanceResponse = await axios.get(endpoint, { params });
        let attendanceList = attendanceResponse.data || [];

        console.log("Raw attendance data:", attendanceList);

        const sessionsResponse = await axios.get(`${BACKEND_URL}/api/sessions`);
        const sessionsList = sessionsResponse.data || [];

        setAllSessionsCount(sessionsList.length);

        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const lastMonthSessions = sessionsList.filter((session) => {
          try {
            const sessionDate = new Date(session.sessionTime);
            return sessionDate >= lastMonth;
          } catch (error) {
            return false;
          }
        });

        setLastMonthCount(lastMonthSessions.length);

        const noShows = attendanceList.filter(
          (record) => record.wasNoShow === true
        );
        setNoShowCount(noShows.length);

        const processedRecords = attendanceList.map((record) => {
          const studentName = record.studentID
            ? `${record.studentID.firstName || ""} ${
                record.studentID.lastName || ""
              }`.trim()
            : "Unknown Student";

          const tutorName =
            record.sessionID && record.sessionID.tutorID
              ? `${record.sessionID.tutorID.firstName || ""} ${
                  record.sessionID.tutorID.lastName || ""
                }`.trim()
              : "Unknown Tutor";

          const sessionTime = record.sessionID
            ? record.sessionID.sessionTime
            : null;

          const rawDate = new Date(record.sessionID.sessionTime);
          const { date, time } = formatDateTime(sessionTime);

          let formattedDate = date;
          if (date !== "N/A") {
            const dateParts = date.split(",");
            if (dateParts.length === 2) {
              formattedDate = `${dateParts[0]},${dateParts[1]}`;
            }
          }

          const checkInDateTime = formatDateTime(record.checkInTime);
          const checkOutDateTime = formatDateTime(record.checkOutTime);

          return {
            id: record._id || "N/A",
            sessionId: record.sessionID ? record.sessionID._id : "N/A",
            studentName,
            tutorName,
            rawDateTime: rawDate,
            date: formattedDate,
            startTime: time,
            duration: record.sessionID
              ? record.sessionID.duration
              : record.duration || "N/A",
            endTime: calculateEndTime(
              time,
              record.sessionID ? record.sessionID.duration : record.duration
            ),
            checkInTime: checkInDateTime.time,
            checkOutTime: checkOutDateTime.time,
            checkInStatus: record.checkInStatus || "N/A",
            checkOutStatus: record.checkOutStatus || "N/A",
            wasNoShow: record.wasNoShow,
            status:
              record.sessionID && record.sessionID.status === "Cancelled"
                ? "Cancelled"
                : record.wasNoShow
                ? "No Show"
                : record.checkOutTime
                ? "Completed"
                : record.checkInTime
                ? "In Progress"
                : "Scheduled"
          };
        });

        processedRecords.sort((a, b) => {
          try {
            return new Date(b.date) - new Date(a.date);
          } catch (error) {
            return 0;
          }
        });

        console.log("Processed attendance records:", processedRecords);

        if (!fromDate && !toDate) {
          attendanceCache.data = processedRecords;
          attendanceCache.timestamp = now.getTime();
        }

        setAttendanceRecords(processedRecords);
        setLastUpdated(now);
        setLoading(false);

        if (error) setError(null);
      } catch (axiosError) {
        console.error("Detailed Axios Error:", {
          message: axiosError.message,
          response: axiosError.response
            ? {
                status: axiosError.response.status,
                data: axiosError.response.data,
                headers: axiosError.response.headers
              }
            : "No response",
          request: axiosError.request ? "Request exists" : "No request",
          config: axiosError.config
            ? {
                url: axiosError.config.url,
                method: axiosError.config.method,
                headers: axiosError.config.headers
              }
            : "No config"
        });

        const errorMessage = axiosError.response
          ? `Error: ${axiosError.response.status} - ${
              axiosError.response.data?.message || axiosError.response.statusText
            }`
          : "Failed to connect to the server. Please try again later.";

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
        setAllSessionsCount(sampleRecords.length + 5);
        setLastMonthCount(sampleRecords.length + 3);
        setNoShowCount(1);
        setLoading(false);
      }
    } catch (generalError) {
      console.error("General Error:", generalError);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  }, [fromDate, toDate, error]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance, fromDate, toDate]);

  function csvCellEscape(value) {
    if (value == null || value === undefined) return "";

    const str = String(value);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  }

  function buildCsvContent(data, start, end) {
    const headers = [
      "Student Name",
      "Tutor Name",
      "Date",
      "Session Time",
      "Check-in Time",
      "Check-out Time",
      "Duration",
      "Status"
    ];

    const rows = data.map((r) => {
      const sessionTime = `${r.startTime || "N/A"} to ${r.endTime || "N/A"}`;
      const realDuration =
        r.wasNoShow || r.status === "Cancelled" ? 0 : r.duration;

      return [
        r.studentName,
        r.tutorName,
        r.date,
        sessionTime,
        r.wasNoShow ? "No Show" : r.checkInTime,
        r.wasNoShow ? "No Show" : r.checkOutTime,
        realDuration,
        r.status
      ]
        .map(csvCellEscape)
        .join(",");
    });

    return headers.join(",") + "\n" + rows.join("\n");
  }

  const handleExport = () => {
    const now = new Date();
    const today = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear());

    const fileName = `attendance_report_${month}_${today}_${year}.csv`;
    const csvContent = buildCsvContent(attendanceRecords, start, end);

    const blob = new Blob(["\ufeff", csvContent], {
      type: "text/csv; charset=utf-8;"
    });

    const urlTemp = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.setAttribute("href", urlTemp);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(urlTemp);
  };

  const handleRefresh = () => {
    attendanceCache.data = null;
    attendanceCache.timestamp = null;
    fetchAttendance();
  };

  const formatLastUpdated = (date) => {
    if (!date) return "";

    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true
    }).format(date);
  };

  const formatDuration = (duration) => {
    if (!duration) return "N/A";

    if (typeof duration === "number") {
      if (duration >= 60) {
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        return `${hours}h ${minutes > 0 ? `${minutes}m` : ""}`;
      }

      return `${duration}m`;
    }

    return duration;
  };

  const getStatusClass = (status) => {
    if (!status) return "";

    const className = `status${status.replace(/\s/g, "")}`;
    return styles[className] || "";
  };

  const getCheckStatusClass = (status) => {
    if (!status) return "";

    const className = `checkStatus${status.replace(/\s/g, "")}`;
    return styles[className] || "";
  };

  return (
    <div className={styles.container}>
      <AdminSideBar selected="analytics" />

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
          <h1 className={styles.heading}>Attendance Report</h1>

          {lastUpdated && (
            <div className={styles.headerActions}>
              <span className={styles.lastUpdated}>
                Last updated: {formatLastUpdated(lastUpdated)}
              </span>

              <button className={styles.csvButton} onClick={handleExport}>
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
          <div className={styles.statisticsContainer}>
            <div className={styles.statCard}>
              <h3 className={styles.statTitle}>Total Booked Sessions</h3>
              <p className={styles.statValue}>
                {loading ? "..." : allSessionsCount}
              </p>
            </div>

            <div className={styles.statCard}>
              <h3 className={styles.statTitle}>Last Month's Sessions</h3>
              <p className={styles.statValue}>
                {loading ? "..." : lastMonthCount}
              </p>
            </div>

            <div className={styles.statCard}>
              <h3 className={styles.statTitle}>Completed Sessions</h3>
              <p className={styles.statValue}>
                {loading
                  ? "..."
                  : attendanceRecords.filter(
                      (record) => record.status === "Completed"
                    ).length}
              </p>
            </div>

            <div className={styles.statCard}>
              <h3 className={styles.statTitle}>No-Show Sessions</h3>
              <p className={styles.statValue}>
                {loading ? "..." : noShowCount}
              </p>
            </div>
          </div>

          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Attendance Records</h2>

            <div className={styles.dateFilter}>
              <label className={styles.dateBox}>
                <span>From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className={styles.dateInput}
                />
              </label>

              <label className={styles.dateBox}>
                <span>To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className={styles.dateInput}
                />
              </label>
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
                    <th>Student</th>
                    <th>Tutor</th>
                    <th>Date</th>
                    <th>Session Time</th>
                    <th>Check-In</th>
                    <th>Check-Out</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {attendanceRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{record.studentName}</td>
                      <td>{record.tutorName}</td>

                      <td>
                        {record.date?.includes(",") ? (
                          <>
                            <div>{record.date.split(",")[0]},</div>
                            <div>{record.date.split(",")[1].trim()}</div>
                          </>
                        ) : (
                          <div>{record.date}</div>
                        )}
                      </td>

                      <td>
                        {record.startTime} to {record.endTime}
                      </td>

                      <td>
                        {record.checkInTime !== "N/A" ? (
                          <>
                            {record.checkInTime}
                            <span
                              className={`${styles.statusBadge} ${getCheckStatusClass(
                                record.checkInStatus
                              )}`}
                            >
                              {record.checkInStatus}
                            </span>
                          </>
                        ) : record.wasNoShow ? (
                          <span
                            className={`${styles.statusBadge} ${styles.checkStatusNoShow}`}
                          >
                            No Show
                          </span>
                        ) : (
                          <span className={styles.mutedText}>Not Checked In</span>
                        )}
                      </td>

                      <td>
                        {record.checkOutTime !== "N/A" ? (
                          <>
                            {record.checkOutTime}
                            <span
                              className={`${styles.statusBadge} ${getCheckStatusClass(
                                record.checkOutStatus
                              )}`}
                            >
                              {record.checkOutStatus}
                            </span>
                          </>
                        ) : record.wasNoShow ? (
                          <span
                            className={`${styles.statusBadge} ${styles.checkStatusNoShow}`}
                          >
                            No Show
                          </span>
                        ) : record.checkInTime !== "N/A" ? (
                          <span className={styles.warningText}>In Progress</span>
                        ) : (
                          <span className={styles.mutedText}>Not Started</span>
                        )}
                      </td>

                      <td>
                        <span className={styles.durationBadge}>
                          {formatDuration(record.duration)}
                        </span>
                      </td>

                      <td className={styles.centerText}>
                        <span
                          className={`${styles.statusBadge} ${getStatusClass(
                            record.status
                          )}`}
                        >
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