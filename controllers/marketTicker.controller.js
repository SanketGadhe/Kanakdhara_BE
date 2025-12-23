const axios = require("axios");

const NSE_BASE = "https://www.nseindia.com";

/* ---------------- Axios Instance ---------------- */

const axiosNSE = axios.create({
    baseURL: NSE_BASE,
    timeout: 10000,
    headers: {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
        Referer: "https://www.nseindia.com",
        Connection: "keep-alive",
    },
    withCredentials: true,
});

/* ---------------- Cache ---------------- */

let cachedResponse = null;
let lastFetched = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

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
            return res.json(cachedResponse);
        }

        /* ---------- Warm up NSE cookies ---------- */
        await axiosNSE.get("/");

        /* ---------- API calls ---------- */
        const [
            allIndicesRes,
            marketStatusRes,
            nifty50StocksRes
        ] = await Promise.all([
            axiosNSE.get("/api/allIndices"),
            axiosNSE.get("/api/marketStatus"),
            axiosNSE.get("/api/equity-stockIndices", {
                params: { index: "NIFTY 50" },
            }),
        ]);

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

        res.json(response);
    } catch (error) {
        console.error("NSE Controller Error:", error.message);
        res.status(500).json({
            error: "Failed to fetch NSE market data",
        });
    }
};

module.exports = {
    getMarketTicker,
};
