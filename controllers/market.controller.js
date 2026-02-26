const {
    getFIIDII,
    getVIX,
    getMarketDirection
} = require("../services/nse.service");

const {
    calculateMMI,
    getMMIZone,
    getMMISeries
} = require("../services/mmi.service");

const { getFIISeries } = require("../services/fiiSeries.service");

/**
 * DASHBOARD API
 */
exports.getDashboard = async (req, res) => {
    try {
        const [flow, vix, market] = await Promise.all([
            getFIIDII(),
            getVIX(),
            getMarketDirection()
        ]);

        const mmi = calculateMMI({
            fiiNet: flow.fii.net,
            vix,
            niftyChange: market.percentChange
        });

        res.json({
            fiiActivity: {
                date: flow.date,
                current: flow.fii.net >= 0 ? "Net Buy" : "Net Sell",
                value: flow.fii.net
            },
            volatility: vix,
            marketDirection:
                market.percentChange > 0 ? "Positive" : "Negative",
            riskAppetite:
                vix < 15 && flow.fii.net > 0 ? "High" : "Moderate",
            mmi: {
                value: mmi,
                zone: getMMIZone(mmi)
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
        const data = await getFIISeries(days);
        res.json({ data });
    } catch (e) {
        console.error("FII series failed:", e);
        res.status(500).json({ error: "FII series failed" });
    }
};