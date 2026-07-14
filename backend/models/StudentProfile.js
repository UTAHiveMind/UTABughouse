const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
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
    coursesEnrolled: {
        type: [String],
        default: []
    },
    areasOfInterest: {
        type: [String],
        default: []
    },
    preferredLearningStyle: {
        type: String,
        enum: ['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic', 'Not Specified'],
        default: 'Not Specified'
    },
    academicGoals: {
        type: String,
        default: ''
    },

    // Student requesting to be a tutor
    tutorRequestPending: {
        type: Boolean,
        default: false
    },

    // Status updates for requesting to be a tutor
    tutorRequestStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', null],
        default: null
    },

    // Upload resume when requesting to be a tutor
    resume: {
        type: String, 
        default: null
    },


    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

studentProfileSchema.pre('save', function(next) {
    this.lastUpdated = Date.now();
    next();
});

module.exports = mongoose.model('StudentProfile', studentProfileSchema);