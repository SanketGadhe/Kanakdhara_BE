const express = require('express');
const { sendGoalReport } = require('../controllers/goalReportMail.controller');
const router = express.Router();
router.post('/goal', sendGoalReport);
module.exports = router;