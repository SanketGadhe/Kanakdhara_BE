const mongoose = require('mongoose')

const IISFormSchema = new mongoose.Schema(
    {
        marital_status: { type: String, required: true },

        objective_of_services: [{ type: String, required: true }],

        referral_source: { type: String },

        full_name: { type: String, required: true },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        date_of_birth: { type: Date, required: true },

        phone: { type: String, required: true },

        pan_number: {
            type: String,
            uppercase: true,
            trim: true,
            required: true
        },

        address: { type: String },

        family_income_post_tax: { type: Number },

        number_of_dependents: { type: Number },

        net_annual_income: { type: Number },

        yearly_household_expenses: { type: Number },

        yearly_liabilities: { type: Number },

        education_and_parent_support: { type: Number },

        yearly_committed_savings: { type: Number },

        self_occupied_home: {
            type: String,
            enum: ['Yes', 'No']
        },

        bank_fd_rd_savings: { type: Number },

        mutual_fund_investments: { type: Number },

        health_insurance_independent: {
            type: String,
            enum: ['Yes', 'No']
        },

        life_insurance_independent: {
            type: String,
            enum: ['Yes', 'No']
        },

        company_name: { type: String },

        job_designation: { type: String },

        job_profile: { type: String },

        best_financial_decision: { type: String },

        worst_financial_decision: { type: String },

        customerInfo: {
            ref: "CustomerInfo",
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
    },
    { timestamps: true }
);

const IISFORM = mongoose.model("IISForm", IISFormSchema)
module.exports = IISFORM;