const express = require('express');
const router = express.Router();
const { getAvailability, bookSlot } = require('../controllers/calendar.controller');

router.get('/availability', getAvailability);
router.post('/book', bookSlot);

module.exports = router;
