const {
    buildMarketIntelligence
} = require("../services/marketIntelligence.service");

exports.getMarketIntelligence = async (req, res) => {
    let timeout;
    try {
        // Set response timeout to prevent SIGTERM
        timeout = setTimeout(() => {
            if (!res.headersSent) {
                res.status(408).json({
                    success: false,
                    error: "Request timeout - market data taking too long to fetch"
                });
            }
        }, 60000);

        const data = await buildMarketIntelligence();

        clearTimeout(timeout);

        if (!res.headersSent) {
            res.json({
                success: true,
                data
            });
        }
    } catch (err) {
        clearTimeout(timeout);
        console.error("Market Intelligence API failed", err);
        if (!res.headersSent) {
            res.status(503).json({
                success: false,
                error: "Unable to generate market intelligence",
                message: process.env.NODE_ENV === 'development' ? err.message : 'Service temporarily unavailable'
            });
        }
    }
};
