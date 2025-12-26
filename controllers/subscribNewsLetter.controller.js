
// Newsletter controller for managing subscribers
const Newsletter = require('../models/newsLetter.model');
const { sendMail } = require('../services/gmail.service');
const { getSubscriptionMailTemplate } = require('../static/mailContent');

// Input validation helper
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Get all subscribers
const getAllSubscribers = async (req, res) => {
    try {
        const subscribers = await Newsletter.find().select('email subscribeDate -_id');
        res.status(200).json({
            success: true,
            count: subscribers.length,
            data: subscribers
        });
    } catch (error) {
        console.error('Get subscribers error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to retrieve subscribers' 
        });
    }
};

// Create new subscriber
const createSubscriber = async (req, res) => {
    try {
        const { email } = req.body;

        // Validate input
        if (!email || email.trim() === '') {
            return res.status(400).json({ 
                success: false,
                message: 'Email is required' 
            });
        }

        const sanitizedEmail = email.trim().toLowerCase();

        // Validate email format
        if (!validateEmail(sanitizedEmail)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid email format' 
            });
        }

        // Check if subscriber already exists
        const existingSubscriber = await Newsletter.findOne({ email: sanitizedEmail });

        if (existingSubscriber) {
            return res.status(409).json({ 
                success: false,
                message: 'Email already subscribed' 
            });
        }

        // Create new subscriber
        const newSubscriber = new Newsletter({
            email: sanitizedEmail,
            subscribeDate: new Date()
        });

        // Save subscriber to database
        const savedSubscriber = await newSubscriber.save();

        // Send confirmation email (don't fail if email fails)
        try {
            const message = getSubscriptionMailTemplate();
            await sendMail({
                to: sanitizedEmail,
                subject: "Thank you for subscribing to our newsletter",
                htmlMessage: message
            });
        } catch (emailError) {
            console.error('Failed to send subscription email:', emailError);
            // Continue with success response even if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Successfully subscribed to newsletter',
            data: {
                email: savedSubscriber.email,
                subscribeDate: savedSubscriber.subscribeDate
            }
        });

    } catch (error) {
        console.error('Newsletter subscription error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to subscribe to newsletter' 
        });
    }
};

module.exports = {
    createSubscriber,
    getAllSubscribers
};