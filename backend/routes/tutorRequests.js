const express = require('express');
const router = express.Router();

const StudentProfile = require('../models/StudentProfile');
const TutorProfile = require('../models/TutorProfile')
const User = require('../models/User');

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage })

// Student initiates a tutor request
router.post('/request', upload.single('resume'), async (req, res) => {

    // console.log("Incoming tutor request body:", req.body);

    // Extracts request
    const { userId } = req.body;

    try {

        // Checking if student has a profile in the database and matches the userID
        const studentProfile = await StudentProfile.findOne({ userId });

        if (!studentProfile) {
            return res.status(404).json({ message: 'Student profile not found' });
        }
        
        // Update request statuses on profile
        studentProfile.tutorRequestPending = true;
        studentProfile.tutorRequestStatus = 'pending';

        // Convert resume from binary to base64 to store in database (a downloadable link)
        if (req.file) {
            const base64Resume = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            studentProfile.resume = base64Resume;
        }

        // if (studentResume)
        //     studentProfile.resume = studentResume;

        // Saves the updated student profile back to database
        await studentProfile.save();

        return res.status(200).json({ message: 'Tutor request submitted.' });

    } catch (error) {
        console.error('Error submitting tutor request:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Admin gets all pending requests
router.get('/pending', async (req, res) => {
    try {
        // .populate not only gives the userID (objectID), but the name, email, role, etc. and attaches to pendingRequests
        const pendingRequests = await StudentProfile.find({ tutorRequestStatus: 'pending' }).populate('userId');
        return res.status(200).json(pendingRequests);
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Admin approves or rejects a request 
router.post('/review', async (req, res) => {
    const { userId, decision } = req.body;

    try {
        // Checking if student has a profile and is a user in the database and matches the userID
        const studentProfile = await StudentProfile.findOne({ userId });
        const user = await User.findById(userId);
        const existingTutorProfile = await TutorProfile.findOneAndDelete({userId});

        if (!studentProfile || !user) {
            return res.status(404).json({ message: 'User or profile not found' });
        }


        // Update request statuses on profile
        studentProfile.tutorRequestPending = false;
        studentProfile.tutorRequestStatus = decision;

        // Saves the updated student profile back to database
        await studentProfile.save();

        // Update role
        if (decision === 'approved') {
            user.role = 'Tutor';
            await user.save();

            // If student isn't on the database for tutors, create a default profile
            if (!existingTutorProfile) {
                const newTutorProfile = new TutorProfile({
                    userId: user._id,
                    studentID: studentProfile.studentID,
                    name: `${user.firstName} ${user.lastName}`, // Fixed the annoying bug where it couldn't receive the name 
                    profilePicture: null,        // Or pull from studentProfile if you support it
                    bio: "",                     // Can be left empty or filled in later
                    courses: [], // Change to an array, NOT a string (defined differently than before)
                    skills: "",
                    major: "N/A",
                });

                await newTutorProfile.save()
            }
            
            // Removes their student profile
            await StudentProfile.deleteOne({ userId });

        } else if (decision === 'reset') {
            studentProfile.tutorRequestPending = false;
            studentProfile.tutorRequestStatus = null;
            await studentProfile.save();
            return res.status(200).json({ message: 'Request status reset.' });
        } else {
            user.role = 'Student'
            await user.save();
        }

        return res.status(200).json({ message: `Request ${decision}` });
    } catch (error) {
        console.error('Error reviewing tutor request:', error.message, error.stack);
        return res.status(500).json({ message: 'Server error' });
    }
});

router.put('/reset/:userId', async (req, res) => {
    try {
        const existingProfile = await StudentProfile.findOne({ userId: req.params.userId });

        if (!existingProfile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        // Resets student's status requests
        existingProfile.tutorRequestPending = false;
        existingProfile.tutorRequestStatus = null;
        
        await existingProfile.save();

        res.json({ message: "Tutor request reset." });

    } catch (error) {
        console.error("Error resetting tutor request:", err);
    }
});


module.exports = router;