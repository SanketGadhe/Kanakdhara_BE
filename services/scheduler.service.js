const { getMarketDataSnapshot } = require("./marketDataSnapshot.service");

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MARKET_CLOSE_REFRESH_HOUR_UTC = 13; // 18:30 Asia/Kolkata
let refreshTimer = null;

const isWeekday = (date) => {
    const day = date.getUTCDay();
    return day >= 1 && day <= 5;
};

const getNextRefreshDelay = () => {
    const now = new Date();
    let next = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        MARKET_CLOSE_REFRESH_HOUR_UTC,
        0,
        0
    ));

    if (next <= now) next = new Date(next.getTime() + ONE_DAY_MS);
    while (!isWeekday(next)) next = new Date(next.getTime() + ONE_DAY_MS);
    return next.getTime() - now.getTime();
};

const refreshAfterMarketClose = async () => {
    try {
        const snapshot = await getMarketDataSnapshot({ forceRefresh: true });
        if (snapshot.stale) {
            console.warn("[Market Data] Scheduled refresh kept the previous snapshot");
        } else {
            const { storeDailyMarketMood } = require("../controllers/marketMoodIndicator.controller");
            await storeDailyMarketMood({ replaceExisting: true });
            console.log(`[Market Data] Daily snapshot refreshed for ${snapshot.snapshotDate}`);
        }
    } catch (error) {
        console.error("[Market Data] Scheduled refresh failed:", error.message);
    }
};

const armNextRefresh = () => {
    refreshTimer = setTimeout(async () => {
        await refreshAfterMarketClose();
        armNextRefresh();
    }, getNextRefreshDelay());
    refreshTimer.unref?.();
};

const scheduleDailyMarketDataRefresh = () => {
    if (refreshTimer) return;

    // Warm today's snapshot without delaying server startup.
    getMarketDataSnapshot().catch((error) => {
        console.error("[Market Data] Startup refresh failed:", error.message);
    });
    armNextRefresh();
    console.log("[Market Data] Daily refresh scheduler initialized for 18:30 IST");
};

module.exports = { scheduleDailyMarketDataRefresh };
