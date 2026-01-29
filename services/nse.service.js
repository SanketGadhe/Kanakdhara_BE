const axios = require("axios");
const { headers } = require("../utils/nseHeaders");

/* ===== Retry Configuration ===== */
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const nse = axios.create({
    baseURL: "https://www.nseindia.com",
    timeout: 15000,
    headers: {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://www.nseindia.com/",
        "Connection": "keep-alive",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
    },
    withCredentials: true,
});

/* ===== Retry Helper ===== */
const fetchWithRetry = async (url, config = {}, retryCount = 0) => {
    try {
        return await nse.get(url, config);
    } catch (error) {
        if ((error.response?.status === 403 || error.response?.status === 429) && retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAY * Math.pow(2, retryCount);
            console.warn(`NSE ${url} returned ${error.response.status}, retrying in ${delay}ms...`);
            await sleep(delay);
            return fetchWithRetry(url, config, retryCount + 1);
        }
        throw error;
    }
};

/**
 * FII / DII DATA
 */
exports.getFIIDII = async () => {
    const res = await fetchWithRetry("/api/fiidiiTradeReact");

    const fii = res.data.find(d => d.category === "FII/FPI");
    const dii = res.data.find(d => d.category === "DII");

    return {
        date: fii.date,
        fii: {
            buy: Number(fii.buyValue),
            sell: Number(fii.sellValue),
            net: Number(fii.netValue)
        },
        dii: {
            buy: Number(dii.buyValue),
            sell: Number(dii.sellValue),
            net: Number(dii.netValue)
        }
    };
};

/**
 * INDIA VIX
 */
exports.getVIX = async () => {
    const res = await fetchWithRetry("/api/allIndices");
    const vix = res.data.data.find(i => i.indexSymbol === "INDIA VIX");
    return Number(vix.last);
};

/**
 * NIFTY DIRECTION (Proxy for Breadth)
 */
exports.getMarketDirection = async () => {
    const res = await fetchWithRetry("/api/marketStatus");
    const nifty = res.data.marketState.find(
        m => m.index === "NIFTY 50"
    );

    return {
        last: nifty.last,
        change: nifty.variation,
        percentChange: nifty.percentChange
    };
};

exports.getMarketForNifty = async (value) => {
    const res = await fetchWithRetry("/api/equity-stockIndices", {
        params: { index: value },
    });
    return {
        last: res.data.metadata.last,
        change: res.data.metadata.change,
        index: value,
        percentChange: res.data.metadata.percChange
    }
}
