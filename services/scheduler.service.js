const cron = require('node-cron');
const { storeDailyMarketMood } = require('../controllers/marketMoodIndicator.controller');

// Schedule daily market mood data storage
// Runs every day at 6:30 PM IST (after market close)
const scheduleDailyMarketMoodUpdate = () => {
    cron.schedule('30 18 * * 1-5', async () => {
        console.log('Running daily market mood update...');
        try {
            await storeDailyMarketMood();
            console.log('Daily market mood update completed successfully');
        } catch (error) {
            console.error('Daily market mood update failed:', error);
        }
    }, {
        timezone: "Asia/Kolkata"
    });
    
    console.log('Daily market mood scheduler initialized');
};

module.exports = {
    scheduleDailyMarketMoodUpdate
};