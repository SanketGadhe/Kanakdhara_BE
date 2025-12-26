const MarketMoodIndicator = require('../models/MarketMoodIndicator');
const { buildMarketIntelligence } = require('../services/marketIntelligence.service');

exports.storeDailyMarketMood = async () => {
    try {
        const today = new Date().toISOString().slice(0, 10);

        // Check if today's data already exists
        const existing = await MarketMoodIndicator.findOne({ date: today });
        if (existing) {
            return existing;
        }

        // Get market intelligence data
        const marketData = await buildMarketIntelligence();
        const moodData = marketData.market_mood_indicator;
        const niftyData = marketData.api_source_data.nifty_50_summary;

        // Store in database
        const newRecord = new MarketMoodIndicator({
            date: today,
            sentiment_score: moodData.sentiment_score,
            sentiment_label: moodData.sentiment_label,
            risk_level: moodData.risk_level,
            primary_signal: moodData.primary_signal,
            investment_action: moodData.investment_action,
            nifty_change: niftyData.pChange,
            vix_value: moodData.analysis_factors.volatility_vix.value,
            breadth_ratio: niftyData.market_breadth.ratio,
            trend_strength: moodData.analysis_factors.trend_strength.status
        });

        await newRecord.save();
        return newRecord;
    } catch (error) {
        console.error('Error storing daily market mood:', error);
        throw error;
    }
};

exports.getMarketMoodHistory = async (req, res) => {
    try {
        const { range = '1M' } = req.query;

        const daysMap = {
            '1M': 30,
            '3M': 90,
            '6M': 180,
            '1Y': 365,
            '5Y': 1825
        };

        const days = daysMap[range] || 365;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const history = await MarketMoodIndicator.find({
            date: { $gte: cutoffDate.toISOString().slice(0, 10) }
        }).sort({ date: 1 });

        res.json({
            success: true,
            data: history,
            range,
            count: history.length
        });
    } catch (error) {
        console.error('Error fetching market mood history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch market mood history',
            error: error.message
        });
    }
};

exports.getTodayMarketMood = async (req, res) => {
    try {
        // Set response timeout to prevent SIGTERM
        const timeout = setTimeout(() => {
            if (!res.headersSent) {
                res.status(408).json({
                    success: false,
                    message: "Request timeout - market mood data taking too long to fetch"
                });
            }
        }, 25000); // 25 second timeout

        const today = new Date().toISOString().slice(0, 10);

        // Check if today's date data exists in history
        let todayData = await MarketMoodIndicator.findOne({ date: today });

        if (!todayData) {
            todayData = await exports.storeDailyMarketMood();
        }

        clearTimeout(timeout);

        if (!res.headersSent) {
            res.json({
                success: true,
                data: todayData
            });
        }
    } catch (error) {
        console.error('Error fetching today market mood:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch today market mood',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable'
            });
        }
    }
};