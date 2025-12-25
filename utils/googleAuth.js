const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);
/**
 * Use stored tokens (calendar + gmail)
 */
function getAuthorizedClient(tokens = {}) {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
    if (tokens.refresh_token) {
        oauth2Client.setCredentials({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date, // optional but recommended
        });
    }

    return oauth2Client;
}

/**
 * ONE consent for BOTH Calendar + Gmail
 */
function generateAuthUrl() {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent', // ensures refresh_token
        scope: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/gmail.send',
        ],
    });
}

/**
 * Exchange auth code for tokens
 */
async function getTokenFromCode(code) {
    const { tokens } = await oauth2Client.getToken(code);

    return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date,
    };
}

module.exports = {
    getAuthorizedClient,
    generateAuthUrl,
    getTokenFromCode,
    oauth2Client,
};
