import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from '../styles/Signup.module.css';
import { validateSignup } from '../utils/SignupValidation';
import { axiosPostData } from '../utils/api';
import bg from '../assets/background.png';
import { FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

const PROTOCOL = process.env.REACT_APP_PROTOCOL || 'https';
const BACKEND_HOST = process.env.REACT_APP_BACKEND_HOST || 'localhost';
const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || '4000';

const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;

function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentID, setStudentID] = useState('');
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrors({});
    setServerError('');

    const validationError = validateSignup({ firstName, lastName, phone, email, password, studentID });
    if (validationError.firstName || validationError.lastName || validationError.phone || validationError.email || validationError.password || validationError.studentID) {
      setErrors(validationError);
      return;
    }

    try {
      const response = await axiosPostData(`${BACKEND_URL}/api/auth/signup`, {
        firstName,
        lastName,
        phone,
        email,
        password,
        studentID
      });

      console.log(response);
      setSuccessMessage("Signup successful!");
      navigate('/login', { state: { message: "Account Successfully Created!" } });
    } catch (error) {
      console.error('There was an error submitting the form!', error);

      if (error.response && error.response.data) {
        if (
          error.response.data.error === "Email already in use" ||
          error.response.data.message?.includes("duplicate") ||
          error.response.data.error?.includes("duplicate") ||
          error.response.message?.includes("E11000")
        ) {
          setErrors({ ...errors, email: "This email is already registered" });
        } else {
          setServerError(error.response.data.message || error.response.data.error || "An error occurred during signup. Please try again.");
        }
      } else {
        setServerError("Unable to connect to the server. Please try again later.");
      }
    }
  };

  return (
    <div className={`d-flex justify-content-center align-items-center vh-100 ${styles.background}`}
    style={{backgroundImage: `url(${bg})`}}>
      <div className={styles.container}>
        <div className={styles.productName}>bugHouse</div>

        <div className={`shadow-lg ${styles.formContainer}`}>
          <h2 className={styles.title}>Sign Up</h2>
          {successMessage && <div className="text-success">{successMessage}</div>}
          {serverError && <div className={styles.textDanger}>{serverError}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.row}>
              <div className={styles.column}>
                <label className={styles.label}>First Name</label>
                <input
                  type="text"
                  className={`form-control ${styles.input}`}
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                {errors.firstName && <div className={styles.textDanger}>{errors.firstName}</div>}
              </div>
              <div className={styles.column}>
                <label className={styles.label}>Last Name</label>
                <input
                  type="text"
                  className={`form-control ${styles.input}`}
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                {errors.lastName && <div className={styles.textDanger}>{errors.lastName}</div>}
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.column}>
                <label className={styles.label}>Phone</label>
                <input
                  type="tel"
                  className={`form-control ${styles.input}`}
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {errors.phone && <div className={styles.textDanger}>{errors.phone}</div>}
              </div>
              <div className={styles.column}>
                <label className={styles.label}>Email</label>
                <input
                  type="email"
                  className={`form-control ${styles.input}`}
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && <div className={styles.textDanger}>{errors.email}</div>}
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.column}>
                <label className={styles.label}>Password</label>
                <div className={styles.inputGroup}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`form-control ${styles.input}`}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    className={styles.eyeIcon}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                {errors.password && <div className={styles.textDanger}>{errors.password}</div>}
                </div>
              </div>
              <div className={styles.column}>
                <label className={styles.label}>Student ID</label>
                <input
                  type="text"
                  className={`form-control ${styles.input}`}
                  placeholder="e.g. 1001234567"
                  value={studentID}
                  onChange={(e) => setStudentID(e.target.value)}
                />
                {errors.studentID && <div className={styles.textDanger}>{errors.studentID}</div>}
              </div>
            </div>

            <button type="submit" className={`btn ${styles.signupButton}`}>
              Sign Up
            </button>
            <p className="mt-3 text-center">
              Already have an account? <Link to="/login" className={styles.link}>Login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;