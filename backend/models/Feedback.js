const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    studentUniqueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tutorUniqueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    feedbackText: {
        type: String,
        required: true,
        trim: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Feedback', feedbackSchema);