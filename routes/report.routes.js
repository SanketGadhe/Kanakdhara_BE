const express = require('express');
const router = express.Router();
const {
    sendRiskProfileReport,
    sendFinancialHealthReport,
    saveRiskProfileReport,
    emailSavedRiskProfileReport,
    saveFinancialHealthReport,
    emailSavedFinancialHealthReport,
} = require('../controllers/reportMail.controller');
router.post('/risk-profile', sendRiskProfileReport);
router.post('/financial-health', sendFinancialHealthReport);
router.post('/risk-profile/save', saveRiskProfileReport);
router.post('/risk-profile/:reportId/email', emailSavedRiskProfileReport);
router.post('/financial-health/save', saveFinancialHealthReport);
router.post('/financial-health/:reportId/email', emailSavedFinancialHealthReport);
module.exports = router;
