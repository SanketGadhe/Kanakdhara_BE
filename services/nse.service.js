const { nseGet } = require("./nseClient");

/**
 * FII / DII DATA
 */
exports.getFIIDII = async () => {
    const res = await nseGet("/api/fiidiiTradeReact");

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
    const res = await nseGet("/api/allIndices");
    const vix = res.data.data.find(i => i.indexSymbol === "INDIA VIX");
    return Number(vix.last);
};

/**
 * NIFTY DIRECTION (Proxy for Breadth)
 */
exports.getMarketDirection = async () => {
    const res = await nseGet("/api/marketStatus");
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
    const res = await nseGet("/api/equity-stockIndices", {
        params: { index: value },
    });
    return {
        last: res.data.metadata.last,
        change: res.data.metadata.change,
        index: value,
        percentChange: res.data.metadata.percChange
    }
}
