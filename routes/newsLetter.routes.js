const { getAllSubscribers, createSubscriber } = require('../controllers/subscribNewsLetter.controller')
const express = require('express')
const router = express.Router()

router.get('/getAllSubscribers', getAllSubscribers)
router.post('/createSubscriber', createSubscriber)
module.exports = router
