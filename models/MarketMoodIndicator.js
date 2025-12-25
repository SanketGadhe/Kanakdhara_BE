const mongoose = require('mongoose');

const marketMoodIndicatorSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    sentiment_score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    sentiment_label: {
        type: String,
        required: true,
        enum: ['Panic', 'Fear', 'Neutral', 'Risk', 'Euphoric']
    },
    risk_level: {
        type: String,
        required: true,
        enum: ['Low', 'Moderate', 'High']
    },
    primary_signal: {
        type: String,
        required: true
    },
    investment_action: {
        type: String,
        required: true
    },
    nifty_change: {
        type: Number,
        required: true
    },
    vix_value: {
        type: Number,
        required: true
    },
    breadth_ratio: {
        type: Number,
        default: null
    },
    trend_strength: {
        type: String,
        required: true,
        enum: ['Positive', 'Negative', 'Neutral']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MarketMoodIndicator', marketMoodIndicatorSchema);