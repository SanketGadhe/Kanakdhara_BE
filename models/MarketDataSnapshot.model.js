const mongoose = require("mongoose");

const marketDataSnapshotSchema = new mongoose.Schema(
    {
        snapshotDate: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        ticker: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        intelligence: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        dashboard: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        fiiSeries: {
            type: mongoose.Schema.Types.Mixed,
            default: [],
        },
        fetchedAt: {
            type: Date,
            required: true,
            default: Date.now,
            index: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("MarketDataSnapshot", marketDataSnapshotSchema);
