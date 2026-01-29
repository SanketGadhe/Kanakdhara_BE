#!/usr/bin/env node

/**
 * Comprehensive test to verify all NSE API fixes are working
 * Run this before deploying to production
 */

const axios = require("axios");

const tests = [];
let passed = 0;
let failed = 0;

function addTest(name, testFn) {
    tests.push({ name, testFn });
}

async function runTests() {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║         NSE API FIX VERIFICATION - COMPREHENSIVE TEST          ║
╚════════════════════════════════════════════════════════════════╝
`);

    for (const test of tests) {
        try {
            await test.testFn();
            console.log(`✅ ${test.name}`);
            passed++;
        } catch (error) {
            console.log(`❌ ${test.name}`);
            console.log(`   Error: ${error.message}\n`);
            failed++;
        }
    }

    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                         TEST RESULTS                            ║
╠════════════════════════════════════════════════════════════════╣
║ Passed: ${String(passed).padStart(2, ' ')}                                                   ║
║ Failed: ${String(failed).padStart(2, ' ')}                                                   ║
╚════════════════════════════════════════════════════════════════╝
`);

    if (failed === 0) {
        console.log("🎉 All tests passed! API is ready for production.\n");
        process.exit(0);
    } else {
        console.log(`⚠️  ${failed} test(s) failed. Review errors above.\n`);
        process.exit(1);
    }
}

// TEST 1: Check if controller loads
addTest("Controller loads without syntax errors", async () => {
    const controller = require("./controllers/marketTicker.controller.js");
    if (!controller.getMarketTicker) throw new Error("getMarketTicker not exported");
});

// TEST 2: Check if service loads
addTest("NSE service loads without syntax errors", async () => {
    const service = require("./services/nse.service.js");
    if (!service.getFIIDII) throw new Error("getFIIDII not exported");
    if (!service.getVIX) throw new Error("getVIX not exported");
    if (!service.getMarketDirection) throw new Error("getMarketDirection not exported");
});

// TEST 3: Check NSE connectivity
addTest("NSE API endpoints are reachable", async () => {
    const nse = axios.create({
        baseURL: "https://www.nseindia.com",
        timeout: 15000,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
            "Referer": "https://www.nseindia.com/",
        },
        withCredentials: true,
    });

    await nse.get("/");
    const res = await nse.get("/api/allIndices");
    if (!res.data.data || res.data.data.length === 0) throw new Error("No indices returned");
});

// TEST 4: Check market status
addTest("Market status endpoint is working", async () => {
    const nse = axios.create({
        baseURL: "https://www.nseindia.com",
        timeout: 15000,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
            "Referer": "https://www.nseindia.com/",
        },
        withCredentials: true,
    });

    const res = await nse.get("/api/marketStatus");
    if (!res.data.marketState || res.data.marketState.length === 0) {
        throw new Error("No market state returned");
    }
});

// TEST 5: Check NIFTY 50 stocks
addTest("NIFTY 50 stocks endpoint is working", async () => {
    const nse = axios.create({
        baseURL: "https://www.nseindia.com",
        timeout: 15000,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
            "Referer": "https://www.nseindia.com/",
        },
        withCredentials: true,
    });

    const res = await nse.get("/api/equity-stockIndices", {
        params: { index: "NIFTY 50" },
    });
    if (!res.data.data || res.data.data.length === 0) {
        throw new Error("No stocks returned");
    }
});

// TEST 6: Verify package.json
addTest("package.json has required dependencies", async () => {
    const pkg = require("./package.json");
    if (!pkg.dependencies.axios) throw new Error("axios not in dependencies");
    if (!pkg.dependencies.express) throw new Error("express not in dependencies");
});

// RUN ALL TESTS
runTests();
