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

function formatNameFromCardParsed({ firstName, lastName }) {
  const f = (firstName || "").trim();
  const l = (lastName || "").trim();
  if (f && l) return `${f} ${l}`;
  if (f) return f;
  if (l) return l;
  return "";
}

function SessionCardSwipeCore({ instruction, welcomeFlow = false }) {
  const [statusMessage, setStatusMessage] = useState("Awaiting card swipe...");
  const [welcomeMessage, setWelcomeMessage] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSwipeTime, setLastSwipeTime] = useState(0);
  const inputRef = useRef(null);
  const manualInputRef = useRef(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualID, setManualID] = useState("");
  const resetTimerRef = useRef(null);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
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

  const parseCardData = (rawData) => {
    const panMatch = rawData.match(/%B(\d+)\^/);
    if (!panMatch) return null;

    const cardID = panMatch[1];
    const rest = rawData.slice(panMatch.index + panMatch[0].length);
    const slashIdx = rest.indexOf("/");

    if (slashIdx !== -1) {
      const lastName = rest.slice(0, slashIdx).trim();
      const afterSlash = rest.slice(slashIdx + 1);
      const firstSeg = afterSlash.match(/^([^\^;\/\r\n]+)/);
      const firstName = firstSeg ? firstSeg[1].trim().split(/\s+/)[0] : "";
      return { cardID, firstName, lastName };
    }

    const legacy = rawData.match(/%B(\d+)\^([\w\-/ ]+)\^/);
    if (legacy) {
      const nameParts = legacy[2].split("/");
      const lastName = nameParts[0]?.trim();
      const firstName = nameParts[1]?.trim()?.split(" ")[0];
      return { cardID, firstName, lastName };
    }

    return { cardID, firstName: "", lastName: "" };
  };

  const processCardData = async (rawData) => {
    clearResetTimer();
    try {
      setWelcomeMessage(null);
      setSessionDetails(null);

      if (welcomeFlow) {
        setIsLoading(false);
        if (rawData.startsWith("%B")) {
          const parsed = parseCardData(rawData);
          if (!parsed) {
            setStatusMessage("Invalid card swipe format.");
            scheduleUiReset();
            return;
          }
          const nameFromCard = formatNameFromCardParsed(parsed);
          setWelcomeMessage(
            nameFromCard ? `Welcome to the BugHouse ${nameFromCard}!` : "Welcome to the BugHouse!"
          );
          setStatusMessage("");
          
          // Log the swipe to the backend
          try {
            await axiosPostData(`${BACKEND_URL}/api/attendance/public-welcome`, parsed);
          } catch (err) {
            console.log("Note: User not found in system, but welcome displayed");
          }
          
          scheduleUiReset();
          return;
        }
        if (rawData.startsWith(";")) {
          const idMatch = rawData.match(/^;(\d{10})\?/);
          if (!idMatch) {
            setStatusMessage("Invalid Track 2 swipe.");
            scheduleUiReset();
            return;
          }
          const studentID = idMatch[1];
          setWelcomeMessage("Welcome to the BugHouse!");
          setStatusMessage("");
          
          // Log the swipe to the backend
          try {
            await axiosPostData(`${BACKEND_URL}/api/attendance/public-welcome`, { studentID });
          } catch (err) {
            console.log("Note: User not found in system, but welcome displayed");
          }
          
          scheduleUiReset();
          return;
        }
        setStatusMessage("Unrecognized card format.");
        scheduleUiReset();
        return;
      }

      setStatusMessage("Processing swipe...");
      setIsLoading(true);

      const endpoint = `${BACKEND_URL}/api/attendance/check`;

      let response;

      if (rawData.startsWith("%B")) {
        const parsed = parseCardData(rawData);
        if (!parsed) {
          setStatusMessage("Invalid card swipe format.");
          return;
        }
        response = await axiosPostData(endpoint, parsed);
      } else if (rawData.startsWith(";")) {
        const idMatch = rawData.match(/^;(\d{10})\?/);
        if (!idMatch) {
          setStatusMessage("Invalid Track 2 swipe.");
          return;
        }
        const studentID = idMatch[1];
        response = await axiosPostData(endpoint, { studentID });
      } else {
        setStatusMessage("Unrecognized card format.");
        return;
      }

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
    const value = e.target.value.trim();
    if (!value || !value.includes("?")) return;

    const now = Date.now();
    if (now - lastSwipeTime < 1500) {
      e.target.value = "";
      return;
    }

    setLastSwipeTime(now);
    e.target.value = "";
    processCardData(value);
  };

  const handleManualCheckIn = async () => {
    if (!manualID.trim()) return;

    clearResetTimer();
    try {
      setWelcomeMessage(null);
      setIsLoading(true);
      setStatusMessage(welcomeFlow ? "Processing..." : "Processing manual check-in...");
      setSessionDetails(null);

      const endpoint = welcomeFlow
        ? `${BACKEND_URL}/api/attendance/public-welcome`
        : `${BACKEND_URL}/api/attendance/manual-checkin`;

      const response = await axiosPostData(endpoint, {
        idInput: manualID.trim(),
      });

      if (welcomeFlow) {
        const name =
          response.data.displayName ||
          [response.data.firstName, response.data.lastName].filter(Boolean).join(" ").trim();
        setWelcomeMessage(
          name ? `Welcome to the BugHouse ${name}!` : "Welcome to the BugHouse!"
        );
        setStatusMessage("");
      } else {
        setStatusMessage(response.data.message || "Manual check-in successful!");
        if (response.data.session) {
          setSessionDetails(response.data.session);
        }
      }

      setManualID("");
      setShowManualInput(false);
      if (inputRef.current) inputRef.current.focus();
    } catch (error) {
      if (welcomeFlow && error.response?.status === 404) {
        setWelcomeMessage("Welcome to the BugHouse!");
        setStatusMessage("");
      } else {
        const msg =
          error.response?.data?.message ||
          (welcomeFlow ? "Something went wrong. Please try again." : "Error during manual check-in.");
        setStatusMessage(msg);
      }
    } finally {
      setIsLoading(false);
      scheduleUiReset();
    }
  };

  const showWelcome = welcomeFlow && welcomeMessage;

  return (
    <div className={styles.cardReaderBox}>
      <input
        ref={inputRef}
        type="text"
        className={styles.hiddenInput}
        onChange={handleInputChange}
        autoFocus={!showManualInput}
        disabled={showManualInput}
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

          {!showManualInput ? (
            <button
              type="button"
              onClick={() => {
                setShowManualInput(true);
                setStatusMessage("Enter your ID number manually.");
                setSessionDetails(null);
                setWelcomeMessage(null);
                setTimeout(() => manualInputRef.current?.focus(), 0);
              }}
              disabled={isLoading}
              style={{ marginTop: "20px" }}
            >
              Manual Check-In
            </button>
          ) : (
            <div style={{ marginTop: "20px" }}>
              <input
                ref={manualInputRef}
                type="text"
                placeholder="Enter your ID number"
                value={manualID}
                onChange={(e) => setManualID(e.target.value)}
                disabled={isLoading}
                style={{
                  padding: "8px",
                  fontSize: "1rem",
                  marginRight: "10px",
                  width: "200px",
                }}
              />
              <button type="button" onClick={handleManualCheckIn} disabled={isLoading || !manualID.trim()}>
                Submit
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowManualInput(false);
                  setManualID("");
                  setStatusMessage("Awaiting card swipe...");
                  setSessionDetails(null);
                  setWelcomeMessage(null);
                  if (inputRef.current) inputRef.current.focus();
                }}
                disabled={isLoading}
                style={{ marginLeft: "10px" }}
              >
                Cancel
              </button>
            </div>
          )}

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
