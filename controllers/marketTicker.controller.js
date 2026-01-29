const axios = require("axios");

const NSE_BASE = "https://www.nseindia.com";

/* ---------------- Axios Instance with Anti-Bot Headers ---------------- */

const axiosNSE = axios.create({
    baseURL: NSE_BASE,
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

/* ---------------- Retry Configuration ---------------- */
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/* ---------------- Cache ---------------- */

let cachedResponse = null;
let lastFetched = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

/* ---------------- Retry Helper with Exponential Backoff ---------------- */

const fetchWithRetry = async (url, config = {}, retryCount = 0) => {
    try {
        return await axiosNSE.get(url, config);
    } catch (error) {
        // Don't retry on 403/429 immediately, wait longer
        if ((error.response?.status === 403 || error.response?.status === 429) && retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff: 1s, 2s, 4s
            console.warn(`NSE returned ${error.response.status}, retrying after ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
            await sleep(delay);
            return fetchWithRetry(url, config, retryCount + 1);
        }
        throw error;
    }
};

/* ---------------- Helpers ---------------- */

const calcChangePercent = (last, prev) => {
    if (!prev || prev === 0) return 0;
    return ((last - prev) / prev) * 100;
};

/* ---------------- Controller ---------------- */

const getMarketTicker = async (req, res) => {
    try {
        /* ---------- Serve cache ---------- */
        if (cachedResponse && Date.now() - lastFetched < CACHE_TTL) {
            console.log("📦 Serving from cache");
            return res.json(cachedResponse);
        }

        console.log("🔄 Fetching fresh data from NSE...");

        /* ---------- Warm up NSE cookies ---------- */
        try {
            await fetchWithRetry("/");
            console.log("✓ NSE warmup successful");
        } catch (err) {
            console.warn("⚠️ Warmup failed (non-critical):", err.message);
        }

        /* ---------- API calls with retry ---------- */
        console.log("📡 Making parallel requests to NSE endpoints...");
        const [
            allIndicesRes,
            marketStatusRes,
            nifty50StocksRes
        ] = await Promise.all([
            fetchWithRetry("/api/allIndices"),
            fetchWithRetry("/api/marketStatus"),
            fetchWithRetry("/api/equity-stockIndices", {
                params: { index: "NIFTY 50" },
            }),
        ]);

        console.log("✓ All NSE endpoints responded successfully");

        /* ---------- Market status ---------- */
        const marketState =
            marketStatusRes.data?.marketState?.[0] || {};
        const marketStatus = marketState.marketStatus || "UNKNOWN";

        /* ---------- Build index map ---------- */
        const indicesMap = {};
        allIndicesRes.data?.data?.forEach((i) => {
            indicesMap[i.index] = i;
        });

        /* ---------- Indices you want ---------- */
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

        /* ---------- Normalize indices ---------- */
        const indices = INDEX_LIST.map((key) => {
            const i = indicesMap[key];
            if (!i) return null;

            const last = Number(i.last);
            const prev = Number(i.previousClose);
            const perChange30d = Number(i.perChange30d);
            const perChange365d = Number(i.perChange365d)
            return {
                id: key,
                symbol: key,
                name: i.index,
                price: last,
                changeValue: Number((last - prev).toFixed(2)),
                changePercent: Number(
                    calcChangePercent(last, prev).toFixed(2)
                ),
                category: "INDEX",
                isLive: marketStatus === "Open",
                range52: {
                    high: Number(i.yearHigh),
                    low: Number(i.yearLow),
                },
                perChange30d: Number(perChange30d.toFixed(2)),
                perChange365d: Number(perChange365d.toFixed(2)),
                timestamp: Date.now(),
            };
        }).filter(Boolean);

        /* ---------- STOCKS (EXACT NSE FORMAT) ---------- */
        const stocks = nifty50StocksRes.data?.data || [];

        /* ---------- Advance / Decline ---------- */
        const advanceDecline = {
            "NIFTY 50": nifty50StocksRes.data?.advance || {},
        };

        /* ---------- Final response ---------- */
        const response = {
            marketStatus,
            indices,
            stocks, // 👈 RELIANCE, TCS, INFY, etc. (FULL OBJECT)
            advanceDecline,
            timestamp: Date.now(),
        };

        /* ---------- Cache ---------- */
        cachedResponse = response;
        lastFetched = Date.now();

        console.log("✅ Market Ticker data prepared successfully");
        res.json(response);
    } catch (error) {
        const errorDetails = {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
        };

        console.error("❌ NSE Controller Error:", errorDetails);

        // Specific error messages for debugging
        if (error.response?.status === 403) {
            console.error("🔒 Received 403 Forbidden - NSE may be blocking this IP address");
            console.error("   Potential fixes:");
            console.error("   1. Wait a few minutes and retry");
            console.error("   2. Check if IP is whitelisted in NSE firewall");
            console.error("   3. Try using a different IP or VPN");
        } else if (error.response?.status === 429) {
            console.error("⏱️  Received 429 Too Many Requests - Rate limited");
        } else if (error.code === 'ECONNABORTED') {
            console.error("⏱️  Request timeout - NSE server slow or unreachable");
        }

        res.status(500).json({
            error: "Failed to fetch NSE market data",
            details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
        });
    }
};

module.exports = {
    getMarketTicker,
};