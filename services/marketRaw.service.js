const { getFIIData, getMarketBreadth } = require("./nse.service");
const { getNiftyPrices } = require("./yahoo.service");

exports.getRawMarketData = async (range = "6mo") => {
    const [fii, nifty, breadth] = await Promise.all([
        getFIIData(),
        getNiftyPrices(range),
        getMarketBreadth()
    ]);

    return { fii, nifty, breadth };
};
