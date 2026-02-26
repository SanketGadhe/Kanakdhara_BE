const { nseGet } = require("./nseClient");

exports.getFIISeries = async (days = 30) => {
    const res = await nseGet("/api/fiidiiTradeReact");

    return res.data
        .filter(d => d.category === "FII/FPI")
        .slice(0, days)
        .map(d => ({
            date: d.date,
            value: Number(d.netValue)
        }))
        .reverse();
};
