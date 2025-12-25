const axios = require("axios");
const { headers } = require("../utils/nseHeaders");

const nse = axios.create({
    baseURL: "https://www.nseindia.com",
    timeout: 10000,
    headers: {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
        Referer: "https://www.nseindia.com",
        Connection: "keep-alive",
    },
    withCredentials: true,
});

/**
 * FII / DII DATA
 */
exports.getFIIDII = async () => {
    const res = await nse.get("/api/fiidiiTradeReact");

    const fii = res.data.find(d => d.category === "FII/FPI");
    const dii = res.data.find(d => d.category === "DII");

    return {
        date: fii.date,
        fii: {
            buy: Number(fii.buyValue),
            sell: Number(fii.sellValue),
            net: Number(fii.netValue)
        },
        dii: {
            buy: Number(dii.buyValue),
            sell: Number(dii.sellValue),
            net: Number(dii.netValue)
        }
    };
};

/**
 * INDIA VIX
 */
exports.getVIX = async () => {
    const res = await nse.get("/api/allIndices");
    const vix = res.data.data.find(i => i.indexSymbol === "INDIA VIX");
    return Number(vix.last);
};

/**
 * NIFTY DIRECTION (Proxy for Breadth)
 */
exports.getMarketDirection = async () => {
    const res = await nse.get("/api/marketStatus");
    const nifty = res.data.marketState.find(
        m => m.index === "NIFTY 50"
    );

    return {
        last: nifty.last,
        change: nifty.variation,
        percentChange: nifty.percentChange
    };
};

exports.getMarketForNifty = async (value) => {
    const res = await nse.get("/api/equity-stockIndices", {
        params: { index: value },
    });
    return {
        last: res.data.metadata.last,
        change: res.data.metadata.change,
        index: value,
        percentChange: res.data.metadata.percChange
    }
}
