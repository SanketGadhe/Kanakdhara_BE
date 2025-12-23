const express = require('express');
const router = express.Router();
const { createCustomer, getAllCustomers, getCustomerById } = require('../controllers/customerInfo.controllers');

router.post('/connectCustomer', createCustomer);
router.get('/getCustomer/:id', getCustomerById);
router.get('/getAllCustomers', getAllCustomers);

module.exports = router;