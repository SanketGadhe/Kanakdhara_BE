const { getMarketDataSnapshot } = require("../services/marketDataSnapshot.service");

const getMarketTicker = async (req, res) => {
    try {
        const snapshot = await getMarketDataSnapshot();

        res.set("Cache-Control", "public, max-age=300, stale-if-error=86400");
        return res.json({
            ...snapshot.ticker,
            dataAsOf: snapshot.fetchedAt,
            snapshotDate: snapshot.snapshotDate,
            stale: snapshot.stale,
            source: snapshot.source,
        });
    } catch (error) {
        console.error("Market ticker failed with no cached snapshot:", error.message);
        return res.status(503).json({
            error: "Market data is temporarily unavailable",
            retryAfterSeconds: 900,
        });
    }
};

module.exports = { getMarketTicker };
