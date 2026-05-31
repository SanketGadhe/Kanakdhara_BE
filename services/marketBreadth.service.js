const { getIndexSnapshot } = require("./nse.service");

const toNumber = (value, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
};

exports.getNifty50AdvanceDecline = async () => {
    const nifty50 = await getIndexSnapshot("NIFTY 50");

    const advances = toNumber(nifty50.advances);
    const declines = toNumber(nifty50.declines);
    const unchanged = toNumber(nifty50.unchanged);
    const ratio =
        declines > 0 ? Number((advances / declines).toFixed(2)) : null;

    let status = "Unavailable";
    if (ratio !== null) {
        status = "Neutral";
        if (ratio >= 1.5) status = "Bullish";
        else if (ratio < 1) status = "Bearish";
    }

    return {
        advances,
        declines,
        unchanged,
        ratio,
        status,
    };
};
