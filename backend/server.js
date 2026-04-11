require('dotenv').config(); // Load environment variables

const express = require('express');
const passport = require('passport');
const SamlStrategy = require('passport-saml').Strategy;
const session = require('express-session');
const adminEmailRoutes = require('./routes/adminEmail');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const https = require('https');
const http = require('http');
const fs = require('fs');

const app = express();

// === Load Environment Variables ===
const MONGO_URI = process.env.DB;
const PROTOCOL = process.env.PROTOCOL || 'https';
const USE_HTTPS = PROTOCOL === 'https';

const BACKEND_HOST = process.env.BACKEND_HOST || 'localhost';
const FRONTEND_HOST = process.env.FRONTEND_HOST || 'localhost';
const BACKEND_PORT = process.env.BACKEND_PORT || 4000;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

const FRONTEND_URL = `${PROTOCOL}://${FRONTEND_HOST}:${FRONTEND_PORT}`;
const BACKEND_URL = `${PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}`;
const SESSION_SECRET = process.env.SESSION_SECRET || 'default_secret';

// Log the configuration
console.log(`Protocol: ${PROTOCOL}`);
console.log(`Frontend URL: ${FRONTEND_URL}`);
console.log(`Backend URL: ${BACKEND_URL}`);

// === Load Models ===
const User = require('./models/User');

// === Middleware ===
// CORS configuration with dynamic origin
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware for parsing JSON, URL-encoded data, and cookies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// === Session Setup ===
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: USE_HTTPS, // Set secure based on protocol
        sameSite: "lax"
    }
}));

// === Passport.js Setup ===
app.use(passport.initialize());
app.use(passport.session());

// Import auth module (contains both routes and SAML config)
const auth = require('./routes/auth');

// === SAML Strategy ===
passport.use(new SamlStrategy({
    ...auth.samlConfig,
    passReqToCallback: true,  // Pass request to callback
    forceAuthn: true  // Force re-authentication
}, (req, profile, done) => {
    // If passReqToCallback is true, first parameter is req
    return done(null, profile);
}));

// Serialize and Deserialize User
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// === Mount API Routes ===
const authRoutes = require('./routes/auth'); // Authentication routes
const usersRoutes = require('./routes/users'); // User management routes
const studentScheduleRoutes = require('./routes/schedules/student'); // Student schedules
const tutorScheduleRoutes = require('./routes/schedules/tutor'); // Tutor schedules
const attendanceRoutes = require('./routes/attendance'); // Attendance routesS
const availabilityRoutes = require("./routes/availability"); // Availability routes
const feedbackRoutes = require('./routes/feedback'); //feedback routes
const profileRoutes = require('./routes/profile');
const notificationRoutes = require("./routes/notifications/confirmation"); // Notification routes
const sessionRoutes = require('./routes/sessions')
const analyticsRoutes = require('./routes/analytics');
const bugHouse = require('./routes/bugHouse');
const courseRoutes = require('./routes/courses'); // for all the course
const tutorRequestRoutes = require('./routes/tutorRequests'); // Tutor request routes



// Mount other routes
app.use('/api/auth', auth.router); // Use the router exported from auth.js
app.use('/api/users', usersRoutes);
app.use('/api/schedules/student', studentScheduleRoutes);
app.use('/api/schedules/tutor', tutorScheduleRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use("/api/availability", availabilityRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/analytics', analyticsRoutes); //analytics routes
app.use('/api/bugHouse', bugHouse); //Bug House settings information
app.use('/api/courses', courseRoutes)
app.use('/api/tutor-request', tutorRequestRoutes); // Requesting tutor functionalities
app.use('/api/analytics', require('./routes/analytics'));




app.use("/api/notifications", notificationRoutes); // Notification routes
app.use("/api/admin", adminEmailRoutes);

// === Connect to MongoDB ===
if (!MONGO_URI) {
    console.error('MongoDB connection URI is undefined. Please check your .env file.');
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err.message));

// === Start the Server ===
const sslFolderPath = "./ssl";
const keyPath = `${sslFolderPath}/server.key`;
const certPath = `${sslFolderPath}/server.cert`;

// Start either HTTP or HTTPS server based on protocol setting
if (USE_HTTPS) {
    // Check if SSL certificates exist
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        try {
            // Load SSL Certificate & Key
            const sslOptions = {
                key: fs.readFileSync(keyPath),
                cert: fs.readFileSync(certPath)
            };
            
            // Start HTTPS Server
            https.createServer(sslOptions, app).listen(BACKEND_PORT, () => {
                console.log(`HTTPS Server running on ${BACKEND_URL}`);
                console.log(`CORS enabled for origin: ${FRONTEND_URL}`);
            });
        } catch (error) {
            console.error("Failed to start HTTPS server:", error.message);
            console.log("Falling back to HTTP server...");
            
            // Update CORS for HTTP
            const httpFrontendUrl = FRONTEND_URL.replace('https://', 'http://');
            app.use(cors({
                origin: httpFrontendUrl,
                credentials: true,
                methods: ["GET", "POST", "PUT", "DELETE"],
                allowedHeaders: ["Content-Type", "Authorization"]
            }));
            
            // Fallback to HTTP server if certificate loading fails
            http.createServer(app).listen(BACKEND_PORT, () => {
                const httpBackendUrl = BACKEND_URL.replace('https://', 'http://');
                console.log(`HTTP Server (fallback) running on ${httpBackendUrl}`);
                console.log(`CORS updated for origin: ${httpFrontendUrl}`);
            });
        }
    } else {
        console.error(`SSL certificates not found at ${sslFolderPath}. Cannot start HTTPS server.`);
        console.log("Falling back to HTTP server...");
        
        // Update CORS for HTTP
        const httpFrontendUrl = FRONTEND_URL.replace('https://', 'http://');
        app.use(cors({
            origin: httpFrontendUrl,
            credentials: true,
            methods: ["GET", "POST", "PUT", "DELETE"],
            allowedHeaders: ["Content-Type", "Authorization"]
        }));
        
        // Start HTTP Server if certificates don't exist
        http.createServer(app).listen(BACKEND_PORT, () => {
            const httpBackendUrl = BACKEND_URL.replace('https://', 'http://');
            console.log(`HTTP Server (fallback) running on ${httpBackendUrl}`);
            console.log(`CORS updated for origin: ${httpFrontendUrl}`);
        });
    }
} else {
    // Explicitly start HTTP server if protocol is not HTTPS
    http.createServer(app).listen(BACKEND_PORT, () => {
        console.log(`HTTP Server running on ${BACKEND_URL}`);
        console.log(`CORS enabled for origin: ${FRONTEND_URL}`);
    });
}