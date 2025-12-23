const {
    getBusySlots,
    bookMeeting,
} = require('../services/googleCalendar.service');
const { sendMailToUser } = require('../services/mailService');
const { buildMeetingEmail } = require('../static/mailContent');

/**
 * GET /calendar/availability
 * Public – no auth required
 */
exports.getAvailability = async (req, res) => {
    try {
        const { timeMin, timeMax } = req.query;

        if (!timeMin || !timeMax) {
            return res.status(400).json({
                error: 'timeMin and timeMax are required',
            });
        }

        const busySlots = await getBusySlots({ timeMin, timeMax });

        res.json({
            success: true,
            busy: busySlots,
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch availability',
        });
    }
};



exports.bookSlot = async (req, res) => {
    try {
        const {
            start,
            end,
            email,
            title = 'Introduction Call',
            description = 'Hello Sir, I am Sending the mail for the schedule meeting',
        } = req.body;

        if (!start || !end || !email) {
            return res.status(400).json({
                error: 'start, end and email are required',
            });
        }

        // 🔒 Optional: re-check availability here (recommended)

        const event = await bookMeeting({
            title,
            description,
            start,
            end,
            clientEmail: email,
        });

        // 🔍 Google sometimes returns Meet link in different places
        const meetLink =
            event.hangoutLink ||
            event.conferenceData?.entryPoints?.find(
                (e) => e.entryPointType === 'video'
            )?.uri ||
            null;
        const { Subject, Message } = buildMeetingEmail(meetLink)
        const sentMailResult = await sendMailToUser({
            toEmail: email,
            subject: Subject,
            message: Message,
        });
        const sentMailTOClient = await sendMailToUser({
            toEmail: "connect@kanakdharainv.com",
            subject: "A User From Website has Schedule the Meeting",
            message: `
            Hey Chetan,
                A User from the website has schedule a meeting with meeting link: ${meetLink}. Pls Join the meeting on Time
                Thanks
                Sanket Gadhe`
        })
        return res.json({
            success: true,
            eventId: event.id,
            meetLink,
        });
    } catch (error) {
        console.error('Book slot error:', error);

        return res.status(500).json({
            error: 'Booking failed',
        });
    }
};
