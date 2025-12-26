const { getOrCreateCustomer } = require('./reportMail.controller.js');

const IISFORM = require('../models/iisForm.model.js');
const { sendMail } = require('../services/gmail.service.js');
const CustomerInfo = require('../models/customerInfo.model.js');

// Input validation helper
const validateIISFormInput = (payload) => {
    const errors = [];
    
    // Required fields validation
    const requiredFields = ['full_name', 'email', 'phone', 'pan_number', 'date_of_birth'];
    requiredFields.forEach(field => {
        if (!payload[field] || payload[field].toString().trim() === '') {
            errors.push(`${field} is required`);
        }
    });
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (payload.email && !emailRegex.test(payload.email)) {
        errors.push('Invalid email format');
    }
    
    // Phone validation (basic)
    const phoneRegex = /^[+]?[0-9]{10,15}$/;
    if (payload.phone && !phoneRegex.test(payload.phone.replace(/\s+/g, ''))) {
        errors.push('Invalid phone number format');
    }
    
    // PAN validation (Indian PAN format)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (payload.pan_number && !panRegex.test(payload.pan_number.toUpperCase())) {
        errors.push('Invalid PAN number format');
    }
    
    // Date validation
    if (payload.date_of_birth) {
        const dob = new Date(payload.date_of_birth);
        if (isNaN(dob.getTime()) || dob > new Date()) {
            errors.push('Invalid date of birth');
        }
    }
    
    return errors;
};

// Sanitize input helper
const sanitizeInput = (str) => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/<[^>]*>/g, '');
};

const submitIISForm = async (req, res) => {
    try {
        const payload = req.body;
        
        // Validate input
        const validationErrors = validateIISFormInput(payload);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }
        
        // Sanitize string inputs
        Object.keys(payload).forEach(key => {
            if (typeof payload[key] === 'string') {
                payload[key] = sanitizeInput(payload[key]);
            }
        });

        const user = {
            name: payload.full_name,
            email: payload.email.toLowerCase(),
            phone: payload.phone,
            age: payload.age ?? 28,
            panCard: payload.pan_number.toUpperCase()
        };

        const customer = await getOrCreateCustomer(user);
        
        if (!customer) {
            throw new Error('Failed to create or retrieve customer');
        }
        // 1️⃣ Save form
        const iis = new IISFORM({
            marital_status: payload.marital_status,
            objective_of_services: payload.objective_of_services,
            referral_source: payload.referral_source,
            full_name: payload.full_name,
            email: payload.email.toLowerCase(),
            date_of_birth: new Date(payload.date_of_birth),
            phone: payload.phone,
            pan_number: payload.pan_number.toUpperCase(),
            address: payload.address,
            family_income_post_tax: Number(payload.family_income_post_tax) || 0,
            number_of_dependents: Number(payload.number_of_dependents) || 0,
            net_annual_income: Number(payload.net_annual_income) || 0,
            yearly_household_expenses: Number(payload.yearly_household_expenses) || 0,
            yearly_liabilities: Number(payload.yearly_liabilities) || 0,
            education_and_parent_support: Number(payload.education_and_parent_support) || 0,
            yearly_committed_savings: Number(payload.yearly_committed_savings) || 0,
            self_occupied_home: Number(payload.self_occupied_home) || 0,
            bank_fd_rd_savings: Number(payload.bank_fd_rd_savings) || 0,
            mutual_fund_investments: Number(payload.mutual_fund_investments) || 0,
            health_insurance_independent: Number(payload.health_insurance_independent) || 0,
            life_insurance_independent: Number(payload.life_insurance_independent) || 0,
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
        try {
            await sendMail({
                to: payload.email.toLowerCase(),
                subject: 'Your Information Sheet Has Been Received',
                htmlMessage: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Information Sheet Received</title>
</head>
<body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Dear ${sanitizeInput(payload.full_name)},</h2>
        
        <p>Thank you for submitting your Information & Investment Sheet.</p>
        
        <p>Our team has successfully received your details and will review them shortly.
        We may reach out to you if any additional information is required.</p>
        
        <p>Warm regards,<br>
        Team Kanakdhara Investments</p>
    </div>
</body>
</html>`
            });
        } catch (emailError) {
            console.error('Failed to send customer email:', emailError);
            // Don't fail the entire request if email fails
        }

        // 3️⃣ Mail to INTERNAL TEAM
        try {
            if (process.env.INTERNAL_NOTIFICATION_EMAIL) {
                await sendMail({
                    to: process.env.INTERNAL_NOTIFICATION_EMAIL,
                    subject: 'New IIS Form Submitted',
                    htmlMessage: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>New IIS Form Submission</title>
</head>
<body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New IIS Form Submitted</h2>
        
        <table style="border-collapse: collapse; width: 100%;">
            <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Name:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${sanitizeInput(payload.full_name)}</td></tr>
            <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Email:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${payload.email}</td></tr>
            <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Phone:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${payload.phone}</td></tr>
            <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>PAN:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${payload.pan_number}</td></tr>
            <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Marital Status:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${sanitizeInput(payload.marital_status)}</td></tr>
        </table>
        
        <p>Please login to the admin panel to view full details.</p>
    </div>
</body>
</html>`
                });
            }
        } catch (emailError) {
            console.error('Failed to send internal notification email:', emailError);
            // Don't fail the entire request if email fails
        }

        return res.status(201).json({
            success: true,
            message: 'Form submitted successfully',
            data: {
                id: iis._id
            }
        });

    } catch (error) {
        console.error('IIS Form Submission Error:', {
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });

        // Don't expose internal error details in production
        const errorMessage = process.env.NODE_ENV === 'development' 
            ? error.message 
            : 'Failed to submit IIS form';

        return res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
};
module.exports = {
    submitIISForm
}
