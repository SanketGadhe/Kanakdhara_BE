const { getAllSubscribers, createSubscriber } = require('../controllers/subscribNewsLetter.controller')
const express = require('express')
const router = express.Router()

router.get('/getAll', getAllSubscribers)
router.post('/createSubscriber', createSubscriber)
module.exports = router
