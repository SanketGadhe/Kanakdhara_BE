const {
    calculateMMI,
    getMMIZone,
    getMMISeries
} = require("../services/mmi.service");
const { getMarketDataSnapshot } = require("../services/marketDataSnapshot.service");

/**
 * DASHBOARD API
 */
exports.getDashboard = async (req, res) => {
    try {
        const snapshot = await getMarketDataSnapshot();
        const { flow, vix, market } = snapshot.dashboard;
        const fiiNet = flow?.fii?.net ?? 0;

        const mmi = calculateMMI({
            fiiNet,
            vix,
            niftyChange: market.percentChange
        });

        res.json({
            fiiActivity: {
                date: flow?.date || null,
                current: flow ? (fiiNet >= 0 ? "Net Buy" : "Net Sell") : "Unavailable",
                value: flow ? fiiNet : null
            },
            volatility: vix,
            marketDirection:
                market.percentChange > 0 ? "Positive" : "Negative",
            riskAppetite:
                vix < 15 && fiiNet > 0 ? "High" : "Moderate",
            mmi: {
                value: mmi,
                zone: getMMIZone(mmi)
            },
            cache: {
                dataAsOf: snapshot.fetchedAt,
                snapshotDate: snapshot.snapshotDate,
                stale: snapshot.stale,
                source: snapshot.source
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Market data failed" });
    }
};
exports.getMMITrend = (req, res) => {
    try {
        const range = req.query.range || "1Y";
        const data = getMMISeries(range);
        return res.json({
            range,
            data
        });
    } catch (e) {
        console.error("MMI series failed:", e);
        res.status(500).json({ error: "MMI series failed" });
    }
};
exports.getFIISeries = async (req, res) => {
    try {
        const days = Number(req.query.days || 30);
        const snapshot = await getMarketDataSnapshot();
        const data = (snapshot.fiiSeries || []).slice(-days);
        res.json({
            data,
            cache: {
                dataAsOf: snapshot.fetchedAt,
                snapshotDate: snapshot.snapshotDate,
                stale: snapshot.stale,
                source: snapshot.source
            }
        });
    } catch (e) {
        console.error("FII series failed:", e);
        res.status(500).json({ error: "FII series failed" });
    }
};
