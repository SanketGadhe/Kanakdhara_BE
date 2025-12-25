// GET /api/market-mood-indicator/history?range=1M
// Response for historical data (for graph plotting)
{
    "success": true,
    "data": [
        {
            "_id": "674a1b2c3d4e5f6789012345",
            "date": "2024-01-15",
            "sentiment_score": 65,
            "sentiment_label": "Risk",
            "risk_level": "Moderate",
            "primary_signal": "Stock Specific Action",
            "investment_action": "Accumulate Quality Stocks / Hold",
            "nifty_change": 0.85,
            "vix_value": 16.2,
            "breadth_ratio": 1.3,
            "trend_strength": "Positive",
            "createdAt": "2024-01-15T18:30:00.000Z",
            "updatedAt": "2024-01-15T18:30:00.000Z"
        },
        {
            "_id": "674a1b2c3d4e5f6789012346",
            "date": "2024-01-16",
            "sentiment_score": 45,
            "sentiment_label": "Neutral",
            "risk_level": "High",
            "primary_signal": "Risk Management",
            "investment_action": "Stay Defensive / Protect Capital",
            "nifty_change": -1.2,
            "vix_value": 22.5,
            "breadth_ratio": 0.8,
            "trend_strength": "Negative",
            "createdAt": "2024-01-16T18:30:00.000Z",
            "updatedAt": "2024-01-16T18:30:00.000Z"
        },
        {
            "_id": "674a1b2c3d4e5f6789012347",
            "date": "2024-01-17",
            "sentiment_score": 72,
            "sentiment_label": "Risk",
            "risk_level": "Low",
            "primary_signal": "Stock Specific Action",
            "investment_action": "Accumulate Quality Stocks / Hold",
            "nifty_change": 1.45,
            "vix_value": 14.8,
            "breadth_ratio": 1.7,
            "trend_strength": "Positive",
            "createdAt": "2024-01-17T18:30:00.000Z",
            "updatedAt": "2024-01-17T18:30:00.000Z"
        }
    ],
    "range": "1M",
    "count": 3
}

// GET /api/market-mood-indicator/today
{
    "success": true,
    "data": {
        "_id": "674a1b2c3d4e5f6789012348",
        "date": "2024-01-18",
        "sentiment_score": 58,
        "sentiment_label": "Neutral",
        "risk_level": "Moderate",
        "primary_signal": "Risk Management",
        "investment_action": "Stay Defensive / Protect Capital",
        "nifty_change": -0.35,
        "vix_value": 18.9,
        "breadth_ratio": 1.1,
        "trend_strength": "Neutral",
        "createdAt": "2024-01-18T18:30:00.000Z",
        "updatedAt": "2024-01-18T18:30:00.000Z"
    }
}