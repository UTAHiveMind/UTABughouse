const mongoose = require('mongoose');

// Define the Session schema
const SessionSchema = new mongoose.Schema({
    studentID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Refers to the User model
        required: true,
    },
    tutorID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Refers to the User model
        required: true,
    },
    courseID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    sessionTime: {
        type: Date,
        required: true, // The time of the session
    },
    duration: {
        type: Number,
        required: true, // Duration in minutes
    },
    status: {
        type: String,
        enum: ['Scheduled', 'Completed', 'Cancelled', 'No Show'],
        default: 'Scheduled',
    },
    notes: {
        type: String, // Optional notes for the session
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Session', SessionSchema);