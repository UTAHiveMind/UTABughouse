import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styles from "../styles/Login.module.css";
import { validateLogin } from "../utils/LoginValidation";
import { axiosPostData, axiosGetData } from "../utils/api";
import axios from "axios";
import { FaEnvelope, FaLock } from "react-icons/fa";
import bg from "../assets/Login_background.png";

// Get configuration from environment variables
const PROTOCOL = process.env.REACT_APP_PROTOCOL || "https";
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || "localhost";
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || "4000";

// Construct the backend URL dynamically
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [logo, setLogo] = useState("");

  // Check if the user is already authenticated via SSO or session
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await axiosGetData(`${BACKEND_URL}/api/auth/session`);
        if (response.user) {
          navigate("/home"); // Redirect if already logged in
        }
      } catch (error) {
        console.error("Session check failed", error);
      }
    }
    // Fetch BugHouse settings to get the logo
    const fetchLogo = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/bughouse`);
        setLogo(response.data.logo);
      } catch (error) {
        console.error("Error fetching logo:", error);
      }
    };

    fetchLogo();

    checkSession();
  }, [navigate]);

  // Handle traditional email/password login
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Login form submitted", { email, password });

    const validationError = validateLogin({ email, password });
    setErrors(validationError);

    if (Object.keys(validationError).length === 0) {
      setIsLoading(true);
      try {
        console.log("Sending login request to server");
        const response = await axiosPostData(`${BACKEND_URL}/api/auth/login`, {
          email,
          password,
        });
        console.log("Login response received:", response);

        // Check if response or response.data is undefined
        if (!response || !response.data) {
          throw new Error("Invalid response format");
        }

        // Set user state and navigate to home
        if (response.data.success) {
          localStorage.setItem("user", JSON.stringify(response.data.user)); //once user login the user details will be saved in localstorage
          navigate("/home");
        } else {
          console.log("Login failed - response was not successful");
          setErrors({
            password: response.data.message || "Invalid email or password",
          });
        }
      } catch (error) {
        console.error("Login request failed", error);

        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log("Error response data:", error.response.data);
          console.log("Error response status:", error.response.status);

          if (error.response.status === 400) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              password: error.response.data.error || "Invalid credentials",
            }));
          } else {
            setErrors({ password: `Server error: ${error.response.status}` });
          }
        } else if (error.request) {
          // The request was made but no response was received
          console.log("No response received from server");
          setErrors({
            password:
              "No response from server. Please check if the server is running.",
          });
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log("Error message:", error.message);
          setErrors({ password: `Request setup error: ${error.message}` });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle SSO login
  const handleSSOLogin = () => {
    const ssoUrl = `${BACKEND_URL}/api/auth/saml`;
    window.location.href = ssoUrl;
  };

  return (
    <div
      className={`d-flex justify-content-center align-items-center vh-100 ${styles.background} ${styles.loginRoot}`}
        style={{backgroundImage: `url(${bg})`}}
    >
      <div className={styles.container}>
        {/* <div className={styles.productName}>bugHouse</div> */}
        <div className={styles.productHeader}>
          {logo && (
            <img
              src={logo}
              alt="BugHouse Logo"
              className={styles.productLogo}
            />
          )}
          <div className={styles.productName}>bugHouse</div>
        </div>
        <div className={`shadow-lg ${styles.formContainer}`}>
          <div className={styles.welcomeTitleNav}>
            <p className={styles.welcomeTitle}>WELCOME BACK!</p>
          </div>
          <h2 className={styles.title}>Login</h2>

          {/* Display success message if redirected from signup */}
          {location.state?.message && (
            <div className="alert alert-success" role="alert">
              {location.state.message}
            </div>
          )}

          {/* Email/Password Login Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className={styles.label}>
                Email address
              </label>
              
              <div className={styles.inputGroup}>
                <span className={styles.inputIcon}>
                  <FaEnvelope />
                </span>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter email"
                  className={`form-control ${styles.input}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {errors.email && (
                  <div className={styles.textDanger}>{errors.email}</div>
                )}
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="password" className={styles.label}>
                Password
              </label>

              <div className={styles.inputGroup}>
                <span className={styles.inputIcon}>
                  <FaLock />
                </span>
                <input
                  type="password"
                  id="password"
                  placeholder="Enter password"
                  className={`form-control ${styles.input}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {errors.password && (
                  <div className={styles.textDanger}>{errors.password}</div>
                )}
              </div>
            </div>
            <button
              type="submit"
              className={`btn ${styles.loginButton}`}
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>
          <div className={styles.divider}>
            <span>OR</span>
          </div>

          {/* SSO Login Button */}
          <button
            onClick={handleSSOLogin}
            className={`btn ${styles.ssologinButton}`}
            disabled={isLoading}
          >
            Login with SSO
          </button>

          <p className="mt-3 text-center">
            Don't have an account?{" "}
            <Link to="/signup" className={styles.link}>
              Register
            </Link>
          </p>

           <p className="mt-1 text-center">
            Forgot your password?{" "}
            <Link to="/forgot-password" className={styles.link}>
              Reset Password
            </Link>
          </p>

          <div className={styles.cardSwipeNav}>
          <Link to="/card-swipe" className={styles.cardSwipeButton}>
            Card Swipe
          </Link>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Login;
