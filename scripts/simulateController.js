const axios = require("axios");

const NSE_BASE = "https://www.nseindia.com";

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

const calcChangePercent = (last, prev) => {
    if (!prev || prev === 0) return 0;
    return ((last - prev) / prev) * 100;
};

async function simulateMarketTicker() {
    console.log("🧪 Simulating Market Ticker Controller\n");

    try {
        console.log("1️⃣ Warming up NSE cookies...");
        await axiosNSE.get("/");

        console.log("2️⃣ Fetching API data in parallel...");
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

        console.log("✓ All API responses received");

        console.log("\n3️⃣ Processing market status...");
        const marketState =
            marketStatusRes.data?.marketState?.[0] || {};
        const marketStatus = marketState.marketStatus || "UNKNOWN";
        console.log("  Market Status:", marketStatus);

        console.log("\n4️⃣ Building index map...");
        const indicesMap = {};
        allIndicesRes.data?.data?.forEach((i) => {
            indicesMap[i.index] = i;
        });
        console.log("  Indices in map:", Object.keys(indicesMap).length);

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

        console.log("\n5️⃣ Normalizing indices...");
        const indices = INDEX_LIST.map((key) => {
            const i = indicesMap[key];
            if (!i) {
                console.log(`  ⚠️  Missing index: ${key}`);
                return null;
            }

            try {
                const last = Number(i.last);
                const prev = Number(i.previousClose);
                const perChange30d = Number(i.perChange30d);
                const perChange365d = Number(i.perChange365d);

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
            } catch (err) {
                console.error(`  ❌ Error processing ${key}:`, err.message);
                throw err;
            }
        }).filter(Boolean);

        console.log(`  ✓ Normalized ${indices.length} indices`);

        console.log("\n6️⃣ Processing stocks...");
        const stocks = nifty50StocksRes.data?.data || [];
        console.log(`  ✓ Found ${stocks.length} stocks`);
        console.log(`  First stock keys:`, Object.keys(stocks[0] || {}));

        console.log("\n7️⃣ Processing advance/decline data...");
        const advanceDecline = {
            "NIFTY 50": nifty50StocksRes.data?.advance || {},
        };
        console.log("  Advance:", advanceDecline["NIFTY 50"]);

        console.log("\n8️⃣ Building response...");
        const response = {
            marketStatus,
            indices,
            stocks,
            advanceDecline,
            timestamp: Date.now(),
        };

        console.log("\n✅ CONTROLLER SIMULATION SUCCESSFUL!");
        console.log("Response keys:", Object.keys(response));
        console.log("Response size:", JSON.stringify(response).length, "bytes");

    } catch (error) {
        console.log("\n❌ CONTROLLER SIMULATION FAILED!");
        console.error("Error Type:", error.constructor.name);
        console.error("Error Message:", error.message);
        if (error.response) {
            console.error("HTTP Status:", error.response.status);
            console.error("Response Data:", error.response.data);
        }
        console.error("Stack:", error.stack.split('\n').slice(0, 5).join('\n'));
    }
}

simulateMarketTicker();
