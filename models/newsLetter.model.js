
const mongoose = require('mongoose');

const newsletterSubscriptionSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    subscribeDate: {
        type: Date,
        default: Date.now
    }
});

const NewsletterSubscription = mongoose.model('NewsletterSubscription', newsletterSubscriptionSchema);
module.exports = NewsletterSubscription;