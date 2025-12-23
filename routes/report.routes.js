const express = require('express');
const router = express.Router();
const { sendRiskProfileReport, sendFinancialHealthReport } = require('../controllers/reportMail.controller');
router.post('/risk-profile', sendRiskProfileReport);
router.post('/financial-health', sendFinancialHealthReport);
module.exports = router;