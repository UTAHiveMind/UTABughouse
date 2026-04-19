const mongoose = require('mongoose');

const cardSwipeLogSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    role: {
        type: String,
        enum: ['Student', 'Tutor', 'UNKNOWN']
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    cardID: {
        type: String
    },
    studentID: {
        type: String
    },
    swipeTime: {
        type: Date,
        default: Date.now,
        required: true
    },
    cardFormat: {
        type: String,
        enum: ['Track1', 'Track2', 'Manual'],
        default: 'Track1'
    },
    isWelcomeFlow: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient querying
cardSwipeLogSchema.index({ userID: 1, swipeTime: -1 });
cardSwipeLogSchema.index({ swipeTime: -1 });
cardSwipeLogSchema.index({ role: 1, swipeTime: -1 });

module.exports = mongoose.model("CardSwipeLog", cardSwipeLogSchema);
