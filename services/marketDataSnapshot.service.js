const MarketDataSnapshot = require("../models/MarketDataSnapshot.model");
const { nseGet } = require("./nseClient");
const { getMMIZone } = require("./mmi.service");

const INDIA_TIME_ZONE = "Asia/Kolkata";
const FAILED_REFRESH_COOLDOWN_MS = 15 * 60 * 1000;

const INDEX_LIST = [
    "NIFTY 50",
    "NIFTY NEXT 50",
    "NIFTY 100",
    "NIFTY MIDCAP 250",
    "NIFTY SMALLCAP 250",
    "NIFTY MICROCAP 250",
    "NIFTY 500",
    "NIFTY MID SMALLCAP 400",
    "NIFTY BANK",
    "NIFTY IT",
    "NIFTY FMCG",
    "NIFTY AUTO",
    "NIFTY PHARMA",
    "NIFTY REALTY",
    "NIFTY METAL",
    "NIFTY ENERGY",
    "NIFTY PSU BANK",
    "NIFTY MEDIA",
    "NIFTY PRIVATE BANK",
    "NIFTY CONSUMPTION",
    "NIFTY INFRASTRUCTURE",
    "NIFTY COMMODITIES",
];

let memorySnapshot = null;
let refreshPromise = null;
let lastFailedRefreshAt = 0;

const toFiniteNumber = (value, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
};

const round = (value, digits = 2) =>
    Number(toFiniteNumber(value).toFixed(digits));

const getIndiaDateKey = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: INDIA_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
};

const getIndexName = (item) => String(item?.index ?? item?.indexSymbol ?? "").trim();

const createIndexMap = (items) => new Map(
    (Array.isArray(items) ? items : [])
        .filter((item) => getIndexName(item))
        .map((item) => [getIndexName(item).toUpperCase(), item])
);

const getIndex = (indexMap, name) => indexMap.get(name.toUpperCase());

const getChange = (item) => {
    const explicitChange = Number(item?.variation ?? item?.change);
    if (Number.isFinite(explicitChange)) return explicitChange;
    return toFiniteNumber(item?.last) - toFiniteNumber(item?.previousClose);
};

const getPercentChange = (item) => {
    const explicitPercent = Number(item?.percentChange ?? item?.percChange ?? item?.pChange);
    if (Number.isFinite(explicitPercent)) return explicitPercent;

    const previousClose = toFiniteNumber(item?.previousClose);
    return previousClose ? (getChange(item) / previousClose) * 100 : 0;
};

const buildBreadth = (advance = {}) => {
    const advances = toFiniteNumber(advance.advances);
    const declines = toFiniteNumber(advance.declines);
    const unchanged = toFiniteNumber(advance.unchanged);
    const ratio = declines > 0 ? round(advances / declines) : null;

    let status = "Unavailable";
    if (ratio !== null) {
        status = ratio >= 1.5 ? "Bullish" : ratio < 1 ? "Bearish" : "Neutral";
    }

    return { advances, declines, unchanged, ratio, status };
};

const classifyTrend = (percentChange) => {
    if (percentChange > 0.3) return "Positive";
    if (percentChange < -0.3) return "Negative";
    return "Neutral";
};

const interpretVIX = (vix) => {
    if (vix < 12) return { label: "Complacent/Stable", risk: "Low" };
    if (vix < 18) return { label: "Normal", risk: "Moderate" };
    return { label: "Elevated", risk: "High" };
};

const calculateSentimentScore = ({ niftyChange, breadthRatio, vix }) => {
    let score = 50;
    if (niftyChange > 0) score += 10;
    if (niftyChange < 0) score -= 10;
    if (breadthRatio !== null && breadthRatio >= 1.5) score += 15;
    else if (breadthRatio !== null && breadthRatio < 1) score -= 15;
    if (vix < 12) score += 10;
    if (vix > 20) score -= 15;
    return Math.max(0, Math.min(100, score));
};

const buildIndexSummary = (item, fallbackName) => ({
    index: getIndexName(item) || fallbackName,
    last: toFiniteNumber(item?.last),
    change: round(getChange(item)),
    percentChange: round(getPercentChange(item)),
});

const buildFlowData = (rows) => {
    const data = Array.isArray(rows) ? rows : [];
    const fii = data.find((item) => item.category === "FII/FPI");
    const dii = data.find((item) => item.category === "DII");
    if (!fii || !dii) return null;

    return {
        date: fii.date,
        fii: {
            buy: toFiniteNumber(fii.buyValue),
            sell: toFiniteNumber(fii.sellValue),
            net: toFiniteNumber(fii.netValue),
        },
        dii: {
            buy: toFiniteNumber(dii.buyValue),
            sell: toFiniteNumber(dii.sellValue),
            net: toFiniteNumber(dii.netValue),
        },
    };
};

const buildSnapshotPayload = ({
    allIndicesData,
    marketStatusData = {},
    nifty50Data = {},
    fiiDiiData = [],
    previousSnapshot = null,
    fetchedAt = new Date(),
}) => {
    const indexMap = createIndexMap(allIndicesData);
    const nifty50Index = getIndex(indexMap, "NIFTY 50");
    const vixIndex = getIndex(indexMap, "INDIA VIX");

    if (!nifty50Index || !vixIndex) {
        throw new Error("NSE allIndices response is missing NIFTY 50 or INDIA VIX");
    }

    const marketStates = Array.isArray(marketStatusData.marketState)
        ? marketStatusData.marketState
        : [];
    const niftyMarketState = marketStates.find(
        (item) => String(item.index).toUpperCase() === "NIFTY 50"
    ) || marketStates[0] || {};
    const marketStatus = niftyMarketState.marketStatus || "UNKNOWN";
    const isLive = String(marketStatus).toLowerCase() === "open";
    const fetchedTimestamp = fetchedAt.getTime();

    const indices = INDEX_LIST.map((name) => {
        const item = getIndex(indexMap, name);
        if (!item) return null;

        const last = toFiniteNumber(item.last);
        return {
            id: name,
            symbol: name,
            name: getIndexName(item) || name,
            price: last,
            changeValue: round(getChange(item)),
            changePercent: round(getPercentChange(item)),
            category: "INDEX",
            isLive,
            range52: {
                high: toFiniteNumber(item.yearHigh),
                low: toFiniteNumber(item.yearLow),
            },
            perChange30d: round(item.perChange30d),
            perChange365d: round(item.perChange365d),
            timestamp: fetchedTimestamp,
        };
    }).filter(Boolean);

    const currentStocks = Array.isArray(nifty50Data.data) ? nifty50Data.data : [];
    const stocks = currentStocks.length
        ? currentStocks
        : previousSnapshot?.ticker?.stocks || [];
    const currentBreadth = buildBreadth(nifty50Data.advance);
    const previousBreadth = previousSnapshot?.intelligence
        ?.api_source_data?.nifty_50_summary?.market_breadth;
    const breadth = currentBreadth.status !== "Unavailable"
        ? currentBreadth
        : previousBreadth || currentBreadth;

    const nifty50 = buildIndexSummary(nifty50Index, "NIFTY 50");
    const nifty500 = buildIndexSummary(getIndex(indexMap, "NIFTY 500"), "NIFTY 500");
    const niftyBank = buildIndexSummary(getIndex(indexMap, "NIFTY BANK"), "NIFTY BANK");
    const niftyIT = buildIndexSummary(getIndex(indexMap, "NIFTY IT"), "NIFTY IT");
    const vix = toFiniteNumber(vixIndex.last);
    const sentimentScore = calculateSentimentScore({
        niftyChange: nifty50.percentChange,
        breadthRatio: breadth.ratio,
        vix,
    });
    const vixInsight = interpretVIX(vix);

    const intelligence = {
        api_source_data: {
            market_status: {
                status: marketStatus,
                trade_date: niftyMarketState.tradeDate || niftyMarketState.tradeDateTime || null,
            },
            nifty_50_summary: {
                index: nifty50.index,
                last_price: nifty50.last,
                change: nifty50.change,
                pChange: nifty50.percentChange,
                market_breadth: breadth,
            },
            nifty_500_summary: nifty500,
            nifty_bank_summary: niftyBank,
            nifty_it_summary: niftyIT,
        },
        market_mood_indicator: {
            sentiment_score: sentimentScore,
            sentiment_label: getMMIZone(sentimentScore),
            risk_level: vixInsight.risk,
            primary_signal: sentimentScore >= 60
                ? "Consider profit booking & be cautious"
                : "Markets are suitable for new investments",
            analysis_factors: {
                trend_strength: {
                    status: classifyTrend(nifty50.percentChange),
                    value: nifty50.percentChange,
                    reason: `NIFTY moved ${nifty50.percentChange}% today.`,
                },
                market_breadth: {
                    status: breadth.status,
                    value: breadth.ratio,
                    reason: breadth.status !== "Unavailable"
                        ? `Advance/Decline ratio is ${breadth.ratio}, indicating ${breadth.status.toLowerCase()} participation in NIFTY 50.`
                        : "Breadth data unavailable from NSE.",
                },
                volatility_vix: {
                    status: vixInsight.label,
                    value: vix,
                    reason: `VIX at ${vix} suggests ${vixInsight.risk.toLowerCase()} risk.`,
                },
            },
            investment_action: sentimentScore >= 60
                ? "Accumulate Quality Stocks / Hold"
                : "Stay Defensive / Protect Capital",
        },
    };

    const flow = buildFlowData(fiiDiiData) || previousSnapshot?.dashboard?.flow || null;
    const previousFiiSeries = Array.isArray(previousSnapshot?.fiiSeries)
        ? previousSnapshot.fiiSeries
        : [];
    const fiiSeries = flow
        ? [
            ...previousFiiSeries.filter((item) => item.date !== flow.date),
            { date: flow.date, value: flow.fii.net },
        ].slice(-365)
        : previousFiiSeries;

    return {
        ticker: {
            marketStatus,
            indices,
            stocks,
            advanceDecline: { "NIFTY 50": breadth },
            timestamp: fetchedTimestamp,
        },
        intelligence,
        dashboard: {
            flow,
            vix,
            market: {
                last: nifty50.last,
                change: nifty50.change,
                percentChange: nifty50.percentChange,
            },
        },
        fiiSeries,
    };
};

const optionalNseRequest = async (path, config, label) => {
    try {
        return await nseGet(path, config);
    } catch (error) {
        console.warn(`[Market Data] ${label} unavailable; using cached partial data:`, error.message);
        return null;
    }
};

const fetchFreshSnapshot = async (previousSnapshot) => {
    // Keep requests sequential. NSE is more likely to block bursts from one server IP.
    const allIndicesResponse = await nseGet("/api/allIndices");
    const marketStatusResponse = await optionalNseRequest(
        "/api/marketStatus",
        {},
        "market status"
    );
    const nifty50Response = await optionalNseRequest(
        "/api/equity-stockIndices",
        { params: { index: "NIFTY 50" } },
        "NIFTY 50 constituents"
    );
    const fiiDiiResponse = await optionalNseRequest(
        "/api/fiidiiTradeReact",
        {},
        "FII/DII data"
    );
    const fetchedAt = new Date();
    const payload = buildSnapshotPayload({
        allIndicesData: allIndicesResponse.data?.data,
        marketStatusData: marketStatusResponse?.data,
        nifty50Data: nifty50Response?.data,
        fiiDiiData: fiiDiiResponse?.data,
        previousSnapshot,
        fetchedAt,
    });

    const snapshot = {
        snapshotDate: getIndiaDateKey(fetchedAt),
        fetchedAt,
        ...payload,
    };

    try {
        await MarketDataSnapshot.findOneAndUpdate(
            { snapshotDate: snapshot.snapshotDate },
            snapshot,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    } catch (error) {
        // Fresh data is still useful for this process even if persistence has a temporary issue.
        console.error("[Market Data] Failed to persist daily snapshot:", error.message);
    }

    memorySnapshot = snapshot;
    lastFailedRefreshAt = 0;
    return snapshot;
};

const findLatestSnapshot = async () => {
    try {
        const stored = await MarketDataSnapshot.findOne().sort({ fetchedAt: -1 }).lean();
        if (stored) memorySnapshot = stored;
        return stored || memorySnapshot;
    } catch (error) {
        console.error("[Market Data] Failed to read snapshot cache:", error.message);
        return memorySnapshot;
    }
};

const withCacheMetadata = (snapshot, stale) => ({
    ...snapshot,
    stale,
    source: "NSE daily snapshot",
});

const getMarketDataSnapshot = async ({ forceRefresh = false } = {}) => {
    const today = getIndiaDateKey();

    if (!forceRefresh && memorySnapshot?.snapshotDate === today) {
        return withCacheMetadata(memorySnapshot, false);
    }

    const latestSnapshot = await findLatestSnapshot();
    if (!forceRefresh && latestSnapshot?.snapshotDate === today) {
        return withCacheMetadata(latestSnapshot, false);
    }

    if (
        !forceRefresh &&
        latestSnapshot &&
        Date.now() - lastFailedRefreshAt < FAILED_REFRESH_COOLDOWN_MS
    ) {
        return withCacheMetadata(latestSnapshot, true);
    }

    if (!refreshPromise) {
        refreshPromise = fetchFreshSnapshot(latestSnapshot)
            .catch((error) => {
                lastFailedRefreshAt = Date.now();
                throw error;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }

    try {
        const freshSnapshot = await refreshPromise;
        return withCacheMetadata(freshSnapshot, false);
    } catch (error) {
        if (latestSnapshot) {
            console.warn("[Market Data] NSE refresh failed; serving last snapshot:", error.message);
            return withCacheMetadata(latestSnapshot, true);
        }
        throw error;
    }
};

module.exports = {
    buildSnapshotPayload,
    getIndiaDateKey,
    getMarketDataSnapshot,
};
