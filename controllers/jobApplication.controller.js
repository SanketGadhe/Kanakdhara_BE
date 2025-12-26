const JobApplication = require('../models/JobApplication');
const { sendMail } = require('../services/gmail.service');

// Input validation helpers
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePhone = (phone) => {
    const phoneRegex = /^[+]?[0-9]{10,15}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
};

const sanitizeInput = (str) => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/<[^>]*>/g, '');
};

exports.submitJobApplication = async (req, res) => {
    try {
        const { fullName, phone, email, whyJoinUs } = req.body;

        // Validate required fields
        if (!fullName || !phone || !email || !whyJoinUs) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: fullName, phone, email, whyJoinUs'
            });
        }

        // Sanitize inputs
        const sanitizedData = {
            fullName: sanitizeInput(fullName),
            phone: sanitizeInput(phone),
            email: email.trim().toLowerCase(),
            whyJoinUs: sanitizeInput(whyJoinUs)
        };

        // Validate email format
        if (!validateEmail(sanitizedData.email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Validate phone format
        if (!validatePhone(sanitizedData.phone)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format'
            });
        }

        // Validate field lengths
        if (sanitizedData.fullName.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Full name must be less than 100 characters'
            });
        }

        if (sanitizedData.whyJoinUs.length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Why join us response must be less than 1000 characters'
            });
        }

        // Check for duplicate applications (same email within 24 hours)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existingApplication = await JobApplication.findOne({
            email: sanitizedData.email,
            createdAt: { $gte: twentyFourHoursAgo }
        });

        if (existingApplication) {
            return res.status(429).json({
                success: false,
                message: 'You have already submitted an application in the last 24 hours'
            });
        }

        // Create new application
        const application = new JobApplication({
            fullName: sanitizedData.fullName,
            phone: sanitizedData.phone,
            email: sanitizedData.email,
            whyJoinUs: sanitizedData.whyJoinUs
        });

        await application.save();

        // Send notification email to admin
        try {
            if (process.env.INTERNAL_NOTIFICATION_EMAIL) {
                await sendMail({
                    to: process.env.INTERNAL_NOTIFICATION_EMAIL,
                    subject: 'New Job Application Received',
                    htmlMessage: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>New Job Application</title>
</head>
<body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Job Application Received</h2>
        
        <table style="border-collapse: collapse; width: 100%;">
            <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Name:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${sanitizedData.fullName}</td></tr>
            <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Phone:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${sanitizedData.phone}</td></tr>
            <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Email:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${sanitizedData.email}</td></tr>
            <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Why Join Us:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${sanitizedData.whyJoinUs}</td></tr>
            <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Application ID:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${application._id}</td></tr>
            <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Submitted:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${new Date().toLocaleString()}</td></tr>
        </table>
    </div>
</body>
</html>`
                });
            }
        } catch (emailError) {
            console.error('Failed to send job application notification email:', emailError);
            // Don't fail the request if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: {
                applicationId: application._id,
                submittedAt: application.createdAt
            }
        });

    } catch (error) {
        console.error('Error submitting job application:', {
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });
        
        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to submit application'
        });
    }
};