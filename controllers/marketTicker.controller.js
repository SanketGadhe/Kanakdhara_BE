const { nseGet } = require("../services/nseClient");
const { getAllIndicesData } = require("../services/nse.service");

let cachedResponse = null;
let lastFetched = 0;
const CACHE_TTL = 60 * 1000;

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

const toNumber = (value, fallback = null) => {
    const normalized =
        typeof value === "string" ? value.replace(/,/g, "") : value;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : fallback;
};

const roundNumber = (value, decimals = 2) => {
    const number = toNumber(value);
    return number === null ? null : Number(number.toFixed(decimals));
};

const calcChangePercent = (last, prev) => {
    if (!Number.isFinite(last) || !Number.isFinite(prev) || prev === 0) {
        return null;
    }

    return ((last - prev) / prev) * 100;
};

const getStatusCode = (error) => error.response?.status || error.upstreamStatus;

async function fetchMarketStatus() {
    try {
        return await nseGet("/api/marketStatus", { nseMaxRetries: 1 });
    } catch (error) {
        console.warn("NSE marketStatus unavailable:", {
            message: error.message,
            status: getStatusCode(error),
        });
        return null;
    }
}

async function fetchNifty50Stocks() {
    try {
        const res = await nseGet("/api/equity-stockIndices", {
            params: { index: "NIFTY 50" },
            timeout: 8000,
            nseMaxRetries: 0,
        });

        return {
            status: "live",
            stocks: Array.isArray(res.data?.data) ? res.data.data : [],
            advance: res.data?.advance || null,
        };
    } catch (error) {
        console.warn("NSE NIFTY 50 stock list unavailable:", {
            message: error.message,
            status: getStatusCode(error),
        });

        return {
            status: "unavailable",
            stocks: [],
            advance: null,
            errorStatus: getStatusCode(error) || null,
        };
    }
}

function buildAdvanceDecline(indexSnapshot) {
    if (!indexSnapshot) return {};

    return {
        advances: toNumber(indexSnapshot.advances, 0),
        declines: toNumber(indexSnapshot.declines, 0),
        unchanged: toNumber(indexSnapshot.unchanged, 0),
    };
}

function buildStaleResponse() {
    if (!cachedResponse) return null;

    return {
        ...cachedResponse,
        isStale: true,
        dataQuality: "stale",
        timestamp: Date.now(),
        upstream: {
            ...cachedResponse.upstream,
            indices: "stale-cache",
        },
    };
}

const getMarketTicker = async (req, res) => {
    try {
        if (cachedResponse && Date.now() - lastFetched < CACHE_TTL) {
            return res.json(cachedResponse);
        }

        const [allIndices, marketStatusRes, stockResult] = await Promise.all([
            getAllIndicesData(),
            fetchMarketStatus(),
            fetchNifty50Stocks(),
        ]);

        if (!allIndices.length) {
            throw new Error("NSE allIndices returned no index data");
        }

        const marketState =
            marketStatusRes?.data?.marketState?.find(
                (state) => state.index === "NIFTY 50"
            ) ||
            marketStatusRes?.data?.marketState?.[0] ||
            {};
        const marketStatus = marketState.marketStatus || "UNKNOWN";

        const indicesMap = {};
        allIndices.forEach((index) => {
            indicesMap[index.index] = index;
        });

        const indices = INDEX_LIST.map((key) => {
            const index = indicesMap[key];
            if (!index) return null;

            const last = toNumber(index.last);
            const prev = toNumber(index.previousClose);
            const changePercent = calcChangePercent(last, prev);

            return {
                id: key,
                symbol: key,
                name: index.index,
                price: last,
                changeValue:
                    last === null || prev === null
                        ? null
                        : roundNumber(last - prev),
                changePercent: roundNumber(changePercent),
                category: "INDEX",
                isLive: marketStatus === "Open",
                range52: {
                    high: toNumber(index.yearHigh),
                    low: toNumber(index.yearLow),
                },
                perChange30d: roundNumber(index.perChange30d),
                perChange365d: roundNumber(index.perChange365d),
                timestamp: Date.now(),
            };
        }).filter(Boolean);

        const niftyAdvance =
            stockResult.advance || buildAdvanceDecline(indicesMap["NIFTY 50"]);

        const response = {
            marketStatus,
            indices,
            stocks: stockResult.stocks,
            advanceDecline: {
                "NIFTY 50": niftyAdvance,
            },
            timestamp: Date.now(),
            dataQuality: stockResult.status === "live" ? "live" : "partial",
            upstream: {
                indices: "live",
                marketStatus: marketStatusRes ? "live" : "unavailable",
                stocks: stockResult.status,
                stockErrorStatus: stockResult.errorStatus,
            },
        };

        cachedResponse = response;
        lastFetched = Date.now();

        return res.json(response);
    } catch (error) {
        console.error("NSE Controller Error:", {
            message: error.message,
            status: getStatusCode(error),
            statusText: error.response?.statusText,
        });

        const staleResponse = buildStaleResponse();
        if (staleResponse) {
            return res.json(staleResponse);
        }

        return res.status(200).json({
            marketStatus: "UNAVAILABLE",
            indices: [],
            stocks: [],
            advanceDecline: {},
            timestamp: Date.now(),
            dataQuality: "unavailable",
            upstream: {
                indices: "unavailable",
                marketStatus: "unavailable",
                stocks: "unavailable",
            },
            error: "Market data temporarily unavailable",
        });
    }
};

module.exports = {
    getMarketTicker,
};
