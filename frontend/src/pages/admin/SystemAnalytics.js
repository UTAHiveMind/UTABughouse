import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/SystemAnalytics.module.css";
import AdminSideBar from "../../components/Sidebar/AdminSidebar";
import { useSidebar } from "../../components/Sidebar/SidebarContext";
import { FaFileCsv } from "react-icons/fa";

const PROTOCOL = process.env.REACT_APP_PROTOCOL || "https";
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "4000";
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

const DEFAULT_AVATAR =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMjU2Ij48cmVjdCBmaWxsPSIjZTllOWU5IiB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIvPjxjaXJjbGUgY3g9IjEyOCIgY3k9Ijk2IiByPSI0MCIgZmlsbD0iIzU5NjI3NCIvPjxwYXRoIGZpbGw9IiM1OTYyNzQiIGQ9Ik0yMTYsMTk2Yy0wLjQtMzcuOC0zMi43LTY4LTcyLTY4aC0zMmMtMzkuMywwLTcxLjYsMzAuMi03Miw2OEgyMTZ6Ii8+PC9zdmc+";

const analyticsCache = {
  data: null,
  timestamp: null,
  cacheDuration: 5 * 60 * 1000,
};

function SystemAnalytics() {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { isCollapsed } = useSidebar();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const navigate = useNavigate();

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

  const fetchTutors = useCallback(async () => {
    try {
      setLoading(true);

      const now = new Date();
      const hasDateFilter = Boolean(fromDate || toDate);

      console.log("fetch triggered. Filter active:", hasDateFilter, "Dates:", {
        fromDate,
        toDate,
      });

      if (
        !hasDateFilter &&
        analyticsCache.data &&
        analyticsCache.timestamp &&
        Date.now() - analyticsCache.timestamp < analyticsCache.cacheDuration
      ) {
        console.log("Using cached tutor analytics data");
        setTutors(analyticsCache.data);
        setLastUpdated(new Date(analyticsCache.timestamp));
        setLoading(false);
        return;
      }

      console.log("Fetching fresh tutor analytics data...");

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
        ? `${BACKEND_URL}/api/users/fromDtoD`
        : `${BACKEND_URL}/api/users/tutors`;

      const tutorsResponse = await axios.get(endpoint, { params });
      const tutorsList = tutorsResponse.data;

      console.log(`Fetched ${tutorsList.length} tutors from users API`);

      const tutorData = await Promise.all(
        tutorsList.map(async (tutor) => {
          try {
            const profileResponse = await axios.get(
              `${BACKEND_URL}/api/profile/${tutor._id}`
            );

            const profile = profileResponse.data;

            return {
              id: tutor._id,
              name: `${tutor.firstName} ${tutor.lastName}`,
              profilePic: profile?.profilePicture || DEFAULT_AVATAR,
              avgRating: tutor.avgRating || 0,
              totalSessions: tutor.totalSessions,
              totalCompleted: tutor.totalCompleted,
              totalCancelled: tutor.totalCancelled,
              totalCompletedMinutes: tutor.totalCompletedMinutes,
              totalCompletedHours: tutor.totalCompletedHours,
            };
          } catch (error) {
            console.log(
              `Error fetching details for tutor ${tutor._id}:`,
              error.message
            );

            return {
              id: tutor._id,
              name: `${tutor.firstName} ${tutor.lastName}`,
              profilePic: DEFAULT_AVATAR,
              avgRating: tutor.rating || 0,
              totalSessions: 0,
            };
          }
        })
      );

      analyticsCache.data = tutorData;
      analyticsCache.timestamp = now.getTime();

      setTutors(tutorData);
      setLastUpdated(now);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tutor analytics:", error);

      const errorMessage = error.response
        ? `Error: ${error.response.status} - ${
            error.response.data?.message || error.response.statusText
          }`
        : "Failed to connect to the server. Please try again later.";

      console.log("Using local fallback data while API is unavailable");

      setTutors([
        {
          id: 1,
          name: "Jane Smith",
          profilePic: DEFAULT_AVATAR,
          avgRating: 4.8,
          totalSessions: 24,
        },
        {
          id: 2,
          name: "John Doe",
          profilePic: DEFAULT_AVATAR,
          avgRating: 4.5,
          totalSessions: 18,
        },
        {
          id: 3,
          name: "Sarah Johnson",
          profilePic: DEFAULT_AVATAR,
          avgRating: 0,
          totalSessions: 3,
        },
      ]);

      setError(`${errorMessage} (Using sample data for display purposes)`);
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchTutors();
  }, [fetchTutors]);

  const handleRefresh = () => {
    analyticsCache.data = null;
    analyticsCache.timestamp = null;
    fetchTutors();
  };

  const handleTutorClick = (tutorId) => {
    navigate(`/tutor/${tutorId}`);
  };

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
      "Tutor Name",
      "Total Session",
      "Completed",
      "Cancelled",
      "Average Rating",
      "Total Hours",
      "Total Minutes",
    ];

    const rows = data.map((r) => {
      return [
        r.name,
        r.totalSessions,
        r.totalCompleted,
        r.totalCancelled,
        r.avgRating,
        r.totalCompletedHours,
        r.totalCompletedMinutes,
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
    const fileName = `tutor_performance_report_${month}_${today}_${year}.csv`;

    const csvContent = buildCsvContent(tutors, start, end);

    const blob = new Blob(["\ufeff", csvContent], {
      type: "text/csv; charset=utf-8;",
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

  const formatLastUpdated = (date) => {
    if (!date) return "";

    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    }).format(date);
  };

  return (
    <div className={styles.container}>
      <AdminSideBar selected="analytics" />

      <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : ""}`}>
        <div className={`${styles.headerSection} ${isCollapsed ? styles.headerSectionCollapsed : ""}`}>
          <h1 className={styles.heading}>System Analytics</h1>

          {lastUpdated && (
            <div className={styles.refreshContainer}>
              <span className={styles.lastUpdated}>
                Last updated: {formatLastUpdated(lastUpdated)}
              </span>

              <button
                className={styles.refreshButton}
                onClick={handleRefresh}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh Data"}
              </button>

              <button className={styles.csvButton} onClick={handleExport}>
                <FaFileCsv /> Export CSV
              </button>
            </div>
          )}
        </div>

        <div className={styles.analyticsSection}>
          <h2 className={styles.sectionTitle}>Tutor Performance</h2>

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

          {loading ? (
            <div className={styles.loadingContainer}>
              <p>Loading tutor data...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p>{error}</p>
            </div>
          ) : tutors.length === 0 ? (
            <div className={styles.emptyContainer}>
              <p>No tutor data available.</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.tutorTable}>
                <thead>
                  <tr>
                    <th className={styles.imageColumn}></th>
                    <th>Tutor Name</th>
                    <th>Average Rating</th>
                    <th>Total Sessions</th>
                  </tr>
                </thead>

                <tbody>
                  {tutors.map((tutor) => (
                    <tr
                      key={tutor.id}
                      onClick={() => handleTutorClick(tutor.id)}
                      className={styles.clickableRow}
                    >
                      <td className={styles.imageCell}>
                        <img
                          src={tutor.profilePic}
                          alt={`${tutor.name}'s profile`}
                          className={styles.profilePic}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = DEFAULT_AVATAR;
                          }}
                        />
                      </td>

                      <td>{tutor.name}</td>

                      <td>
                        <div className={styles.ratingContainer}>
                          <span className={styles.ratingValue}>
                            {tutor.avgRating || 0}
                          </span>

                          <div className={styles.starRating}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`${styles.star} ${
                                  star <= Math.round(tutor.avgRating)
                                    ? styles.filled
                                    : styles.empty
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      <td>{tutor.totalSessions}</td>
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

export default SystemAnalytics;