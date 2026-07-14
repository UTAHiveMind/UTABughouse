# UTABughouse - CSE Student Success Center Tutoring Web Application

## Project Overview

The bugHouse project is a web application designed to manage student-tutor interactions at the CSE Student Success Center. The application handles user authentication, tutor scheduling, session management, and attendance tracking, with a role-based access system for students, tutors, and administrators.

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)

## Project Structure

### Frontend (`/frontend`)

The frontend is a React application with the following structure:

```
frontend/
├── src/
│   ├── components/
│   │   ├── Sidebar/    # Navigation sidebar component
│   │   └── ...         # Other reusable UI components
│   ├── pages/
│   │   ├── admin/      # Admin-specific pages and components
│   │   ├── student/    # Student-specific pages and components
│   │   ├── tutor/      # Tutor-specific pages and components
│   │   └── ...         # Other shared pages
│   ├── styles/        # CSS and styling files
│   ├── utils/         # Utility functions and helpers
│   ├── App.js         # Main application component
│   └── index.js       # Application entry point
```

### Backend (`/backend`)

The backend is a Node.js/Express application with the following structure:

```
backend/
├── models/          # MongoDB models and schemas
├── routes/          # API endpoints and route handlers
├── ssl/             # SSL certificates
└── server.js        # Main server file
```

## API Endpoints

### Authentication (`/routes/auth.js`)

- User registration and login
- Password management
- JWT token handling

### User Management (`/routes/users.js`)

- User CRUD operations
- Role management
- Profile updates

### Session Management (`/routes/sessions.js`)

- Session creation and management
- Session scheduling
- Session status tracking

### Profile Management (`/routes/profile.js`)

- Student and tutor profile management
- Profile updates
- Profile verification

### Attendance (`/routes/attendance.js`)

- Attendance tracking
- Attendance reports
- Session check-in/out

### Feedback System (`/routes/feedback.js`)

- Feedback submission
- Feedback review
- Rating system

### Analytics (`/routes/analytics.js`)

- System statistics
- Performance metrics
- Usage reports

### Availability (`/routes/availability.js`)

- Tutor availability management
- Schedule conflicts
- Time slot management

## Features

### 1. **User Authentication**

- **Sign Up**: Users can create an account with their email, password, and basic profile information (name and contact info).
- **Sign In with credentials**: Users can sign in using their account email and password.
- **Sign in with SSO**: Users can use Single-Sign-On (SSO) to sign in using their UTA account.
- **Role-Based Access**: Defined roles for Admins, Tutors, and Students, each with appropriate access levels.

### 2. **Tutor Scheduling**

- **Availability Management**: Tutors submit their preferred availability.
- **Admin Scheduling**: Admins review tutor availability and finalize the schedule.
- **Notifications**: Tutors and students receive notifications regarding schedules and session bookings.
- **Calendar Integration**: Sync finalized schedules with calendar.

### 3. **Session Management**

- **Session Booking**: Students can book sessions with available tutors based on the finalized schedule.
- **Session Confirmation**: Tutors and students receive notifications via email/SMS for bookings, updates, or cancellations.

### 4. **Attendance Tracking**

- **Session Check-In/Check-Out**: Students check in and out of their sessions using their ID cards, recording session durations accurately.

### 5. **Reports**

- **Tutor Performance Reports**: Track the number of sessions, ratings, and feedback for tutors.
- **Student Attendance Reports**: Monitor attendance patterns and engagement.

### 6. **User Management**

- **Account Management**: Admins can manage user accounts for both tutors and students.
- **Role Assignment**: Admins can assign or modify roles (Admin, Tutor, Student).

### 7. **Additional Features**

- **Profiles**: Tutors and students can update their profiles with relevant information.
- **Ratings & Reviews**: Students can rate and provide feedback on tutors after sessions.
- **Notifications**: Implemented for session reminders, updates, and important announcements.

### 8. **Security and Compliance**

- **Data Protection**: Ensures compliance with relevant data protection regulations.
- **Access Control**: Role-based access ensures appropriate permissions for different user roles.

### 9. **User Interface**

- **Responsive Design**: The application works seamlessly on desktops, tablets, and smartphones.
- **User-Friendly Interface**: Provides an intuitive experience for all users.

## Technical Requirements

- **Platform**: The application is developed using a modern tech stack including React front-end and MongoDB back-end database.
- **Scalability**: Designed to handle a growing number of users and sessions.
- **Performance**: Ensures fast load times and minimal latency.

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm

### Installation Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/UTAHiveMind/UTABughouse.git
   ```

2. Install dependencies:

   For backend:

   ```bash
   cd UTABughouse/backend
   npm install
   ```

   For frontend:

   ```bash
   cd UTABughouse/frontend
   npm install
   ```

## Running the Application

### Development Mode

1. Start the backend server:

   ```bash
   cd UTABughouse/backend
   npm start
   ```

   This will start the backend server on port 4000 as configured in your .env file.

2. In a separate terminal, start the frontend development server:

   ```bash
   cd UTABughouse/frontend
   npm start
   ```

   This will launch the React development server on port 3000, and open the application in your default web browser.

3. (Optional) Create an admin user:

   If your application requires an initial admin account, run the createAdmin.js script after the backend server is running:

   ```bash
   node .\createAdmin.js
   ```

   This script is in the UTABughouse/backend directory and will create an admin account with email: 'admin@example.com', password: 'adminpassword'. Make sure MongoDB is accessible before running this script.

### Environment Variables

Make sure to set up the required environment variables before running the application:

1. Create a `.env` file in the backend directory with the following variables:

   ```
   # MongoDB Connection URI
   DB=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority

   # Backend Configuration
   BACKEND_PORT=4000
   BACKEND_HOST=localhost
   PROTOCOL=http

   # Frontend Configuration
   FRONTEND_PORT=3000
   FRONTEND_HOST=localhost

   # Session Secret for Cookies or JWT
   SESSION_SECRET=<your-secure-random-session-secret>

   # SMTP Configuration (Email Service)
   SMTP_SERVER=<your-smtp-server>
   SMTP_PORT=<your-smtp-port>
   SMTP_USERNAME=<your-smtp-username>
   SMTP_PASSWORD=<your-smtp-password>
   SMTP_PROXY_EMAIL=<your-proxy-sender-email>
   ```

2. Create a `.env` file in the frontend directory:
   ```
   REACT_APP_PROTOCOL=http
   HTTPS=false
   REACT_APP_BACKEND_HOST=localhost
   REACT_APP_BACKEND_PORT=4000
   ```

## Troubleshooting

If you encounter issues when running the application:

- Check that all dependencies are installed correctly
- Verify that MongoDB is running and accessible
- Ensure that environment variables are set correctly
- Check the console for error messages
