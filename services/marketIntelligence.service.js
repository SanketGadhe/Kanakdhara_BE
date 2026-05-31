const {
    getVIX,
    getMarketDirection,
    getMarketForNifty
} = require("./nse.service");
const { getNifty50AdvanceDecline } = require("./marketBreadth.service");
const { getMMIZone } = require("./mmi.service");

function classifyTrend(pChange) {
    if (!Number.isFinite(pChange)) return "Unavailable";
    if (pChange > 0.3) return "Positive";
    if (pChange < -0.3) return "Negative";
    return "Neutral";
}

function interpretVIX(vix) {
    if (!Number.isFinite(vix)) {
        return { label: "Unavailable", risk: "Unknown" };
    }

    if (vix < 12) return { label: "Complacent/Stable", risk: "Low" };
    if (vix < 18) return { label: "Normal", risk: "Moderate" };
    return { label: "Elevated", risk: "High" };
}

function interpretBreadth(ratio) {
    if (!Number.isFinite(ratio)) return "Unavailable";
    if (ratio >= 1.5) return "Bullish";
    if (ratio >= 1.0) return "Neutral";
    return "Bearish";
}

function calculateSentimentScore({
    niftyChange,
    breadthRatio,
    vix
}) {
    let score = 50;

    // Trend contribution
    if (Number.isFinite(niftyChange) && niftyChange > 0) score += 10;
    if (Number.isFinite(niftyChange) && niftyChange < 0) score -= 10;

    // Breadth contribution
    if (Number.isFinite(breadthRatio) && breadthRatio >= 1.5) score += 15;
    else if (Number.isFinite(breadthRatio) && breadthRatio < 1) score -= 15;

    // Volatility contribution
    if (Number.isFinite(vix) && vix < 12) score += 10;
    if (Number.isFinite(vix) && vix > 20) score -= 15;

    return Math.max(0, Math.min(100, score));
}

function createUnavailableIndexSummary(index) {
    return {
        last: null,
        change: null,
        index,
        percentChange: null,
        tradeDate: null,
        advances: null,
        declines: null,
        unchanged: null,
        marketStatus: "UNAVAILABLE",
    };
}

const UNAVAILABLE_BREADTH = {
    advances: null,
    declines: null,
    unchanged: null,
    ratio: null,
    status: "Unavailable",
};

function getSettledValue(results, index, fallback, label) {
    const result = results[index];

    if (result?.status === "fulfilled") {
        return result.value;
    }

    if (result?.status === "rejected") {
        console.warn(`[Market Intelligence] ${label} unavailable:`, result.reason?.message);
    }

    return fallback;
}

function buildReasonForTrend(percentChange) {
    if (!Number.isFinite(percentChange)) {
        return "NIFTY movement is unavailable from the upstream market data provider.";
    }

    return `NIFTY moved ${percentChange}% today.`;
}

function buildReasonForVIX(vix, risk) {
    if (!Number.isFinite(vix)) {
        return "VIX is unavailable from the upstream market data provider.";
    }

    return `VIX at ${vix} suggests ${risk.toLowerCase()} risk.`;
}
// function AdvanceDeclineNifty() {
//     axiosNSE.get("/api/equity-stockIndices", {
//         params: { index: "NIFTY 50" },
//     }),
// }
// getMMIZone = value => {
//     if (value >= 80) return "Very Bullish";
//     if (value >= 60) return "Bullish";
//     if (value >= 40) return "Neutral";
//     if (value >= 20) return "Euphoric";
//     return "Cautious";
// };

const buildMarketIntelligence = async () => {
    try {
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => resolve({ timedOut: true }), 20000);
        });

        const marketDataPromise = Promise.allSettled([
            getVIX(),
            getMarketDirection(),
            getMarketForNifty("NIFTY 500"),
            getMarketForNifty("NIFTY BANK"),
            getMarketForNifty("NIFTY IT"),
            getNifty50AdvanceDecline()
        ]);

        const results = await Promise.race([marketDataPromise, timeoutPromise]);

        if (results.timedOut) {
            console.warn("[Market Intelligence] Timed out while fetching market data");
        }

        const settledResults = Array.isArray(results) ? results : [];
        const vix = getSettledValue(settledResults, 0, null, "VIX");
        const market = getSettledValue(
            settledResults,
            1,
            createUnavailableIndexSummary("NIFTY 50"),
            "NIFTY 50"
        );
        const nifty_500_summary = getSettledValue(
            settledResults,
            2,
            createUnavailableIndexSummary("NIFTY 500"),
            "NIFTY 500"
        );
        const nifty_bank_summary = getSettledValue(
            settledResults,
            3,
            createUnavailableIndexSummary("NIFTY BANK"),
            "NIFTY BANK"
        );
        const niftyIT = getSettledValue(
            settledResults,
            4,
            createUnavailableIndexSummary("NIFTY IT"),
            "NIFTY IT"
        );
        const breadth = getSettledValue(
            settledResults,
            5,
            UNAVAILABLE_BREADTH,
            "NIFTY 50 breadth"
        );

        const sentimentScore = calculateSentimentScore({
            niftyChange: market.percentChange,
            breadthRatio: breadth.ratio,
            vix,
        });

        const vixInsight = interpretVIX(vix);

        return {
            api_source_data: {
                market_status: {
                    status: market.marketStatus || "UNKNOWN",
                    trade_date: market.tradeDate,
                    market_cap_status: "Normal",
                },

                nifty_50_summary: {
                    index: "NIFTY 50",
                    last_price: market.last,
                    change: market.change,
                    pChange: market.percentChange,
                    market_breadth: {
                        advances: breadth.advances,
                        declines: breadth.declines,
                        unchanged: breadth.unchanged,
                        ratio: breadth.ratio,
                    },
                },
                nifty_500_summary: nifty_500_summary,
                nifty_bank_summary: nifty_bank_summary,
                nifty_it_summary: niftyIT
            },

            market_mood_indicator: {
                sentiment_score: sentimentScore,
                sentiment_label: getMMIZone(sentimentScore),

                risk_level: vixInsight.risk,

                primary_signal:
                    sentimentScore >= 60
                        ? "Consider profit booking & be cautious"
                        : "Market are suitable for new investments",

                analysis_factors: {
                    trend_strength: {
                        status: classifyTrend(market.percentChange),
                        value: market.percentChange,
                        reason: buildReasonForTrend(market.percentChange),
                    },

                    market_breadth: {
                        status: breadth.status,
                        value: breadth.ratio,
                        reason:
                            breadth.status !== "Unavailable"
                                ? `Advance/Decline ratio is ${breadth.ratio}, indicating ${breadth.status.toLowerCase()} participation in NIFTY 50.`
                                : "Breadth data unavailable from NSE.",
                    },

                    volatility_vix: {
                        status: vixInsight.label,
                        value: vix,
                        reason: buildReasonForVIX(vix, vixInsight.risk),
                    },

                },

                investment_action:
                    sentimentScore >= 60
                        ? "Accumulate Quality Stocks / Hold"
                        : "Stay Defensive / Protect Capital",
            },
        };
    } catch (error) {
        console.error('Market intelligence service error:', error);
        throw error;
    }
};

module.exports = {
    buildMarketIntelligence,
};
