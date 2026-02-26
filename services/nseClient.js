/**
 * Shared NSE HTTP Client with Cookie Management
 * 
 * NSE India requires valid session cookies from an initial page visit.
 * This module manages a single shared axios instance with:
 * - Automatic cookie capture from NSE homepage
 * - Cookie reuse across all API calls
 * - Periodic cookie refresh before expiry
 * - Retry with exponential backoff on 403/429
 * - Request queuing to avoid overwhelming NSE
 */

const axios = require("axios");

/* ===== Configuration ===== */
const NSE_BASE = "https://www.nseindia.com";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1500;
const COOKIE_REFRESH_INTERVAL = 4 * 60 * 1000; // Refresh cookies every 4 minutes
const REQUEST_THROTTLE_MS = 300; // Min gap between requests

/* ===== State ===== */
let cookies = "";
let lastCookieRefresh = 0;
let lastRequestTime = 0;
let cookieRefreshPromise = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ===== Axios Instance ===== */
const nseAxios = axios.create({
    baseURL: NSE_BASE,
    timeout: 15000,
    headers: {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
    },
});

/* ===== Cookie Management ===== */

/**
 * Visit NSE homepage to capture session cookies.
 * Uses a deduplication promise so concurrent callers share one request.
 */
async function refreshCookies() {
    // If a refresh is already in progress, wait for it
    if (cookieRefreshPromise) {
        return cookieRefreshPromise;
    }

    cookieRefreshPromise = (async () => {
        try {
            const response = await nseAxios.get("/", {
                headers: {
                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    Referer: "https://www.google.com/",
                },
                maxRedirects: 5,
                validateStatus: (status) => status < 400,
            });

            const setCookieHeaders = response.headers["set-cookie"];
            if (setCookieHeaders && setCookieHeaders.length > 0) {
                cookies = setCookieHeaders
                    .map((c) => c.split(";")[0])
                    .join("; ");
                lastCookieRefresh = Date.now();
                console.log("[NSE] Cookies refreshed successfully");
            } else {
                console.warn("[NSE] No cookies received from homepage");
            }
        } catch (err) {
            console.error("[NSE] Cookie refresh failed:", err.message);
            // Don't throw — let caller proceed with stale/empty cookies
        } finally {
            cookieRefreshPromise = null;
        }
    })();

    return cookieRefreshPromise;
}

/**
 * Ensure we have valid cookies (refresh if stale or missing)
 */
async function ensureCookies() {
    if (!cookies || Date.now() - lastCookieRefresh > COOKIE_REFRESH_INTERVAL) {
        await refreshCookies();
    }
}

/* ===== Throttled Request ===== */

/**
 * Make a GET request to NSE API with cookie management and retry logic.
 * @param {string} url - API path (e.g., "/api/allIndices")
 * @param {object} config - Additional axios config (params, etc.)
 * @returns {Promise<object>} - Axios response
 */
async function nseGet(url, config = {}) {
    await ensureCookies();

    // Throttle requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < REQUEST_THROTTLE_MS) {
        await sleep(REQUEST_THROTTLE_MS - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();

    return fetchWithRetry(url, config, 0);
}

async function fetchWithRetry(url, config, retryCount) {
    try {
        const response = await nseAxios.get(url, {
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
        return response;
    } catch (error) {
        const status = error.response?.status;

        if ((status === 403 || status === 429) && retryCount < MAX_RETRIES) {
            console.warn(
                `[NSE] ${status} on ${url}, refreshing cookies and retrying (${retryCount + 1}/${MAX_RETRIES})...`
            );

            // Force cookie refresh on 403
            cookies = "";
            lastCookieRefresh = 0;
            await refreshCookies();

            const delay = RETRY_DELAY * Math.pow(2, retryCount);
            await sleep(delay);

            return fetchWithRetry(url, config, retryCount + 1);
        }

        throw error;
    }
}

/* ===== Exports ===== */
module.exports = { nseGet, refreshCookies, ensureCookies };
