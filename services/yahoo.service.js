const axios = require("axios");

async function getSeries(symbol, range) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=1d`;
    const res = await axios.get(url);
    return res.data.chart.result[0].indicators.quote[0].close;
}

exports.getNiftyPrices = range => getSeries("%5ENSEI", range);
exports.getGoldPrices = range => getSeries("MCX:GOLD", range);
