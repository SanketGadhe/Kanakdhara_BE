const { getMarketDataSnapshot } = require("./marketDataSnapshot.service");

const buildMarketIntelligence = async () => {
    const snapshot = await getMarketDataSnapshot();

    return {
        ...snapshot.intelligence,
        cache: {
            dataAsOf: snapshot.fetchedAt,
            snapshotDate: snapshot.snapshotDate,
            stale: snapshot.stale,
            source: snapshot.source,
        },
    };
};

module.exports = { buildMarketIntelligence };
