const axios = require("axios");

const NSE_BASE = "https://www.nseindia.com";

async function testWithVariousHeaders() {
    const testCases = [
        {
            name: "Standard headers",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json",
                "Referer": "https://www.nseindia.com",
                "Connection": "keep-alive",
            }
        },
        {
            name: "With Accept-Language",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json",
                "Referer": "https://www.nseindia.com",
                "Connection": "keep-alive",
                "Accept-Language": "en-US,en;q=0.9",
            }
        },
        {
            name: "With Accept-Encoding (gzip)",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json",
                "Referer": "https://www.nseindia.com",
                "Connection": "keep-alive",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "en-US,en;q=0.9",
            }
        },
        {
            name: "With full Chrome headers",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json",
                "Referer": "https://www.nseindia.com/",
                "Connection": "keep-alive",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "en-US,en;q=0.9",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
            }
        }
    ];

    for (const testCase of testCases) {
        try {
            console.log(`\n🧪 Testing: ${testCase.name}`);

            const axiosInstance = axios.create({
                baseURL: NSE_BASE,
                timeout: 10000,
                headers: testCase.headers,
                withCredentials: true,
            });

            // Warmup
            await axiosInstance.get("/");

            // Test all three critical endpoints
            const [res1, res2, res3] = await Promise.all([
                axiosInstance.get("/api/allIndices"),
                axiosInstance.get("/api/marketStatus"),
                axiosInstance.get("/api/equity-stockIndices", {
                    params: { index: "NIFTY 50" },
                }),
            ]);

            console.log(`✅ SUCCESS - All 3 endpoints responded`);
            console.log(`   allIndices: ${res1.data?.data?.length} items`);
            console.log(`   marketStatus: ${res2.data?.marketState?.length} states`);
            console.log(`   NIFTY 50: ${res3.data?.data?.length} stocks`);
        } catch (err) {
            console.log(`❌ FAILED - ${err.message}`);
            if (err.response) {
                console.log(`   Status: ${err.response.status}`);
                console.log(`   Response size: ${JSON.stringify(err.response.data).length} bytes`);
            }
        }
    }

    console.log("\n✅ All test cases completed");
}

testWithVariousHeaders();
