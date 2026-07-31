import React, { useEffect, useRef, useState, useCallback } from "react";
import styles from "../styles/SessionCardSwipe.module.css";
import { axiosPostData } from "../utils/api";

const PROTOCOL = process.env.REACT_APP_PROTOCOL || "https";
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "4000";
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

/** Public Card Swipe welcome banner duration before returning to the swipe UI */
const WELCOME_FLOW_RESET_MS = 4000;
const PROFILE_FLOW_RESET_MS = 10000;
const SWIPE_COMPLETE_WAIT_MS = 400;

function formatNameFromCardParsed({ firstName, lastName }) {
  const f = (firstName || "").trim();
  const l = (lastName || "").trim();
  if (f && l) return `${f} ${l}`;
  if (f) return f;
  if (l) return l;
  return "";
}

function SessionCardSwipeCore({ instruction, welcomeFlow = false, userRole = null }) {
  const [statusMessage, setStatusMessage] = useState("Awaiting card swipe...");
  const [welcomeMessage, setWelcomeMessage] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSwipeTime, setLastSwipeTime] = useState(0);
  const inputRef = useRef(null);
  const resetTimerRef = useRef(null);

  const swipeBufferRef = useRef("");
  const swipeTimerRef = useRef(null);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  }, []);

  const clearSwipeTimer = useCallback(() => {
    if (swipeTimerRef.current) {
      clearTimeout(swipeTimerRef.current);
      swipeTimerRef.current = null;
    }
  }, []);

  const scheduleUiReset = useCallback(() => {
    clearResetTimer();
    resetTimerRef.current = setTimeout(() => {
      setStatusMessage("Awaiting card swipe...");
      setSessionDetails(null);
      if (welcomeFlow) {
        setWelcomeMessage(null);
      }
      resetTimerRef.current = null;
    }, welcomeFlow ? WELCOME_FLOW_RESET_MS : PROFILE_FLOW_RESET_MS);
  }, [clearResetTimer, welcomeFlow]);

  useEffect(() => () => clearResetTimer(), [clearResetTimer]);

  const parseTrack2StudentID = (rawData) => {
    const rawSegments = [...rawData.matchAll(/;([^?;]+)/g)].map((match) => match[1].trim());
    for (let i = rawSegments.length - 1; i >= 0; i -= 1) {
      const segment = rawSegments[i];
      const numericPrefix = segment.split('=')[0];
      if (/^[0-9]+$/.test(numericPrefix)) {
        return numericPrefix;
      }
    }

    const fallbackNumericMatch = rawData.match(/;([0-9]+)(?=[\?;]|$)/);
    if (fallbackNumericMatch) {
      return fallbackNumericMatch[1];
    }

    const track1SuffixMatch = rawData.match(/\^([0-9]+)\?/);
    return track1SuffixMatch ? track1SuffixMatch[1] : null;
  };

  const parseCardData = (rawData) => {
    const panMatch = rawData.match(/%B(\d+)\^/);
    if (!panMatch) return null;

    const cardID = panMatch[1];
    const rest = rawData.slice(panMatch.index + panMatch[0].length);
    const slashIdx = rest.indexOf("/");

    let firstName = "";
    let lastName = "";

    if (slashIdx !== -1) {
      lastName = rest.slice(0, slashIdx).trim();
      const afterSlash = rest.slice(slashIdx + 1);
      const firstSeg = afterSlash.match(/^([^\^;\/\r\n]+)/);
      firstName = firstSeg ? firstSeg[1].trim().split(/\s+/)[0] : "";
    } else {
      const legacy = rawData.match(/%B(\d+)\^([\w\-/ ]+)\^/);
      if (legacy) {
        const nameParts = legacy[2].split("/");
        lastName = nameParts[0]?.trim();
        firstName = nameParts[1]?.trim()?.split(" ")[0] || "";
      }
    }

    return { cardID, firstName, lastName };
  };

  const parseCardSwipeData = (rawData) => {
    const studentID = parseTrack2StudentID(rawData);

    if (rawData.startsWith("%B")) {
      const track1 = parseCardData(rawData);
      if (!track1) return null;
      return { ...track1, studentID };
    }

    if (rawData.startsWith(";")) {
      if (!studentID) return null;
      return { studentID };
    }

    return null;
  };

  const processCardData = async (rawData) => {
    clearResetTimer();
    try {
      setWelcomeMessage(null);
      setSessionDetails(null);

      const parsed = parseCardSwipeData(rawData);
      if (!parsed) {
        setStatusMessage("Retry Card Swipe");
        if (welcomeFlow) scheduleUiReset();
        return;
      }

      if (welcomeFlow && userRole === "Student" && !parsed.studentID) {
        setStatusMessage("Retry Card Swipe");
        scheduleUiReset();
        return;
      }

      if (welcomeFlow) {
        setIsLoading(true);
        const endpoint =
          userRole === "Student"
            ? `${BACKEND_URL}/api/attendance/walk-in`
            : `${BACKEND_URL}/api/attendance/check`;

        const response = await axiosPostData(endpoint, parsed);
        setWelcomeMessage(
          userRole === "Student"
            ? "Walk-in attendance recorded."
            : "Tutor attendance recorded."
        );
        setStatusMessage(response.data.message || "Attendance recorded.");

        if (response.data.session) {
          setSessionDetails(response.data.session);
        }
        if (response.data.attendance) {
          setSessionDetails(response.data.attendance);
        }

        scheduleUiReset();
        return;
      }

      setStatusMessage("Processing swipe...");
      setIsLoading(true);

      const endpoint = `${BACKEND_URL}/api/attendance/check`;
      const response = await axiosPostData(endpoint, parsed);

      setStatusMessage(response.data.message || "Success");
      if (response.data.session) {
        setSessionDetails(response.data.session);
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Error occurred while checking in/out.";
      setStatusMessage(message);
    } finally {
      setIsLoading(false);
      scheduleUiReset();
    }
  };


  useEffect(() => {
    const keepFocus = () => {
      if (inputRef.current) inputRef.current.focus();
    };

    keepFocus();
    window.addEventListener("click", keepFocus);
    window.addEventListener("keydown", keepFocus);
    return () => {
      window.removeEventListener("click", keepFocus);
      window.removeEventListener("keydown", keepFocus);
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (!value) return;

    swipeBufferRef.current += value;
    e.target.value = "";
    clearSwipeTimer();

    swipeTimerRef.current = setTimeout(() => {
      const swipeData = swipeBufferRef.current.trim();
      swipeBufferRef.current = "";
      swipeTimerRef.current = null;

      if (!swipeData || !swipeData.includes("?")) {
        return;
      }

      const now = Date.now();
      if (now - lastSwipeTime < 1500) {
        return;
      }

      setLastSwipeTime(now);
      processCardData(swipeData);
    }, SWIPE_COMPLETE_WAIT_MS);
  };


  const showWelcome = welcomeFlow && welcomeMessage;

  return (
    <div className={styles.cardReaderBox}>
      <input
        ref={inputRef}
        type="text"
        className={styles.hiddenInput}
        onChange={handleInputChange}
        autoFocus
      />

      {showWelcome ? (
        <div className={styles.publicWelcomeBlock}>
          <p className={styles.publicWelcomeLine}>{welcomeMessage}</p>
        </div>
      ) : (
        <>
          <p className={styles.instruction}>{instruction}</p>

          {isLoading && <div className={styles.spinner}></div>}

          <div className={styles.status}>{statusMessage}</div>

          {sessionDetails && (
            <div className={styles.sessionBox}>
              <h3 className={styles.sessionTitle}>Session Details</h3>
              <p>
                <strong>Tutor:</strong> {sessionDetails.tutorName}
              </p>
              <p>
                <strong>Student:</strong> {sessionDetails.studentName}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {new Date(sessionDetails.sessionTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p>
                <strong>Duration:</strong> {sessionDetails.duration} minutes
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SessionCardSwipeCore;
