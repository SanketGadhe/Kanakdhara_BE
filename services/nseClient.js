/**
 * Shared NSE HTTP client with cookie management.
 *
 * NSE India protects some API routes behind browser session cookies. This
 * client keeps that behavior centralized so controllers can handle degraded
 * upstream data consistently.
 */

const axios = require("axios");

const NSE_BASE = "https://www.nseindia.com";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1500;
const COOKIE_REFRESH_INTERVAL = 4 * 60 * 1000;
const REQUEST_THROTTLE_MS = 300;
const WARMUP_PATHS = [
    "/market-data/live-equity-market?symbol=NIFTY%2050",
    "/market-data/live-market-indices",
    "/",
];
const SESSION_RECOVERABLE_STATUSES = new Set([401, 403, 404, 429]);
const TRANSIENT_STATUSES = new Set([500, 502, 503, 504]);

let cookies = "";
let lastCookieRefresh = 0;
let lastRequestTime = 0;
let cookieRefreshPromise = null;
let requestQueue = Promise.resolve();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const nseAxios = axios.create({
    baseURL: NSE_BASE,
    timeout: 15000,
    headers: {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
    },
});

async function refreshCookies() {
    if (cookieRefreshPromise) {
        return cookieRefreshPromise;
    }

    cookieRefreshPromise = (async () => {
        for (const path of WARMUP_PATHS) {
            try {
                const response = await nseAxios.get(path, {
                    headers: {
                        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                        Referer: "https://www.google.com/",
                        "Sec-Fetch-Dest": "document",
                        "Sec-Fetch-Mode": "navigate",
                        "Sec-Fetch-Site": "cross-site",
                    },
                    maxRedirects: 5,
                    validateStatus: (status) => status < 400,
                });

                const setCookieHeaders = response.headers["set-cookie"];
                if (!setCookieHeaders || setCookieHeaders.length === 0) {
                    console.warn(`[NSE] No cookies received from warmup path ${path}`);
                    continue;
                }

                cookies = setCookieHeaders.map((c) => c.split(";")[0]).join("; ");
                lastCookieRefresh = Date.now();
                console.log(`[NSE] Cookies refreshed successfully via ${path}`);
                return;
            } catch (err) {
                console.warn(`[NSE] Cookie warmup failed for ${path}:`, err.message);
            }
        }

        console.error("[NSE] Cookie refresh failed for all warmup paths");
    })().finally(() => {
        cookieRefreshPromise = null;
    });

    return cookieRefreshPromise;
}

async function ensureCookies() {
    if (!cookies || Date.now() - lastCookieRefresh > COOKIE_REFRESH_INTERVAL) {
        await refreshCookies();
    }
}

async function nseGet(url, config = {}) {
    await ensureCookies();

    const { nseMaxRetries = MAX_RETRIES, ...axiosConfig } = config;

    return enqueueRequest(() => fetchWithRetry(url, axiosConfig, 0, nseMaxRetries));
}

function enqueueRequest(requestFn) {
    const queuedRequest = requestQueue.then(async () => {
        await waitForRequestSlot();
        return requestFn();
    });

    requestQueue = queuedRequest.catch(() => {});
    return queuedRequest;
}

async function waitForRequestSlot() {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < REQUEST_THROTTLE_MS) {
        await sleep(REQUEST_THROTTLE_MS - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();
}

async function fetchWithRetry(url, config, retryCount, maxRetries) {
    try {
        return await nseAxios.get(url, {
            ...config,
            headers: {
                ...config.headers,
                Accept: "application/json, text/plain, */*",
                Referer: "https://www.nseindia.com/",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                Cookie: cookies,
            },
        });
    } catch (error) {
        const status = error.response?.status;
        const isSessionRecoverable = SESSION_RECOVERABLE_STATUSES.has(status);
        const isTransient = !status || TRANSIENT_STATUSES.has(status);
        const shouldRetry =
            retryCount < maxRetries && (isSessionRecoverable || isTransient);

        if (shouldRetry) {
            console.warn(
                `[NSE] ${status || error.code || "network"} on ${url}, retrying (${retryCount + 1}/${maxRetries})...`
            );

            if (isSessionRecoverable) {
                cookies = "";
                lastCookieRefresh = 0;
                await refreshCookies();
            }

            await sleep(RETRY_DELAY * Math.pow(2, retryCount));
            return fetchWithRetry(url, config, retryCount + 1, maxRetries);
        }

        error.isNSEUpstreamError = true;
        error.upstreamStatus = status;
        throw error;
    }
}

module.exports = { nseGet, refreshCookies, ensureCookies };
