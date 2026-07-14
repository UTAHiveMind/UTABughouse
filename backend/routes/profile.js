const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const mongoose = require('mongoose');

const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TutorProfile = require('../models/TutorProfile');

// === TUTOR PROFILE ENDPOINTS ===

// GET tutor profile by user ID
router.get('/tutor/:userId', async (req, res) => {
    try {
        const profile = await TutorProfile.findOne({ userId: req.params.userId });
        if (!profile) {
            return res.status(404).json({ message: 'Tutor profile not found' });
        }
        res.json(profile);
    } catch (error) {
        console.error('Error fetching tutor profile:', error);
        res.status(500).json({ message: 'Error fetching tutor profile', error: error.message });
    }
});

// PUT - To update tutor courses only with objectID ref
router.put('/tutor/:userID/courses', async (req, res) => {
    const { userId } = req.params;
    const { courseIds } = req.body;

    if (!Array.isArray(courseIds)) {
        return res.status(400).json({ message: 'courseIds must be an array' });
    }

    try {
        const updatedProfile = await TutorProfile.findOneAndUpdate(
            { userId },
            { $set: { courses: courseIds } },
            { new: true }
        ).populate('courses');

        if (!updatedProfile) {
            return res.status(404).json({ message: 'Tutor profile not found'});
        }

        res.status(200).json({ 
            message: 'Courses updated successfully',
            profile: updatedProfile
        });
    } catch (err) {
        console.err('Error updating tutor courses:', err);
        res.status(500).json({ message: 'Failed to udpate courses', error: err.message });
    }
});

// === STUDENT PROFILE ENDPOINTS ===

// GET student profile by user ID
router.get('/student/:userId', async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ userId: req.params.userId });
        if (!profile) {
            return res.status(404).json({ message: 'Student profile not found' });
        }
        res.json(profile);
    } catch (error) {
        console.error('Error fetching student profile:', error);
        res.status(500).json({ message: 'Error fetching student profile', error: error.message });
    }
});

// === GENERAL PROFILE ENDPOINTS ===

// GET profile by user ID (tries to find either profile type)
router.get('/:userId', async (req, res) => {
    try {
        // First try to find a tutor profile
        let profile = await TutorProfile.findOne({ userId: req.params.userId }).populate('courses', 'code title');
        
        // If no tutor profile exists, try student profile
        if (!profile) {
            profile = await StudentProfile.findOne({ userId: req.params.userId });
        }
        
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        
        res.json(profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
});

// Create or update tutor profile
router.post('/tutor', upload.single('profilePicture'), async (req, res) => {
    try {
        let { userId, name, bio, courses, skills, major, currentYear } = req.body;
        
        if (!userId || !name) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Convert image file to base64 if provided
        let profilePicture = null;
        if (req.file) {
            profilePicture = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }

        // Parse courses if it's a JSON string
        
        if (typeof courses === 'string') {
            try {
                courses = JSON.parse(courses);
            } catch (e) {
                return res.status(400).json({ message: 'Invalid JSON in courses field' });
            }
        }
        
        // this convert each course ID to MongoDB objectID which we expected by our Course Model
        if (Array.isArray(courses)) {
            courses = courses.map(c => 
                new mongoose.Types.ObjectId(
                    typeof c === 'string' ? c : c._id
                )
            );
        }


        const profileData = {
            userId,
            name,
            bio: bio || "",
            courses,
            skills: skills || "",
            major: major || "N/A",
            currentYear: currentYear || "Not Specified",
            ...(profilePicture && { profilePicture })
        };

        // Update if exists, create if doesn't
        const profile = await TutorProfile.findOneAndUpdate(
            { userId },
            profileData,
            { new: true, upsert: true }
        );

        res.json({
            message: 'Tutor profile updated successfully',
            profile
        });

    } catch (error) {
        console.error('Error updating tutor profile:', error);
        res.status(500).json({ message: 'Error updating tutor profile', error: error.message });
    }
});

// Create or update student profile
router.post('/student', upload.single('profilePicture'), async (req, res) => {
    try {
        const { 
            userId, 
            name, 
            bio, 
            major, 
            currentYear, 
            coursesEnrolled, 
            areasOfInterest,
            preferredLearningStyle,
            academicGoals
        } = req.body;
        
        if (!userId || !name) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Convert image file to base64 if provided
        let profilePicture = null;
        if (req.file) {
            profilePicture = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }

        // Parse arrays if they're sent as strings
        let parsedCoursesEnrolled = coursesEnrolled;
        let parsedAreasOfInterest = areasOfInterest;
        
        if (typeof coursesEnrolled === 'string') {
            try {
                parsedCoursesEnrolled = JSON.parse(coursesEnrolled);
            } catch (e) {
                // If not valid JSON, split by commas
                parsedCoursesEnrolled = coursesEnrolled.split(',').map(item => item.trim());
            }
        }
        
        if (typeof areasOfInterest === 'string') {
            try {
                parsedAreasOfInterest = JSON.parse(areasOfInterest);
            } catch (e) {
                // If not valid JSON, split by commas
                parsedAreasOfInterest = areasOfInterest.split(',').map(item => item.trim());
            }
        }

        const profileData = {
            userId,
            name,
            bio: bio || "",
            major: major || "N/A",
            currentYear: currentYear || "Not Specified",
            coursesEnrolled: parsedCoursesEnrolled || [],
            areasOfInterest: parsedAreasOfInterest || [],
            preferredLearningStyle: preferredLearningStyle || "Not Specified",
            academicGoals: academicGoals || "",
            ...(profilePicture && { profilePicture })
        };

        // Update if exists, create if doesn't
        const profile = await StudentProfile.findOneAndUpdate(
            { userId },
            profileData,
            { new: true, upsert: true }
        );

        res.json({
            message: 'Student profile updated successfully',
            profile
        });

    } catch (error) {
        console.error('Error updating student profile:', error);
        res.status(500).json({ message: 'Error updating student profile', error: error.message });
    }
});

// Update user role
router.put('/update-role/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { newRole } = req.body;
        
        // Validate request
        if (!userId || !newRole) {
            return res.status(400).json({ error: "User ID and new role are required" });
        }
        
        // Check if admin is making the request
        if (req.session?.user?.role !== 'Admin') {
            return res.status(403).json({ error: "Only administrators can change user roles" });
        }
        
        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        const oldRole = user.role;
        
        // If role is not changing, nothing to do
        if (oldRole === newRole) {
            return res.status(200).json({ message: "User already has this role", user });
        }
        
        // Handle profile transition based on role change
        if (oldRole === 'Student' && newRole === 'Tutor') {
            // Get existing student profile data
            const studentProfile = await StudentProfile.findOne({ userId });
            
            if (studentProfile) {
                // Create new tutor profile using data from student profile
                const tutorProfile = new TutorProfile({
                    userId: userId,
                    studentID: studentProfile.studentID,
                    name: studentProfile.name,
                    bio: studentProfile.bio || "",
                    courses: [],
                    skills: "",
                    major: studentProfile.major || "N/A",
                    currentYear: studentProfile.currentYear || "Not Specified",
                    profilePicture: studentProfile.profilePicture
                });
                
                // Save the new tutor profile
                await tutorProfile.save();
                
                // Remove the old student profile
                await StudentProfile.findOneAndDelete({ userId });
                
                console.log(`Profile transitioned from Student to Tutor for user: ${userId}`);
            } else {
                // Create a default tutor profile if no student profile exists
                const fullName = `${user.firstName} ${user.lastName}`;
                const defaultTutorProfile = new TutorProfile({
                    userId: userId,
                    studentID: user.studentID,
                    name: fullName,
                    bio: "",
                    courses: "",
                    skills: "",
                    major: "N/A",
                    currentYear: "Not Specified",
                    profilePicture: null
                });
                
                await defaultTutorProfile.save();
                console.log(`Default tutor profile created for user: ${userId}`);
            }
        } else if (oldRole === 'Tutor' && newRole === 'Student') {
            // Get existing tutor profile data
            const tutorProfile = await TutorProfile.findOne({ userId });
            
            if (tutorProfile) {

                // Check if a student profile already exists
                const existingStudentProfile = await StudentProfile.findOne({ userId });

                // Create new student profile using data from tutor profile
                const studentProfile = {
                    userId: userId,
                    studentID: tutorProfile.studentID, 
                    name: tutorProfile.name,
                    bio: tutorProfile.bio || "",
                    major: tutorProfile.major || "N/A",
                    currentYear: tutorProfile.currentYear || "Not Specified",
                    coursesEnrolled: [],
                    areasOfInterest: [],
                    preferredLearningStyle: "Not Specified",
                    academicGoals: "",
                    profilePicture: tutorProfile.profilePicture,
                    tutorRequestPending: false,
                    tutorRequestStatus: null
                };

                // Fixes duplicate student profiles
                if (existingStudentProfile) {
                    await StudentProfile.findOneAndUpdate({ userId }, studentProfile);
                } else {
                    const newStudentProfile = new StudentProfile({ userId, ...studentProfile });
                    await newStudentProfile.save();
                }
                
                // Remove the old tutor profile
                await TutorProfile.findOneAndDelete({ userId });
                
                console.log(`Profile transitioned from Tutor to Student for user: ${userId}`);

            } else {
                // Create a default student profile if no tutor profile exists
                const fullName = `${user.firstName} ${user.lastName}`;
                const defaultStudentProfile = new StudentProfile({
                    userId: userId,
                    studentID: user.studentID,
                    name: fullName,
                    bio: "",
                    major: "N/A",
                    currentYear: "Not Specified",
                    coursesEnrolled: [],
                    areasOfInterest: [],
                    preferredLearningStyle: "Not Specified",
                    academicGoals: "",
                    profilePicture: null
                });
                
                await defaultStudentProfile.save();
                console.log(`Default student profile created for user: ${userId}`);
            }
        } else if (newRole === 'Admin') {
            // If changing to Admin, remove any existing profiles
            await StudentProfile.findOneAndDelete({ userId });
            await TutorProfile.findOneAndDelete({ userId });
            console.log(`Profiles removed for user: ${userId} who is now an Admin`);
        } else if (oldRole === 'Admin') {
            // If changing from Admin to another role, create appropriate profile
            const fullName = `${user.firstName} ${user.lastName}`;
            
            if (newRole === 'Student') {
                const defaultStudentProfile = new StudentProfile({
                    userId: userId,
                    studentID: user.studentID,
                    name: fullName,
                    bio: "",
                    major: "N/A",
                    currentYear: "Not Specified",
                    coursesEnrolled: [],
                    areasOfInterest: [],
                    preferredLearningStyle: "Not Specified",
                    academicGoals: "",
                    profilePicture: null
                });
                
                await defaultStudentProfile.save();
                console.log(`Default student profile created for former Admin: ${userId}`);
            } else if (newRole === 'Tutor') {
                const defaultTutorProfile = new TutorProfile({
                    userId: userId,
                    studentID: user.studentID,
                    name: fullName,
                    bio: "",
                    courses: [],
                    skills: "",
                    major: "N/A",
                    currentYear: "Not Specified",
                    profilePicture: null
                });
                
                await defaultTutorProfile.save();
                console.log(`Default tutor profile created for former Admin: ${userId}`);
            }
        }

        router.get('/report/:userId', async (req, res) => {
            try {
                const { userId } = req.params;

                const user = await User.findById(userId);
                if (!user) return res.status(404).json({ message: 'User not found' });

                const isTutor = user.role === 'Tutor';
                const profile = isTutor
                    ? await TutorProfile.findOne({ userId })
                    : await StudentProfile.findOne({ userId });

                if (!profile) return res.status(404).json({ message: 'Profile not found' });

                const Session = require('../models/Session');
                const sessions = await Session.find({
                    $or: [{ tutorID: userId }, { studentID: userId }]
                })
                    .sort({ sessionTime: -1 })
                    .populate('courseID');  

                res.json({
                    user,
                    profile,
                    totalSessions: sessions.length,
                    recentSessions: sessions.slice(0, 5)
                });

            } catch (err) {
                console.error('Error generating report:', err);
                res.status(500).json({ message: 'Error generating report', error: err.message });
            }
        });

        // Update the user's role
        user.role = newRole;
        await user.save();
        
        return res.status(200).json({ 
            message: `User role updated from ${oldRole} to ${newRole}`, 
            user 
        });
        
    } catch (error) {
        console.error('Error updating user role:', error);
        return res.status(500).json({ 
            message: 'Server error while updating user role', 
            error: error.message 
        });
    }
});

module.exports = router;