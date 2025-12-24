const router = require("express").Router();
const ctrl = require("../controllers/market.controller");

router.get("/dashboard", ctrl.getDashboard);
router.get("/mmi", ctrl.getMMITrend);
router.get("/fii-series", ctrl.getFIISeries);

module.exports = router;
