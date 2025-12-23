const express = require('express');
const router = express.Router();
const { getMarketTicker } = require('../controllers/marketTicker.controller');
router.get('/market-ticker', getMarketTicker);
module.exports = router;