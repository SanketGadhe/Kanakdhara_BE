const axios = require("axios");

console.log(`
════════════════════════════════════════════════════════════════
🔍 TESTING FIXED NSE API CONNECTIVITY WITH RETRY LOGIC
════════════════════════════════════════════════════════════════
`);

const NSE_BASE = "https://www.nseindia.com";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const axiosNSE = axios.create({
    baseURL: NSE_BASE,
    timeout: 15000,
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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

const fetchWithRetry = async (url, config = {}, retryCount = 0) => {
    try {
        const response = await axiosNSE.get(url, config);
        if (retryCount > 0) {
            console.log(`   ✓ Succeeded on retry attempt ${retryCount}`);
        }
        return response;
    } catch (error) {
        if ((error.response?.status === 403 || error.response?.status === 429) && retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAY * Math.pow(2, retryCount);
            console.log(`   ⚠️  Got ${error.response.status}, retrying in ${delay}ms... (${retryCount + 1}/${MAX_RETRIES})`);
            await sleep(delay);
            return fetchWithRetry(url, config, retryCount + 1);
        }
        throw error;
    }
};

async function testAllEndpoints() {
    try {
        console.log("\n1️⃣  Warming up NSE session...");
        try {
            await fetchWithRetry("/");
            console.log("   ✓ Session established\n");
        } catch (err) {
            console.log("   ⚠️  Warmup failed (non-critical), continuing...\n");
        }

        console.log("2️⃣  Testing /api/allIndices...");
        const indicesRes = await fetchWithRetry("/api/allIndices");
        console.log(`   ✓ Got ${indicesRes.data.data.length} indices\n`);

        console.log("3️⃣  Testing /api/marketStatus...");
        const statusRes = await fetchWithRetry("/api/marketStatus");
        console.log(`   ✓ Market status: ${statusRes.data.marketState[0].marketStatus}\n`);

        console.log("4️⃣  Testing /api/equity-stockIndices (NIFTY 50)...");
        const stocksRes = await fetchWithRetry("/api/equity-stockIndices", {
            params: { index: "NIFTY 50" },
        });
        console.log(`   ✓ Got ${stocksRes.data.data.length} stocks\n`);

        console.log(`════════════════════════════════════════════════════════════════
✅ ALL TESTS PASSED! 

Your API should now work with:
✓ Better anti-bot headers
✓ Automatic retry logic (exponential backoff)
✓ Improved timeout handling (15s instead of 10s)
✓ Better error logging and diagnostics

The 403 errors should be resolved!
════════════════════════════════════════════════════════════════`);

    } catch (error) {
        console.log(`\n❌ TEST FAILED

Error: ${error.message}
Status: ${error.response?.status}
URL: ${error.config?.url}

If you still get 403 errors:
1. Try running this script again (retry logic will help)
2. Check if NSE has IP whitelisting enabled
3. Try accessing NSE directly in a browser from your server
4. Contact NSE support if the IP is blocked

════════════════════════════════════════════════════════════════`);
    }
}

testAllEndpoints();
