/**
 * Fetch NIFTY 50 Advance / Decline from NSE
 * Source: /api/equity-stockIndices?index=NIFTY 50
 */
const axios = require("axios")
const axiosNSE = axios.create({
    baseURL: "https://www.nseindia.com",
    timeout: 100000,
    headers: {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
        Referer: "https://www.nseindia.com",
        Connection: "keep-alive",
    },
    withCredentials: true,
});

exports.getNifty50AdvanceDecline = async () => {
    const res = await axiosNSE.get("/api/equity-stockIndices", {
        params: { index: "NIFTY 50" },
    });

    const adv = res.data?.advance;

    if (!adv) {
        return {
            advances: null,
            declines: null,
            unchanged: null,
            ratio: null,
            status: "Unavailable",
        };
    }

    const advances = Number(adv.advances || 0);
    const declines = Number(adv.declines || 0);
    const unchanged = Number(adv.unchanged || 0);

    const ratio =
        declines > 0
            ? Number((advances / declines).toFixed(2))
            : null;

    let status = "Neutral";
    if (ratio >= 1.5) status = "Bullish";
    else if (ratio < 1) status = "Bearish";

    return {
        advances,
        declines,
        unchanged,
        ratio,
        status,
    };
};
