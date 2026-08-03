const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Session = require('../models/Session');
const Feedback = require('../models/Feedback');
const TutorProfile = require('../models/TutorProfile');
const StudentProfile = require('../models/StudentProfile');
const mongoose = require('mongoose');

router.get("/studentheatmap", async(req, red) => {
    const heatMap = await attendances.aggregate([
        {
            //checks if for no show before retrieving data
            $match: {
                wasNoShow: false
            }
        },
        {
            $group: {
                _id: {
                    day: {
                        $isaDayOfWeek: "$checkinTime"
                    },

                    hour: {
                        $hour: "checkInTime"
                    },
                    count: {
                        $sum: 1
                    }
                }
            }
        },
        {
            $sort: {
                "_id.day":1,
                "_id.hour": 1
            }
        }
    ])
})

module.exports = router;