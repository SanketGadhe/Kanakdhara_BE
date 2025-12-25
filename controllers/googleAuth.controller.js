const { saveOwnerGoogleTokens } = require('../utils/getOwnerGoogleTokens');
const { generateAuthUrl, getTokenFromCode } = require('../utils/googleAuth');

// 1️⃣ Redirect owner to Google consent screen
exports.googleAuth = (req, res) => {
    const authUrl = generateAuthUrl();
    res.redirect(authUrl);
};

// 2️⃣ Google redirects here with code
exports.googleCallback = async (req, res) => {
    try {
        const { code } = req.query;

        const tokens = await getTokenFromCode(code);

        // Persist tokens (access_token, refresh_token, etc.)
        await saveOwnerGoogleTokens(tokens);

        res.send('Google Calendar connected successfully ✅ - tokens saved');
    } catch (err) {
        console.error('googleCallback error:', err);
        res.status(500).send('Google authentication failed');
    }
};
