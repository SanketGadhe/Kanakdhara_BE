const express = require('express');
const router = express.Router();
const { submitJobApplication } = require('../controllers/jobApplication.controller');

// Submit job application
router.post('/submit', submitJobApplication);

module.exports = router;