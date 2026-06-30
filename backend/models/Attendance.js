const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    sessionID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session"
    },
    visitType: {
        type: String,
        enum: ["Session", "Walk-In"],
        default: "Session"
    },
    studentIdNumber: {
        type: String,
        trim: true
    },
    studentID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    tutorID: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User"
    },
    checkInTime: {
        type: Date
    },
    checkOutTime: {
        type: Date
    },
    duration: {
        type: Number // in minutes
    },
    checkInStatus: {
        type: String,
        enum: ['Early', 'On Time', 'Late', 'No Show', 'Cancelled'],
        default: 'On Time'
    },
    checkOutStatus: {
        type: String,
        enum: ['Early', 'On Time', 'Late', 'No Show', 'Cancelled'],
        default: 'On Time'
    },
    wasNoShow: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Attendance", attendanceSchema);
