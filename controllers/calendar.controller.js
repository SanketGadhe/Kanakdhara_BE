const {
    getBusySlots,
    bookMeeting,
} = require('../services/googleCalendar.service');
const { sendMail } = require('../services/gmail.service');
const { buildMeetingEmail } = require('../static/mailContent');
const { getBookFreeSessionMailTemplate } = require('../static/mailTemplate');

// Input validation helpers
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validateDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return !isNaN(date.getTime()) && date > new Date();
};

const validatePhone = (phone) => {
    if (!phone) return false;
    const phoneRegex = /^[+]?[0-9]{10,15}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
};

const sanitizeInput = (str) => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/<[^>]*>/g, '');
};


/**
 * GET /calendar/availability
 * Public – no auth required
 */
exports.getAvailability = async (req, res) => {
    try {
        const { timeMin, timeMax } = req.query;

        // Validate required parameters
        if (!timeMin || !timeMax) {
            return res.status(400).json({
                success: false,
                message: 'timeMin and timeMax are required',
                example: {
                    timeMin: '2024-01-01T00:00:00Z',
                    timeMax: '2024-01-31T23:59:59Z'
                }
            });
        }

        // Validate date formats
        const startDate = new Date(timeMin);
        const endDate = new Date(timeMax);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)'
            });
        }

        // Validate date range
        if (startDate >= endDate) {
            return res.status(400).json({
                success: false,
                message: 'timeMin must be before timeMax'
            });
        }

        // Validate reasonable date range (max 3 months)
        const maxRange = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
        if (endDate - startDate > maxRange) {
            return res.status(400).json({
                success: false,
                message: 'Date range cannot exceed 90 days'
            });
        }

        const busySlots = await getBusySlots({ timeMin, timeMax });

        res.json({
            success: true,
            data: {
                busy: busySlots,
                timeMin,
                timeMax
            }
        });

    } catch (error) {
        console.error('Get availability error:', {
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });

        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch availability'
        });
    }
};



exports.bookSlot = async (req, res) => {
    try {
        const {
            start,
            end,
            email,
            name,
            phone,
            title = 'Introduction Call',
            description = 'Scheduled meeting via website',
        } = req.body;

        // Validate required fields
        const requiredFields = ['start', 'end', 'email', 'name', 'phone'];
        const missingFields = requiredFields.filter(field => !req.body[field] || req.body[field].toString().trim() === '');

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                missingFields
            });
        }

        // Sanitize inputs
        const sanitizedData = {
            start: start.trim(),
            end: end.trim(),
            email: email.trim().toLowerCase(),
            name: sanitizeInput(name),
            phone: sanitizeInput(phone),
            title: sanitizeInput(title),
            description: sanitizeInput(description)
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

        // Validate date/time formats
        if (!validateDateTime(sanitizedData.start) || !validateDateTime(sanitizedData.end)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date/time format or dates must be in the future'
            });
        }

        // Validate meeting duration
        const startTime = new Date(sanitizedData.start);
        const endTime = new Date(sanitizedData.end);
        const duration = endTime - startTime;

        if (duration <= 0) {
            return res.status(400).json({
                success: false,
                message: 'End time must be after start time'
            });
        }

        // Validate reasonable duration (15 min to 4 hours)
        const minDuration = 15 * 60 * 1000; // 15 minutes
        const maxDuration = 4 * 60 * 60 * 1000; // 4 hours

        if (duration < minDuration || duration > maxDuration) {
            return res.status(400).json({
                success: false,
                message: 'Meeting duration must be between 15 minutes and 4 hours'
            });
        }

        // Validate field lengths
        if (sanitizedData.name.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Name must be less than 100 characters'
            });
        }

        if (sanitizedData.title.length > 200) {
            return res.status(400).json({
                success: false,
                message: 'Title must be less than 200 characters'
            });
        }

        if (sanitizedData.description.length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Description must be less than 1000 characters'
            });
        }

        // Book the meeting
        const event = await bookMeeting({
            title: sanitizedData.title,
            description: sanitizedData.description,
            start: sanitizedData.start,
            end: sanitizedData.end,
            clientEmail: sanitizedData.email,
        });

        // Extract meeting link
        const meetLink =
            event.hangoutLink ||
            event.conferenceData?.entryPoints?.find(
                (e) => e.entryPointType === 'video'
            )?.uri ||
            null;

        // Send confirmation email to client
        try {
            const { Subject, Message } = buildMeetingEmail(meetLink);
            await sendMail({
                to: sanitizedData.email,
                subject: Subject,
                htmlMessage: getBookFreeSessionMailTemplate({
                    name: sanitizedData.name,
                    email: sanitizedData.email,
                    preferredDate: sanitizedData.start,
                    meetingLink: meetLink
                }),
            });
        } catch (emailError) {
            console.error('Failed to send client confirmation email:', emailError);
            // Don't fail the booking if email fails
        }

        // Send notification to internal team
        try {
            if (process.env.INTERNAL_NOTIFICATION_EMAIL) {
                await sendMail({
                    to: process.env.INTERNAL_NOTIFICATION_EMAIL,
                    subject: "New Meeting Scheduled from Website",
                    htmlMessage: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>New Meeting Scheduled</title>
</head>
<body>
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Meeting Scheduled</h2>
        
        <table style="border-collapse: collapse; width: 100%;">
            <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Name:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${sanitizedData.name}</td></tr>
            <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Email:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${sanitizedData.email}</td></tr>
            <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Phone:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${sanitizedData.phone}</td></tr>
            <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Start Time:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${new Date(sanitizedData.start).toLocaleString()}</td></tr>
            <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>End Time:</strong></td><td style="border: 1px solid #ddd; padding: 8px;">${new Date(sanitizedData.end).toLocaleString()}</td></tr>
            <tr><td style="border: 1px solid #ddd; padding: 8px;"><strong>Meeting Link:</strong></td><td style="border: 1px solid #ddd; padding: 8px;"><a href="${meetLink}">${meetLink}</a></td></tr>
        </table>
        
        <p>Please join the meeting on time.</p>
    </div>
</body>
</html>`
                });
            }
        } catch (emailError) {
            console.error('Failed to send internal notification email:', emailError);
            // Don't fail the booking if email fails
        }

        return res.json({
            success: true,
            message: 'Meeting booked successfully',
            data: {
                eventId: event.id,
                meetLink,
                startTime: sanitizedData.start,
                endTime: sanitizedData.end
            }
        });

    } catch (error) {
        console.error('Book slot error:', {
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });

        return res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'development' ? error.message : 'Booking failed'
        });
    }
};
