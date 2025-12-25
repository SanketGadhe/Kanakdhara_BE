const router = require("express").Router();
const ctrl = require("../controllers/market.controller");
const marketIntelligenceController = require("../controllers/marketIntelligence.controller");
router.get("/dashboard", ctrl.getDashboard);
router.get("/mmi", ctrl.getMMITrend);
router.get("/fii-series", ctrl.getFIISeries);
router.get(
    "/intelligence",
    marketIntelligenceController.getMarketIntelligence
);

module.exports = router;
