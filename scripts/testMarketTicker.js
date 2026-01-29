const axios = require("axios");

const NSE_BASE = "https://www.nseindia.com";

const axiosNSE = axios.create({
    baseURL: NSE_BASE,
    timeout: 10000,
    headers: {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "application/json",
        Referer: "https://www.nseindia.com/",
        Connection: "keep-alive",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
    },
    withCredentials: true,
});

// Add response interceptor to capture headers
axiosNSE.interceptors.response.use(
    response => {
        console.log("\n✓ Response Headers:", response.headers);
        return response;
    },
    error => {
        console.error("\n✗ Error Details:", {
            status: error.response?.status,
            statusText: error.response?.statusText,
            headers: error.response?.headers,
            data: error.response?.data,
            message: error.message,
            code: error.code,
        });
        throw error;
    }
);

async function testMarketTicker() {
    console.log("🧪 Testing Market Ticker API\n");

    try {
        console.log("1️⃣ Step 1: Warming up NSE cookies...");
        const warmupRes = await axiosNSE.get("/");
        console.log("✓ Warmup successful");

        console.log("\n2️⃣ Step 2: Fetching all indices...");
        const indicesRes = await axiosNSE.get("/api/allIndices");
        console.log("✓ All Indices fetched:", indicesRes.data.data?.length, "indices");

        console.log("\n3️⃣ Step 3: Fetching market status...");
        const statusRes = await axiosNSE.get("/api/marketStatus");
        console.log("✓ Market Status fetched:", statusRes.data.marketState?.[0]);

        console.log("\n4️⃣ Step 4: Fetching NIFTY 50 stocks...");
        const nifty50Res = await axiosNSE.get("/api/equity-stockIndices", {
            params: { index: "NIFTY 50" },
        });
        console.log("✓ NIFTY 50 Stocks fetched:", nifty50Res.data.data?.length, "stocks");

        console.log("\n✅ ALL TESTS PASSED! Market Ticker API should work.\n");
    } catch (error) {
        console.log("\n❌ TEST FAILED!");
        console.error(error.message);
    }
}

testMarketTicker();
