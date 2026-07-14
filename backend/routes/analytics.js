// routes/analytics.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Session = require('../models/Session');
const Feedback = require('../models/Feedback');
const TutorProfile = require('../models/TutorProfile');
const StudentProfile = require('../models/StudentProfile');
const mongoose = require('mongoose');

// GET /api/analytics/tutors
// Retrieves analytics for all tutors including profile info, average rating, and session count
router.get('/tutors', async (req, res) => {
  try {
    // Step 1: Get all tutors
    const tutors = await User.find({ role: 'Tutor' }).select('_id firstName lastName');
    
    // Step 2: Get tutor profiles for profile pictures
    const tutorProfiles = await TutorProfile.find({ 
      userId: { $in: tutors.map(tutor => tutor._id.toString()) } 
    }).select('userId profilePicture name');
    
    // Convert to a map for easier lookup
    const profileMap = {};
    tutorProfiles.forEach(profile => {
      profileMap[profile.userId] = {
        profilePicture: profile.profilePicture,
        name: profile.name // Use name from profile if available
      };
    });
    
    // Step 3: Get session counts for each tutor
    const sessionCounts = await Session.aggregate([
      { $match: { 
          tutorID: { $exists: true, $ne: null },
          status: { $in: ['Scheduled', 'Completed'] } 
        } 
      },
      { $group: { 
          _id: '$tutorID', 
          totalSessions: { $sum: 1 } 
        } 
      }
    ]);
    
    // Convert to a map for easier lookup
    const sessionCountMap = {};
    sessionCounts.forEach(item => {
      const idStr = item._id instanceof mongoose.Types.ObjectId 
        ? item._id.toString() 
        : String(item._id);
      sessionCountMap[idStr] = item.totalSessions;
    });
    
    // Step 4: Get average ratings for each tutor
    const ratings = await Feedback.aggregate([
      { $match: { tutorUniqueId: { $exists: true, $ne: null } } },
      { $group: { 
          _id: '$tutorUniqueId', 
          avgRating: { $avg: '$rating' },
          ratingCount: { $sum: 1 }
        } 
      }
    ]);
    
    // Convert to a map for easier lookup
    const ratingMap = {};
    ratings.forEach(item => {
      const idStr = item._id instanceof mongoose.Types.ObjectId 
        ? item._id.toString() 
        : String(item._id);
      
      let avgRating = 0;
      if (item.avgRating && !isNaN(item.avgRating)) {
        avgRating = parseFloat(item.avgRating.toFixed(1));
      }
      
      ratingMap[idStr] = {
        avgRating: avgRating,
        ratingCount: item.ratingCount
      };
    });
    
    // Step 5: Combine the data
    const tutorAnalytics = tutors.map(tutor => {
      const tutorId = tutor._id.toString();
      const profile = profileMap[tutorId];
      
      return {
        id: tutorId,
        name: profile?.name || `${tutor.firstName} ${tutor.lastName}`,
        profilePic: profile?.profilePicture || '/default-avatar.png',
        avgRating: ratingMap[tutorId] ? ratingMap[tutorId].avgRating : 0,
        ratingCount: ratingMap[tutorId] ? ratingMap[tutorId].ratingCount : 0,
        totalSessions: sessionCountMap[tutorId] || 0
      };
    });
    
    res.json(tutorAnalytics);
  } catch (error) {
    console.error('Error retrieving tutor analytics:', error);
    res.status(500).json({ message: 'Error retrieving tutor analytics', error: error.message });
  }
});

// GET /api/analytics/students
router.get('/students', async (req, res) => {
  try {

    // Step 1: Get all students
    const students = await User.find({ role: 'Student' }).select('_id firstName lastName');

    // Step 2: Get session count and sum it all up 
    const sessionCounts = await Session.aggregate([
      {
        $group: {
          _id: '$studentID',
          totalSessions: { $sum: 1 }
        }
      }
    ]);

    // Step 3: Create a lookup map to quickly access totalSessions for a given student ID
    const sessionMap = {};
    sessionCounts.forEach(session => {
      if (session._id) {
        sessionMap[session._id.toString()] = session.totalSessions;
      }
    });

    // Step 4: Combine results
    const result = students.map(student => ({
      id: student._id,
      name: `${student.firstName} ${student.lastName}`,
      totalSessions: sessionMap[student._id.toString()] || 0
    }));

    res.json(result);

  } catch (error) {
    console.error("Error in /students route:", error);
    res.status(500).json({ message: "Failed to get student data" });
  }
});


// GET /api/analytics/top-courses
// Receives the top 5 most booked courses
router.get('/top-courses', async (req, res) => {
  try {
    const topCourses = await Session.aggregate([ // Filters sessions that have courseIDs
      {
        $match: {
          courseID: { $exists: true, $ne: null },
          status: "Completed" // Only count for completed sessions
        }
      },
      {
        $group: {
          _id: '$courseID',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 } // Sorts courses by highest count
      },
      {
        $limit: 5 // Only returns the top 5 booked courses
      },
      {
        $lookup: { // Matches id from the courses collection and the Sessions collection, stores them as an array
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      { 
        $unwind: '$courseInfo' // Flattens array to use the fields (courseInfo.code, the course number) and easy lookup
      },
      {
        $project: { // Shapes output
          name: '$courseInfo.code',
          count: 1,
          _id: 0
        }
      }
    ]);

    // console.log("Top courses final output:", topCourses);
    res.json(topCourses);
  } catch (error) {
    console.error("Error fetching top courses:", error);
    res.status(500).json({ message: "Failed to get top courses" });
  }
});


// /api/analytics/student-departments
// Receives the number of students from each department (major)
router.get('/student-majors', async (req, res) => {
  try {
    const result = await StudentProfile.aggregate([
      {
        $match: {
          major: {
            $in: ['Computer Science', 'Computer Engineering', 'Software Engineering', 'N/A'] // Only include these majors and the N/A for the chart
          }
        }
      },
      {
        $group: {
          _id: '$major',
          count: { $sum: 1 }
        }
      },
      // {
      //   $sort: { count: -1 }
      // }, 
      {
        $project: {
          major: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json(result);
  } catch (error) {
    console.error('Error fetching student department counts:', error);
    res.status(500).json({ message: 'Failed to fetch department data' });
  }
});

// GET /api/analytics/student-learning-styles
// Receives the number of students for each learning style
router.get('/student-learning-styles', async (req, res) => {
  try {
    const result = await StudentProfile.aggregate([
      {
        $match: {
          preferredLearningStyle: {
            $nin: ["", null, "Not Specified", "Not Provided"] // Not include empty learning styles
          }
        }
      },
      {
        $group: {
          _id: '$preferredLearningStyle',
          count: { $sum: 1 }
        }
      },
      // {
      //   $sort: { count: -1 }
      // },
       {
        $project: {
          style: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]); 

    res.json(result);

  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch preferred learning styles'})
  }
});

// GET /api/analytics/student-stats
// On advanced reports, only tracks COMPLETED courses, NOT cancelled courses
router.get('/student-stats', async (req, res) => {
  try {
    const sessionStats = await Session.aggregate([
      {
        $match: {
          studentID: { $exists: true, $ne: null },
          courseID: { $exists: true, $ne: null },
        }
      },

      // Initial group is grouping sessions by student + course pair
      {
        $group: {
          _id: { studentID: '$studentID', courseID: '$courseID' },
          count: { $sum: 1 },
          completedSessions: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] // If status is Complete, add 1 to sum, else add 0
            }
          }
        }
      },

      { 
        $sort: { count: -1 } // Sorts in descending order, then will choose the first course from the list (since it has the most frequency)
      },

      {
        // Regroup with the most frequent course to pick most frequent course and sum completedSessions
        $group: {
          _id: '$_id.studentID',
          mostFrequentCourse: { $first: '$_id.courseID' },
          completedSessions: { $sum: '$completedSessions' },
          uniqueCourses: { $addToSet: '$_id.courseID' } // Collects unique courses using $addToSet
        }
      },

       // Lookup course info from courses collection to get the most frequent courses
      {
        $lookup: {
          from: 'courses',
          localField: 'mostFrequentCourse',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },

      // Flattens array for easy lookup (only use $unwind for 1:1 relationships)
      {
        $unwind: 
        { 
          path: '$courseInfo', 
          preserveNullAndEmptyArrays: true // If $lookup finds no matches, still includes courseInfo even if its NULL (just for safety)
        }
      },

      // Lookup student profile to get preferred learning style (only use $unwind for 1:1 relationships)
      {
        $lookup: {
          from: 'studentprofiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'studentProfile'
        }
      },

      { 
        $unwind: 
        { 
          path: '$studentProfile', 
          preserveNullAndEmptyArrays: true 
        } 
      },

      // Lookup all unique courses from courses collection
      {
        $lookup: {
          from: 'courses',
          localField: 'uniqueCourses',
          foreignField: '_id',
          as: 'uniqueCourseInfo'
        }
      },

      {
        $project: {
          completedSessions: 1, // The aggregation result calculats only 1 completed session for a student
          mostFrequentCourseCode: '$courseInfo.code',
          mostFrequentCourseTitle: '$courseInfo.title',
          uniqueCoursesCount: { $size: '$uniqueCourses' }, // Number of elements in the array
          uniqueCourses: {
            $map: { // Maps to an array containing only the course code and title
              input: '$uniqueCourseInfo',
              as: 'course',
              in: { code: '$$course.code', title: '$$course.title' }
            }
          },
          preferredLearningStyle: '$studentProfile.preferredLearningStyle'
        }
      }
    ]);

    // Debugging to get student objectID and using MongoDB Compass to manually verify (Sessions and courses collection)
    // Query in Sessions Collection: { studentID: ObjectId("STUDENT_ID"), status: "Completed" }
    // Query in courses Collection: {title: 'TITLE_OF_COURSE' }
    // console.log("Student Stats Raw Output:", sessionStats);

    // Convert to lookup map
    const statsMap = {};
    sessionStats.forEach(stat => {
      statsMap[stat._id.toString()] = {
        completedSessions: stat.completedSessions,
        mostFrequentCourseCode: stat.mostFrequentCourseCode || 'N/A',
        mostFrequentCourseTitle: stat.mostFrequentCourseTitle || 'N/A',
        uniqueCoursesCount: stat.uniqueCoursesCount || 0,
        uniqueCourses: stat.uniqueCourses || ['N/A'],
        preferredLearningStyle: stat.preferredLearningStyle || 'Not Specified on Student Profile'
      };
    });

    res.json(statsMap);
  } catch (err) {
    console.error('Error fetching student stats:', err);
    res.status(500).json({ message: 'Failed to fetch student stats' });
  }
});

// Same as student stats except for tutors
router.get('/tutor-stats', async (req, res) => {
  try {
    const tutorStats = await Session.aggregate([
      {
        $match: {
          tutorID: { $exists: true, $ne: null },
          studentID: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            tutorID: '$tutorID',
            studentID: '$studentID',
            courseID: '$courseID'
          },
          count: { $sum: 1 },
          completedCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { count: -1 } },
      {
        $group: {
          _id: '$_id.tutorID',
          mostFrequentStudent: { $first: '$_id.studentID' },
          mostFrequentCourse: { $first: '$_id.courseID' },
          totalSessions: { $sum: '$count' },
          completedSessions: { $sum: '$completedCount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'mostFrequentStudent',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: { path: '$studentInfo', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'courses',
          localField: 'mostFrequentCourse',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      { $unwind: { path: '$courseInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          mostFrequentStudent: {
            $concat: [
              { $ifNull: ['$studentInfo.firstName', ''] },
              ' ',
              { $ifNull: ['$studentInfo.lastName', ''] }
            ]
          },
          mostFrequentCourse: {
            $cond: {
              if: {
                $and: [
                  { $ifNull: ['$courseInfo.code', false] },
                  { $ifNull: ['$courseInfo.title', false] }
                ]
              },
              then: {
                $concat: [
                  '$courseInfo.code',
                  ' - ',
                  '$courseInfo.title'
                ]
              },
              else: 'N/A'
            }
          },
          totalSessions: 1,
          completedSessions: 1
        }
      }
    ]);

    const statsMap = {};
    tutorStats.forEach(stat => {
      statsMap[stat._id.toString()] = stat;
    });

    res.json(statsMap);
  } catch (err) {
    console.error('Error fetching tutor stats:', err);
    res.status(500).json({ message: 'Failed to fetch tutor stats' });
  }
});

// Gets the number of tutors by department
router.get('/tutor-departments', async (req, res) => {
  try {
    const result = await TutorProfile.aggregate([
      {
        $project: {
          major: {
            $cond: [
              { $in: ['$major', ['', null, 'Not Specified', 'Not Provided']] },
              'Not Specified',
              '$major'
            ]
          }
        }
      },
      {
        $group: {
          _id: '$major',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $project: {
          major: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json(result);
  } catch (error) {
    console.error('Error fetching tutor department counts:', error);
    res.status(500).json({ message: 'Failed to fetch tutor department data' });
  }
});

// Gets the top 5 courses by tutors
router.get('/top-courses-by-tutors', async (req, res) => {
  try {
    const result = await TutorProfile.aggregate([
      {
        $project: {
          courses: { $ifNull: ["$courses", []] } 
        }
      },
      {
        $unwind: {
          path: "$courses",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $group: {
          _id: { $ifNull: ["$courses", "Not Specified"] }, 
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "courseInfo"
        }
      },
      {
        $unwind: {
          path: "$courseInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          name: {
            $cond: [
              { $eq: ["$_id", "Not Specified"] },
              "Not Specified",
              "$courseInfo.code"
            ]
          },
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json(result); 
  } catch (error) {
    console.error('Error fetching top courses by tutors:', error);
    res.status(500).json({ message: 'Failed to fetch top courses by tutors' });
  }
});

// Gets the tutors by session volume
router.get('/tutor-session-volume', async (req, res) => {
  try {
    const sessionsPerTutor = await Session.aggregate([
      {
        $group: {
          _id: "$tutorID",
          sessionCount: { $sum: 1 }
        }
      }
    ]);
    
    const bins = {
      "0-5": 0,
      "6-10": 0,
      "11-25": 0,
      "26-50": 0,
      "51+": 0
    };

    sessionsPerTutor.forEach(tutor => {
      const count = tutor.sessionCount;
      if (count <= 5) bins["0-5"]++;
      else if (count <= 10) bins["6-10"]++;
      else if (count <= 25) bins["11-25"]++;
      else if (count <= 50) bins["26-50"]++;
      else bins["51+"]++;
    });

    const formatted = Object.entries(bins).map(([range, count]) => ({
      range,
      count
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching tutor session volume:', error);
    res.status(500).json({ message: 'Failed to fetch tutor session volume data' });
  }
})

// Gets the average ratings of tutors
router.get('/tutors-average-rating', async (req, res) => {
  try {
    const results = await Feedback.aggregate([
      {
        $group: {
          _id: "$tutorUniqueId",
          avgRating: { $avg: "$rating" }
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $eq: ["$avgRating", null] }, then: "Undefined" },
                { case: { $and: [{ $gte: ["$avgRating", 0.1] }, { $lte: ["$avgRating", 0.9] }] }, then: "0.1-0.9" },
                { case: { $and: [{ $gte: ["$avgRating", 1] }, { $lte: ["$avgRating", 1.9] }] }, then: "1-1.9" },
                { case: { $and: [{ $gte: ["$avgRating", 2] }, { $lte: ["$avgRating", 2.9] }] }, then: "2-2.9" },
                { case: { $and: [{ $gte: ["$avgRating", 3] }, { $lte: ["$avgRating", 3.9] }] }, then: "3-3.9" },
                { case: { $and: [{ $gte: ["$avgRating", 4] }, { $lte: ["$avgRating", 4.9] }] }, then: "4-4.9" },
                { case: { $eq: ["$avgRating", 5] }, then: "5" }
              ],
              default: "Undefined"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          _id: 1 
        }
      }
    ]);

    res.json(results);
  } catch (err) {
    console.error("Error bucketing tutor ratings:", err);
    res.status(500).json({ error: "Failed to group tutor ratings." });
  }
});

module.exports = router;