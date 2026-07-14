const mongoose = require('mongoose');

const tutorProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    studentID: {
        type: String,
        required: true,
        trim: true
    },
    profilePicture: {
        type: String,
        default: null
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    bio: {
        type: String,
        trim: true
    },
    //added the big bracket so each tutor can have multiple courses not just one
    //like array of courses
    courses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        default: []
    }],
    skills: {
        type: String,
        trim: true
    },
    major: {
        type: String,
        enum: ['Computer Science', 'Computer Engineer', 'Software Engineer', 'N/A'],
        default: 'N/A',
        trim: true
    },
    currentYear: {
        type: String,
        enum: ['Freshman', 'Sophomore', 'Junior', 'Senior', "Master's Student", 'PhD Student', 'Not Specified'],
        default: 'Not Specified',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TutorProfile', tutorProfileSchema);