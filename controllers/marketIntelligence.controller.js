const {
    buildMarketIntelligence
} = require("../services/marketIntelligence.service");

exports.getMarketIntelligence = async (req, res) => {
    try {
        const data = await buildMarketIntelligence();
        res.json(data);
    } catch (err) {
        console.error("Market Intelligence API failed", err);
        res.status(500).json({
            error: "Unable to generate market intelligence"
        });
    }
};
