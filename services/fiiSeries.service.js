const axios = require("axios");
const { headers } = require("../utils/nseHeaders");

exports.getFIISeries = async (days = 30) => {
    const res = await axios.get(
        "https://www.nseindia.com/api/fiidiiTradeReact",
        { headers }
    );

    return res.data
        .filter(d => d.category === "FII/FPI")
        .slice(0, days)
        .map(d => ({
            date: d.date,
            value: Number(d.netValue)
        }))
        .reverse();
};
