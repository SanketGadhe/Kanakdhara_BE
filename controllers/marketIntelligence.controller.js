const {
    buildMarketIntelligence
} = require("../services/marketIntelligence.service");

exports.getMarketIntelligence = async (req, res) => {
    try {
        // Set response timeout to prevent SIGTERM
        const timeout = setTimeout(() => {
            if (!res.headersSent) {
                res.status(408).json({
                    success: false,
                    error: "Request timeout - market data taking too long to fetch"
                });
            }
        }, 25000); // 25 second timeout

        const data = await buildMarketIntelligence();
        
        clearTimeout(timeout);
        
        if (!res.headersSent) {
            res.json({
                success: true,
                data
            });
        }
    } catch (err) {
        console.error("Market Intelligence API failed", err);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: "Unable to generate market intelligence",
                message: process.env.NODE_ENV === 'development' ? err.message : 'Service temporarily unavailable'
            });
        }
    }
};
