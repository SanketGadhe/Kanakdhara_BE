/**
 * Fetch NIFTY 50 Advance / Decline from NSE
 * Source: /api/equity-stockIndices?index=NIFTY 50
 */
const { nseGet } = require("./nseClient");

exports.getNifty50AdvanceDecline = async () => {
    const res = await nseGet("/api/equity-stockIndices", {
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
