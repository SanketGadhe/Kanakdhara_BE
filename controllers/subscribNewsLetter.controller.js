
// Newsletter controller for managing subscribers
const Newsletter = require('../models/newsLetter.model');
const { sendMail } = require('../services/gmail.service');
const { getSubscriptionMailTemplate } = require('../static/mailContent');

// Get all subscribers
const getAllSubscribers = async (req, res) => {
    try {
        const subscribers = await Newsletter.find();
        res.status(200).json(subscribers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Create new subscriber
const createSubscriber = async (req, res) => {
    const { email } = req.body;

    try {
        // Check if subscriber already exists
        const existingSubscriber = await Newsletter.findOne({ email });

        if (existingSubscriber) {
            return res.status(400).json({ message: 'Email already subscribed' });
        }

        // Create new subscriber
        const newSubscriber = new Newsletter({
            email,
            subscribeDate: new Date()
        });
        const message = getSubscriptionMailTemplate()
        // Save subscriber to database
        const savedSubscriber = await newSubscriber.save();
        const sendMailForSubscription = await sendMail({
            to: email,
            subject: "Thank you for subscribing to our newsletter",
            htmlMessage: message
        })
        res.status(201).json(savedSubscriber);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    createSubscriber,
    getAllSubscribers
};