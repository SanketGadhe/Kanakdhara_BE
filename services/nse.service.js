const { nseGet } = require("./nseClient");

const ALL_INDICES_CACHE_TTL = 30 * 1000;

let allIndicesCache = null;
let allIndicesFetchedAt = 0;
let allIndicesPromise = null;

const toNumber = (value, fallback = null) => {
    const normalized =
        typeof value === "string" ? value.replace(/,/g, "") : value;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : fallback;
};

const createMissingIndexError = (indexName) => {
    const error = new Error(`NSE index not found: ${indexName}`);
    error.status = 502;
    error.isNSEUpstreamError = true;
    return error;
};

async function getAllIndicesData({ force = false } = {}) {
    if (
        !force &&
        allIndicesCache &&
        Date.now() - allIndicesFetchedAt < ALL_INDICES_CACHE_TTL
    ) {
        return allIndicesCache;
    }

    if (!force && allIndicesPromise) {
        return allIndicesPromise;
    }

    allIndicesPromise = fetchAllIndicesData();

    try {
        return await allIndicesPromise;
    } finally {
        allIndicesPromise = null;
    }
}

async function fetchAllIndicesData() {
    try {
        const res = await nseGet("/api/allIndices");
        const data = res.data?.data;

        if (!Array.isArray(data)) {
            throw new Error("NSE allIndices returned an invalid response");
        }

        allIndicesCache = data;
        allIndicesFetchedAt = Date.now();
        return data;
    } catch (err) {
        if (allIndicesCache) {
            console.warn("[NSE] Using stale allIndices cache:", err.message);
            return allIndicesCache;
        }

        throw err;
    }
}

function findIndexSnapshot(allIndices, indexName) {
    return allIndices.find(
        (item) => item.index === indexName || item.indexSymbol === indexName
    );
}

function normalizeIndexSummary(indexSnapshot, fallbackName) {
    return {
        last: toNumber(indexSnapshot.last, 0),
        change: toNumber(indexSnapshot.variation, 0),
        index: indexSnapshot.index || fallbackName,
        percentChange: toNumber(indexSnapshot.percentChange, 0),
        tradeDate:
            indexSnapshot.previousDay ||
            indexSnapshot.tradeDate ||
            new Date().toISOString().slice(0, 10),
        advances: toNumber(indexSnapshot.advances, null),
        declines: toNumber(indexSnapshot.declines, null),
        unchanged: toNumber(indexSnapshot.unchanged, null),
    };
}

exports.getAllIndicesData = getAllIndicesData;

exports.getIndexSnapshot = async (indexName) => {
    const allIndices = await getAllIndicesData();
    const snapshot = findIndexSnapshot(allIndices, indexName);

    if (!snapshot) {
        throw createMissingIndexError(indexName);
    }

    return snapshot;
};

/**
 * FII / DII DATA
 */
exports.getFIIDII = async () => {
    const res = await nseGet("/api/fiidiiTradeReact");
    const rows = Array.isArray(res.data) ? res.data : [];

    const fii = rows.find((d) => d.category === "FII/FPI");
    const dii = rows.find((d) => d.category === "DII");

    if (!fii || !dii) {
        throw new Error("NSE FII/DII response is missing expected categories");
    }

    return {
        date: fii.date,
        fii: {
            buy: toNumber(fii.buyValue, 0),
            sell: toNumber(fii.sellValue, 0),
            net: toNumber(fii.netValue, 0),
        },
        dii: {
            buy: toNumber(dii.buyValue, 0),
            sell: toNumber(dii.sellValue, 0),
            net: toNumber(dii.netValue, 0),
        },
    };
};

/**
 * INDIA VIX
 */
exports.getVIX = async () => {
    const vix = await exports.getIndexSnapshot("INDIA VIX");
    return toNumber(vix.last, 0);
};

/**
 * NIFTY DIRECTION
 */
exports.getMarketDirection = async () => {
    const nifty = normalizeIndexSummary(
        await exports.getIndexSnapshot("NIFTY 50"),
        "NIFTY 50"
    );

    try {
        const res = await nseGet("/api/marketStatus", { nseMaxRetries: 1 });
        const marketState = res.data?.marketState?.find(
            (state) => state.index === "NIFTY 50"
        );

        return {
            ...nifty,
            last: toNumber(marketState?.last, nifty.last),
            change: toNumber(marketState?.variation, nifty.change),
            percentChange: toNumber(
                marketState?.percentChange,
                nifty.percentChange
            ),
            marketStatus: marketState?.marketStatus || "UNKNOWN",
            tradeDate: marketState?.tradeDate || nifty.tradeDate,
        };
    } catch (err) {
        console.warn("[NSE] marketStatus unavailable, using allIndices:", err.message);
        return {
            ...nifty,
            marketStatus: "UNKNOWN",
        };
    }
};

exports.getMarketForNifty = async (indexName) => {
    const snapshot = await exports.getIndexSnapshot(indexName);
    return normalizeIndexSummary(snapshot, indexName);
};
