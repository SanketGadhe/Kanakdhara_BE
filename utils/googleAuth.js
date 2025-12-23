const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

function getAuthorizedClient(tokens) {
    if (tokens) oauth2Client.setCredentials(tokens);
    return oauth2Client;
}

function generateAuthUrl() {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['https://www.googleapis.com/auth/calendar'],
    });
}

async function getTokenFromCode(code) {
    return oauth2Client.getToken(code);
}

module.exports = { getAuthorizedClient, generateAuthUrl, getTokenFromCode, oauth2Client };
