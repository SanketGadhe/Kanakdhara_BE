const {
    buildMarketIntelligence,
} = require("../services/marketIntelligence.service");

const MARKET_INTELLIGENCE_RESPONSE_TIMEOUT_MS = 15000;

exports.getMarketIntelligence = async (req, res) => {
    let timeout;

    try {
        // Set response timeout to prevent SIGTERM
        timeout = setTimeout(() => {
            if (!res.headersSent) {
                res.status(408).json({
                    success: false,
                    error: "Request timeout - market data taking too long to fetch",
                });
            }
        }, MARKET_INTELLIGENCE_RESPONSE_TIMEOUT_MS);

        const data = await buildMarketIntelligence();

        clearTimeout(timeout);
        timeout = null;

        if (!res.headersSent) {
            res.json({
                success: true,
                data,
            });
        }
    } catch (err) {
        if (timeout) clearTimeout(timeout);

        console.error("Market Intelligence API failed", err);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: "Unable to generate market intelligence",
                message:
                    process.env.NODE_ENV === "development"
                        ? err.message
                        : "Service temporarily unavailable",
            });
        }
    }
};
