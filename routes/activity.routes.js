const { getActivityByID } = require('../controllers/activity.controller')
const express = require('express')
const router = express.Router()
router.get('/getActivity/:activityId/:customerId', getActivityByID)
module.exports = router