const {
    getVIX,
    getMarketDirection,
    getMarketForNifty
} = require("./nse.service");
const axios = require('axios')
const { getNifty50AdvanceDecline } = require("./marketBreadth.service");
const { getMMIZone } = require("./mmi.service");
const axiosNSE = axios.create({
    baseURL: "https://www.nseindia.com/",
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

function classifyTrend(pChange) {
    if (pChange > 0.3) return "Positive";
    if (pChange < -0.3) return "Negative";
    return "Neutral";
}

function interpretVIX(vix) {
    if (vix < 12) return { label: "Complacent/Stable", risk: "Low" };
    if (vix < 18) return { label: "Normal", risk: "Moderate" };
    return { label: "Elevated", risk: "High" };
}

function interpretBreadth(ratio) {
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
    if (niftyChange > 0) score += 10;
    if (niftyChange < 0) score -= 10;

    // Breadth contribution
    if (breadthRatio >= 1.5) score += 15;
    else if (breadthRatio < 1) score -= 15;

    // Volatility contribution
    if (vix < 12) score += 10;
    if (vix > 20) score -= 15;

    return Math.max(0, Math.min(100, score));
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
        // Add timeout wrapper for all external API calls
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Market intelligence timeout')), 20000);
        });

        const marketDataPromise = Promise.all([
            getVIX(),
            getMarketDirection(),
            getMarketForNifty("NIFTY 500"),
            getMarketForNifty("NIFTY BANK"),
            getMarketForNifty("NIFTY IT"),
            getNifty50AdvanceDecline()
        ]);

        const [vix, market, nifty_500_summary, nifty_bank_summary, niftyIT, breadth] = 
            await Promise.race([marketDataPromise, timeoutPromise]);

        const sentimentScore = calculateSentimentScore({
            niftyChange: market.percentChange,
            breadthRatio: breadth.ratio,
            vix,
        });

        const vixInsight = interpretVIX(vix);

        return {
            api_source_data: {
                market_status: {
                    status: "Closed",
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
                        reason: `NIFTY moved ${market.percentChange}% today.`,
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
                        reason: `VIX at ${vix} suggests ${vixInsight.risk.toLowerCase()} risk.`,
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