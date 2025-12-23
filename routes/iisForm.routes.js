const express = require('express');
const { submitIISForm } = require('../controllers/iisForm.controller.js');

const router = express.Router();

router.post('/submitIISForm', submitIISForm);
module.exports = router;