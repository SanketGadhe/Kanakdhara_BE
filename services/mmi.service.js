const fs = require("fs");
const path = require("path");
const { calculateMMI } = require("./mmi.service");
const {
    getFIIDII,
    getVIX,
    getMarketDirection
} = require("./nse.service");

const DATA_FILE = path.join(__dirname, "../data/mmi-history.json");

exports.calculateMMI = ({ fiiNet, vix, niftyChange }) => {
    // Normalize components
    const fiiScore = Math.min(100, Math.max(0, 50 + fiiNet / 100));
    const vixScore = vix < 14 ? 80 : vix < 18 ? 60 : 30;
    const marketScore = niftyChange > 0 ? 70 : niftyChange < 0 ? 40 : 50;

    const mmi =
        fiiScore * 0.4 +
        vixScore * 0.3 +
        marketScore * 0.3;

    return Math.round(mmi);
};

exports.getMMIZone = value => {
    if (value >= 80) return "Very Bullish";
    if (value >= 60) return "Bullish";
    if (value >= 40) return "Neutral";
    if (value >= 20) return "Euphoric";
    return "Cautious";
};


/**
 * Read stored daily MMI snapshots
 */
function readHistory() {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];

        const raw = fs.readFileSync(DATA_FILE, "utf8");
        if (!raw || raw.trim().length === 0) return [];

        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.error("MMI history corrupted. Resetting.", err);
        return [];
    }
}

exports.getMMISeries = (range = "1Y") => {
    const history = readHistory();
    if (!history.length) return [];

    const now = Date.now();

    const daysMap = {
        "1M": 30,
        "3M": 90,
        "6M": 180,
        "1Y": 365,
        "5Y": 1825
    };

    const days = daysMap[range] || 365;

    return history.filter(d => {
        const diffDays =
            (now - new Date(d.date).getTime()) / 86400000;
        return diffDays <= days;
    });
};

exports.storeDailyMMI = async () => {
    try {
        const [flow, vix, market] = await Promise.all([
            getFIIDII(),
            getVIX(),
            getMarketDirection()
        ]);

        const mmi = calculateMMI({
            fiiNet: flow.fii.net,
            vix,
            niftyChange: market.percentChange
        });

        const today = new Date().toISOString().slice(0, 10);

        let history = [];
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, "utf8");
            if (raw && raw.trim()) history = JSON.parse(raw);
        }

        if (!history.find(d => d.date === today)) {
            history.push({ date: today, value: mmi });

            const tmp = DATA_FILE + ".tmp";
            fs.writeFileSync(tmp, JSON.stringify(history, null, 2));
            fs.renameSync(tmp, DATA_FILE);
        }
    } catch (err) {
        console.error("Daily MMI write failed", err);
    }
};