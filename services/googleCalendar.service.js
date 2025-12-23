const { google } = require('googleapis');
const { getAuthorizedClient } = require('../utils/googleAuth');
const { getOwnerGoogleTokens } = require('../utils/getOwnerGoogleTokens');
const { sendMailToUser } = require('./mailService');

const getCalendarClient = () => {
    const tokens = getOwnerGoogleTokens();
    const authClient = getAuthorizedClient(tokens);
    return google.calendar({ version: 'v3', auth: authClient });
};


/**
 * 1️⃣ Get busy slots (for availability)
 */
const getBusySlots = async ({ timeMin, timeMax }) => {
    const calendar = getCalendarClient();
    // console.log("Calendar Client:", calendar);

    const response = await calendar.freebusy.query({
        requestBody: {
            timeMin,
            timeMax,
            items: [{ id: 'primary' }],
        },
    });
    console.log("Freebusy Response:", response.data);

    return response.data.calendars.primary.busy;
};

/**
 * 2️⃣ Book meeting (blocks owner calendar + sends invite)
 */
const bookMeeting = async ({
    title,
    description,
    start,
    end,
    clientEmail,
}) => {
    const calendar = getCalendarClient();

    const event = {
        summary: title,
        description,
        start: { dateTime: start },
        end: { dateTime: end },
        attendees: [{ email: clientEmail }],
        conferenceData: {
            createRequest: {
                requestId: `meet-${Date.now()}`, // MUST be unique
                conferenceSolutionKey: {
                    type: 'hangoutsMeet',
                },
            },
        },
        reminders: { useDefault: true },
    };

    const response = await calendar.events.insert({
        calendarId: 'primary',
        sendUpdates: 'all',
        conferenceDataVersion: 1, // 🔴 REQUIRED
        requestBody: event,
    });

    return response.data;
};

module.exports = {
    getBusySlots,
    bookMeeting,
};
