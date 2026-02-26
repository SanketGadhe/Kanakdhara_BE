const { getFIIDII } = require("./nse.service");
const { getNiftyPrices } = require("./yahoo.service");
const { getNifty50AdvanceDecline } = require("./marketBreadth.service");

exports.getRawMarketData = async (range = "6mo") => {
    const [fii, nifty, breadth] = await Promise.all([
        getFIIDII(),
        getNiftyPrices(range),
        getNifty50AdvanceDecline()
    ]);

    return { fii, nifty, breadth };
};
