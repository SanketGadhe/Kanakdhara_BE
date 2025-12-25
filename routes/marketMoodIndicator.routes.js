const express = require('express');
const router = express.Router();
const {
    getMarketMoodHistory,
    getTodayMarketMood,
    storeDailyMarketMood
} = require('../controllers/marketMoodIndicator.controller');

// Get historical market mood data for graphs
router.get('/history', getMarketMoodHistory);

// Get today's market mood data
router.get('/today', getTodayMarketMood);

// Manual trigger for storing daily data (for testing)
router.post('/store-daily', async (req, res) => {
    try {
        const result = await storeDailyMarketMood();
        res.json({
            success: true,
            message: 'Daily market mood data stored successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to store daily market mood data',
            error: error.message
        });
    }
});

module.exports = router;