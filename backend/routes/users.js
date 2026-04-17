const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const TutorProfile = require('../models/TutorProfile');
const Course = require('../models/Course');
const User = require('../models/User'); // Import User model
const { MdEmail } = require('react-icons/md');

// Fetch all users (for reference)
router.get('/', async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users
    res.status(200).json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.get('/tutors/:search', async (req, res) => {
  try {
    const searchValue = req.params.search;
    //console.log("Search value:", searchValue);
    const tutors = await User.aggregate([
      {
        $lookup: {
          from: 'tutorprofiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile',
        },
      },
      {
        $unwind: {
          path: '$profile',
          preserveNullAndEmptyArrays: true,
        },
      },
      // for course names from the course collection
      {
        $lookup: {
          from: 'courses',
          localField: 'profile.courses',
          foreignField: '_id',
          as: 'courseDetails',
        },
      },
      {
        $addFields:{
          fullName:{
            $concat:['$firstName', '$lastName'],
          },
          
          courseStr: {
            $reduce: {
              input: {
                $cond: {
                  if: { $isArray: "$profile.courses" },
                  then: "$profile.courses",
                  else: [],
                },
              },
              initialValue: "",
              in: {
                $concat: ["$$value", " ", { $toString: "$$this" }]
              },
            },
          },
          courseNames: {
            $map: {
              input: '$courseDetails',
              as: 'course',
              in: {
                $concat: ["$$course.code", " - ", "$$course.title"]
              },
            },
          },
        },
      },
      {
        $match:
          searchValue === 'ALL'
            ? { $and: [{ role: 'Tutor' }] }
            : {
                $and: [
                  { role: 'Tutor' },
                  {
                    $or: [
                      { fullName: { $regex: searchValue, $options: 'ix' } },
                      { courseStr: { $regex: searchValue, $options: 'ix' } },
                    ],
                  },
                ],
              },
      },
    ]);
    res.status(200).json(tutors);
  } catch (err) {
    console.error('Error searching tutors:', err);
    res.status(500).json({ message: 'Failed to search tutors' });
  }
});

// Search tutors by course code or course name
router.get('/tutors/by-course/:search', async (req, res) => {
  try{
    const searchValue = req.params.search;

    const tutors = await User.aggregate([
      {
        $match: { role: 'Tutor'}
      },
      {
        $lookup: {
          from: 'tutorprofiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile',
        },
      },
      { $unwind : "$profile" },
      {
        $lookup: {
          from: 'courses',
          localField: 'profile.courses',
          foreignField: '_id',
          as: 'courseDetails',
        },
      },
      {
        $match: {
          courseDetails: {
            $elemMatch: {
              $or: [
                { code: { $regex: searchValue, $options: 'i'} },
                { title: { $regex: searchValue, $options: 'i'} },
              ]
            }
          }
        }
      },
      {
        $addFields: {
          courseNames: {
            $map: {
              input: '$courseDetails',
              as: 'course',
              in: {
                $concat: ['$$course.code', '-', '$$course.title']
              },
            },
          }
        }
      }
    ]);
    res.status(200).json(tutors);
  } catch (err) {
    console.error('Error searching tutors by course:', err);
    res.status(500).json({ message: 'Failed to search tutors by course'});
  }
});

router.get('/tutors', async (req, res) => {
  try {
    const tutors = await User.aggregate([
      { $match: { role: 'Tutor' } },

      // JOIN tutor profile
      {
        $lookup: {
          from: 'tutorprofiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile',
        },
      },
      {
        $unwind: {
          path: '$profile',
          preserveNullAndEmptyArrays: true,
        },
      },

      // JOIN courses
      {
        $lookup: {
          from: 'courses',
          localField: 'profile.courses',
          foreignField: '_id',
          as: 'courseDetails',
        },
      },

      // JOIN feedbacks
      {
        $lookup: {
          from: 'feedbacks',
          localField: '_id',
          foreignField: 'tutorUniqueId',
          as: 'feedbacks',
        },
      },

      // JOIN sessions
      {
        $lookup: {
          from: 'sessions',
          localField: '_id',
          foreignField: 'tutorID',
          as: 'sessions',
        },
      },

      {
        $addFields: {
          avgRating: {
            $cond: [
              { $gt: [{ $size: '$feedbacks' }, 0] },
              { $avg: '$feedbacks.rating' },
              0,
            ],
          },
          totalRatings: { $size: '$feedbacks' },
          latestFeedbackDate: {
            $max: '$feedbacks.createdAt'
          },
          totalSessions: {$size: '$sessions'},
          totalCompleted: {
            $size: {
              $filter: {
                input: '$sessions',
                as: 'session',
                cond: { $eq: ['$$session.status', 'Completed']}
              }
            }
          },
          totalCancelled: {
            $size: {
              $filter: {
                input: '$sessions',
                as: 'session',
                cond: { $eq: ['$$session.status', 'Cancelled']}
              }
            }
          },
          totalCompletedMinutes: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$sessions',
                    as: 'session',
                    cond: { $eq: ['$$session.status', 'Completed'] }
                  }
                },
                as: 'completedSession',
                in: '$$completedSession.duration'
              }
            }
          },

          totalCompletedHours: {
            $divide: [
              {
                $sum: {
                  $map: {
                    input: {
                      $filter: {
                        input: '$sessions',
                        as: 'session',
                        cond: { $eq: ['$$session.status', 'Completed'] }
                      }
                    },
                    as: 'completedSession',
                    in: '$$completedSession.duration'
                  }
                }
              },
              60
            ]
          }
        },
      },

      // FINAL OUTPUT
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          profilePicture: '$profile.profilePicture',

          avgRating: 1,
          totalRatings: 1,
          latestFeedbackDate: 1,
          totalSessions: 1,
          totalCompleted: 1,
          totalCancelled: 1,
          totalCompletedMinutes: 1,
          totalCompletedHours: 1,

          courses: {
            $map: {
              input: '$courseDetails',
              as: 'course',
              in: {
                _id: '$$course._id',
                code: '$$course.code',
                name: '$$course.title',
              },
            },
          },
        },
      },
    ]).sort({latestFeedbackDate: -1}) //Latest to the past
    .limit(100);                      

    res.status(200).json(tutors);
  } catch (err) {
    console.error('Error fetching tutors:', err);
    res.status(500).json({ message: 'Failed to fetch tutors' });
  }
});


//Get tutor report records within a date range
router.get('/fromDtoD', async (req, res) => {
  try {
    const {fromDate, toDate} = req.query; //Extract query parameters from URL to get fromDate and toDate

    //Convert string to date object
    const start = new Date(fromDate);
    const end = new Date(toDate);

    //Check to see if date value is not a number or isValid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        message: 'Invalid date format provided. Please use YYYY-MM-DD.' 
      });
    }

    end.setHours(23, 59, 59, 999);

    const dateFilter = {};
    if (fromDate) dateFilter.$gte = start;
    if (toDate) dateFilter.$lte = end;

    const tutors = await User.aggregate([
      { $match: { role: 'Tutor' } },

      // JOIN tutor profile
      {
        $lookup: {
          from: 'tutorprofiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile',
        },
      },
      {
        $unwind: {
          path: '$profile',
          preserveNullAndEmptyArrays: true,
        },
      },

      // JOIN courses
      {
        $lookup: {
          from: 'courses',
          localField: 'profile.courses',
          foreignField: '_id',
          as: 'courseDetails',
        },
      },

      // JOIN feedbacks
      {
        $lookup: {
          from: 'feedbacks',
          localField: '_id',
          foreignField: 'tutorUniqueId',
          as: 'feedbacks',
        },
      },

      // ALL sessions for analytics totals
      {
        $lookup: {
          from: 'sessions',
          localField: '_id',
          foreignField: 'tutorID',
          as: 'allSessions',
        },
      },

      // FILTERED sessions only for date-range visibility
      {
        $lookup: {
          from: 'sessions',
          let: { tutorId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$tutorID', '$$tutorId'] },
                ...(Object.keys(dateFilter).length > 0
                  ? { sessionTime: dateFilter }
                  : {}),
              },
            },
          ],
          as: 'filteredSessions',
        },
      },

      {
        $addFields: {
          avgRating: {
            $cond: [
              { $gt: [{ $size: '$feedbacks' }, 0] },
              { $avg: '$feedbacks.rating' },
              0,
            ],
          },
          totalRatings: { $size: '$feedbacks' },
          latestFeedbackDate: {
            $max: '$feedbacks.createdAt',
          },

          // analytics totals = always from ALL sessions
          totalSessions: { $size: '$allSessions' },

          totalCompleted: {
            $size: {
              $filter: {
                input: '$allSessions',
                as: 'session',
                cond: { $eq: ['$$session.status', 'Completed'] },
              },
            },
          },

          totalCancelled: {
            $size: {
              $filter: {
                input: '$allSessions',
                as: 'session',
                cond: { $eq: ['$$session.status', 'Cancelled'] },
              },
            },
          },

          totalCompletedMinutes: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$allSessions',
                    as: 'session',
                    cond: { $eq: ['$$session.status', 'Completed'] },
                  },
                },
                as: 'completedSession',
                in: '$$completedSession.duration',
              },
            },
          },

          totalCompletedHours: {
            $divide: [
              {
                $sum: {
                  $map: {
                    input: {
                      $filter: {
                        input: '$allSessions',
                        as: 'session',
                        cond: { $eq: ['$$session.status', 'Completed'] },
                      },
                    },
                    as: 'completedSession',
                    in: '$$completedSession.duration',
                  },
                },
              },
              60,
            ],
          },

          // this is only for filtering rows by date range
          filteredSessionCount: { $size: '$filteredSessions' },
        },
      },

      // Only keep tutors that had sessions in selected range
      {
        $match: {
          filteredSessionCount: { $gt: 0 },
        },
      },

      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          profilePicture: '$profile.profilePicture',

          avgRating: 1,
          totalRatings: 1,
          latestFeedbackDate: 1,
          totalSessions: 1,
          totalCompleted: 1,
          totalCancelled: 1,
          totalCompletedMinutes: 1,
          totalCompletedHours: 1,

          courses: {
            $map: {
              input: '$courseDetails',
              as: 'course',
              in: {
                _id: '$$course._id',
                code: '$$course.code',
                name: '$$course.title',
              },
            },
          },
        },
      },

      { $sort: { latestFeedbackDate: -1 } },
      { $limit: 100 },
    ]);

    res.json(tutors);
  } catch (error) {
    console.error('Error fetching tutor analytics records:', error);
    res.status(500).json({
      message: 'Error fetching tutor analytics records',
      error: error.message,
    });
  }
});

// Get detailed analytics data for a single tutor
router.get('/tutors/:id/details', async (req, res) => {
  try {
    const tutorId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(tutorId)) {
      return res.status(400).json({ message: 'Invalid tutor ID' });
    }

    const tutorObjectId = new mongoose.Types.ObjectId(tutorId);

    const result = await User.aggregate([
      {
        $match: {
          _id: tutorObjectId,
          role: 'Tutor',
        },
      },

      // JOIN tutor profile
      {
        $lookup: {
          from: 'tutorprofiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile',
        },
      },
      {
        $unwind: {
          path: '$profile',
          preserveNullAndEmptyArrays: true,
        },
      },

      // JOIN feedbacks for rating stats
      {
        $lookup: {
          from: 'feedbacks',
          localField: '_id',
          foreignField: 'tutorUniqueId',
          as: 'feedbacks',
        },
      },

      // JOIN sessions for this tutor
      {
        $lookup: {
          from: 'sessions',
          localField: '_id',
          foreignField: 'tutorID',
          as: 'sessions',
        },
      },

      // JOIN attendances for all tutor sessions
      {
        $lookup: {
          from: 'attendances',
          localField: 'sessions._id',
          foreignField: 'sessionID',
          as: 'attendances',
        },
      },

      // JOIN all students referenced by tutor's sessions
      {
        $lookup: {
          from: 'users',
          let: { studentIds: '$sessions.studentID' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$_id', '$$studentIds'],
                },
              },
            },
            {
              $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
              },
            },
          ],
          as: 'studentDetails',
        },
      },

      // Build stats + session rows + unique student list
      {
        $addFields: {
          avgRating: {
            $cond: [
              { $gt: [{ $size: '$feedbacks' }, 0] },
              { $avg: '$feedbacks.rating' },
              0,
            ],
          },

          totalRatings: { $size: '$feedbacks' },
          totalSessions: { $size: '$sessions' },

          completedSessions: {
            $size: {
              $filter: {
                input: '$sessions',
                as: 'session',
                cond: { $eq: ['$$session.status', 'Completed'] },
              },
            },
          },

          cancelledSessions: {
            $size: {
              $filter: {
                input: '$sessions',
                as: 'session',
                cond: { $eq: ['$$session.status', 'Cancelled'] },
              },
            },
          },

          studentsTutored: {
            $size: {
              $setUnion: [
                [],
                {
                  $map: {
                    input: '$sessions',
                    as: 'session',
                    in: '$$session.studentID',
                  },
                },
              ],
            },
          },

          sessionHistory: {
            $map: {
              input: {
                $sortArray: {
                  input: '$sessions',
                  sortBy: { sessionTime: -1 },
                },
              },
              as: 'session',
              in: {
                $let: {
                  vars: {
                    matchedStudent: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$studentDetails',
                            as: 'student',
                            cond: {
                              $eq: ['$$student._id', '$$session.studentID'],
                            },
                          },
                        },
                        0,
                      ],
                    },
                    matchedAttendance: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$attendances',
                            as: 'att',
                            cond: {
                              $eq: ['$$att.sessionID', '$$session._id'],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: {
                    _id: '$$session._id',
                    studentID: '$$session.studentID',
                    studentName: {
                      $cond: [
                        { $ifNull: ['$$matchedStudent', false] },
                        {
                          $concat: [
                            '$$matchedStudent.firstName',
                            ' ',
                            '$$matchedStudent.lastName',
                          ],
                        },
                        'Unknown Student',
                      ],
                    },
                    studentEmail: {
                      $ifNull: ['$$matchedStudent.email', ''],
                    },
                    sessionTime: '$$session.sessionTime',
                    duration: '$$session.duration',
                    status: '$$session.status',

                    // attendance fields
                    checkInTime: {
                      $ifNull: ['$$matchedAttendance.checkInTime', null],
                    },
                    checkOutTime: {
                      $ifNull: ['$$matchedAttendance.checkOutTime', null],
                    },
                    checkInStatus: {
                      $ifNull: ['$$matchedAttendance.checkInStatus', 'N/A'],
                    },
                    checkOutStatus: {
                      $ifNull: ['$$matchedAttendance.checkOutStatus', 'N/A'],
                    },
                    wasNoShow: {
                      $ifNull: ['$$matchedAttendance.wasNoShow', false],
                    },
                  },
                },
              },
            },
          },

          studentList: {
            $map: {
              input: '$studentDetails',
              as: 'student',
              in: {
                _id: '$$student._id',
                firstName: '$$student.firstName',
                lastName: '$$student.lastName',
                fullName: {
                  $concat: ['$$student.firstName', ' ', '$$student.lastName'],
                },
                email: '$$student.email',
              },
            },
          },
        },
      },

      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          phone: 1,
          rating: {
            $round: ['$avgRating', 1],
          },

          profile: {
            major: { $ifNull: ['$profile.major', 'Not Specified'] },
            currentYear: { $ifNull: ['$profile.currentYear', 'Not Specified'] },
            bio: { $ifNull: ['$profile.bio', ''] },
            profilePicture: '$profile.profilePicture',
          },

          stats: {
            totalSessions: '$totalSessions',
            completedSessions: '$completedSessions',
            cancelledSessions: '$cancelledSessions',
            studentsTutored: '$studentsTutored',
            totalRatings: '$totalRatings',
          },

          students: '$studentList',
          sessions: '$sessionHistory',
        },
      },
    ]);

    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    return res.status(200).json(result[0]);
  } catch (err) {
    console.error('Error fetching tutor details:', err);
    return res.status(500).json({
      message: 'Failed to fetch tutor details',
      error: err.message,
    });
  }
});


// NEW ROUTE: Fetch a single user by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('Fetching user with ID:', userId);

    const user = await User.findById(userId);

    if (!user) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Added way to fetch a user's major for Student Reports and Tutor Reports
    if (user.role === 'Student') {
      const studentProfile = await mongoose.model('StudentProfile').findOne({ userId: user._id }).select('major');
      if (studentProfile) {
        user._doc.major = studentProfile.major;
      }
    }

    else if (user.role === "Tutor") {
      const tutorProfile = await mongoose.model('TutorProfile').findOne({ userId: user._id }).select('major');
      if (tutorProfile) {
        user._doc.major = tutorProfile.major;
      }
    }

    console.log('User found:', user.firstName, user.lastName);
    res.status(200).json(user);
  } catch (err) {
    console.error('Error fetching user by ID:', err);
    res
      .status(500)
      .json({ message: 'Failed to fetch user', error: err.message });
  }
});

module.exports = router;