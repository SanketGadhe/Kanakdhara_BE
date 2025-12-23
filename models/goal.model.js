// import mongoose, { Schema, Types } from "mongoose";
const { Schema, Types } = require('mongoose')
const mongoose = require('mongoose')
const BreakdownItemSchema = new Schema(
    {
        label: { type: String, required: true },
        value: { type: String, required: true },
        tooltip: { type: String }
    },
    { _id: false }
);

const GoalReportSchema = new Schema(
    {
        // 🔗 Ownership
        customerInfo: {
            ref: "CustomerInfo",
            type: Schema.Types.ObjectId,
            required: true
        },

        // 🧠 Metadata (fixed)
        meta: {
            goalId: { type: String, required: true, index: true },
            subGoalId: { type: String, required: true },
            calculatorVersion: { type: String, required: true },
            generatedAt: { type: Date, required: true }
        },

        // 🎯 Inputs (dynamic but required)
        inputs: {
            type: Map,
            of: Schema.Types.Mixed,
            required: true
        },

        // 📊 Results
        results: {
            // mandatory
            totalCorpus: {
                value: { type: Number, required: true },
                label: { type: String, required: true }
            },

            // optional calculator-specific values
            monthlySIP: { type: Number },
            lumpsumRequired: { type: Number },

            // dynamic array
            breakdown: {
                type: [BreakdownItemSchema],
                default: []
            },

            // catch-all for future metrics
            additionalMetrics: {
                type: Map,
                of: Schema.Types.Mixed,
                default: {}
            }
        },

        // 🌍 UI context
        uiContext: {
            currency: { type: String, default: "INR" },
            locale: { type: String, default: "en-IN" }
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);
const GoalReportModel = mongoose.model('GoalReport', GoalReportSchema);
module.exports = GoalReportModel;
