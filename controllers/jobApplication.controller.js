const JobApplication = require('../models/JobApplication');
const { sendMail } = require('../services/mailService');

exports.submitJobApplication = async (req, res) => {
    try {
        const { fullName, phone, email, whyJoinUs } = req.body;

        // Validate required fields
        if (!fullName || !phone || !email || !whyJoinUs) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Create new application
        const application = new JobApplication({
            fullName,
            phone,
            email,
            whyJoinUs
        });

        await application.save();

        // Send notification email to admin
        try {
            await sendMail({
                toEmail: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
                subject: 'New Job Application Received',
                message: `
New job application received:

Name: ${fullName}
Phone: ${phone}
Email: ${email}
Why join us: ${whyJoinUs}

Application ID: ${application._id}
Submitted at: ${new Date().toLocaleString()}
                `.trim()
            });
        } catch (emailError) {
            console.error('Failed to send notification email:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            applicationId: application._id
        });

    } catch (error) {
        console.error('Error submitting job application:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit application',
            error: error.message
        });
    }
};