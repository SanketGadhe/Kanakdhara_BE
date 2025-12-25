const { getOrCreateCustomer } = require('./reportMail.controller.js');

const IISFORM = require('../models/iisForm.model.js');
const { sendMail } = require('../services/gmail.service.js');
const CustomerInfo = require('../models/customerInfo.model.js')
const submitIISForm = async (req, res) => {
    try {
        const payload = req.body;

        const user = {
            name: payload.full_name,
            email: payload.email,
            phone: payload.phone,
            age: payload.age ?? 28,
            panCard: payload.pan_number
        }

        const customer = await getOrCreateCustomer(user)
        // 1️⃣ Save form
        const iis = new IISFORM({
            marital_status: payload.marital_status,
            objective_of_services: payload.objective_of_services,
            referral_source: payload.referral_source,
            full_name: payload.full_name,
            email: payload.email,
            date_of_birth: new Date(payload.date_of_birth),
            phone: payload.phone,
            pan_number: payload.pan_number,
            address: payload.address,
            family_income_post_tax: payload.family_income_post_tax,
            number_of_dependents: payload.number_of_dependents,
            net_annual_income: payload.net_annual_income,
            yearly_household_expenses: payload.yearly_household_expenses,
            yearly_liabilities: payload.yearly_liabilities,
            education_and_parent_support: payload.education_and_parent_support,
            yearly_committed_savings: payload.yearly_committed_savings,
            self_occupied_home: payload.self_occupied_home,
            bank_fd_rd_savings: payload.bank_fd_rd_savings,
            mutual_fund_investments: payload.mutual_fund_investments,
            health_insurance_independent: payload.health_insurance_independent,
            life_insurance_independent: payload.life_insurance_independent,
            company_name: payload.company_name,
            job_designation: payload.job_designation,
            job_profile: payload.job_profile,
            best_financial_decision: payload.best_financial_decision,
            worst_financial_decision: payload.worst_financial_decision,
            customerInfo: customer._id
        });

        await iis.save();

        await CustomerInfo.findByIdAndUpdate(customer._id, {
            $push: { lastActivity: { time: new Date(), purpose: `IIS-Form-Submission`, reference: iis._id } }
        });
        // 2️⃣ Mail to CUSTOMER
        await sendMail({
            to: payload.email,
            subject: 'Your Information Sheet Has Been Received',
            htmlMessage: `
Dear ${payload.full_name},

Thank you for submitting your Information & Investment Sheet.

Our team has successfully received your details and will review them shortly.
We may reach out to you if any additional information is required.

Warm regards,
Team Kanakdhara Investments
      `
        });

        // 3️⃣ Mail to INTERNAL TEAM
        await sendMail({
            to: process.env.INTERNAL_NOTIFICATION_EMAIL, // ex: ops@company.com
            subject: 'New IIS Form Submitted',
            htmlMessage: `
A new IIS form has been submitted.

Name: ${payload.full_name}
Email: ${payload.email}
Phone: ${payload.phone}
PAN: ${payload.pan_number}
Marital Status: ${payload.marital_status}

Please login to the admin panel to view full details.
      `
        });

        return res.status(201).json({
            success: true,
            message: 'Form submitted successfully',
            data: {
                id: iis._id
            }
        });

    } catch (error) {
        console.error('IIS Form Submission Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to submit IIS form'
        });
    }
};
module.exports = {
    submitIISForm
}
