const googleAuth = require('../models/googleAuth.model')

async function getOwnerGoogleTokens() {
    try {
        const tokens = await googleAuth.findOne();
        if (!tokens) {
            throw new Error('No tokens found');
        }

        const { access_token, refresh_token } = tokens;
        return { access_token, refresh_token };

    } catch (error) {
        console.error('Error retrieving tokens:', error);
        throw error;
    }
}

/**
 * Persist owner tokens into the project's .env as a base64-encoded JSON string
 * This overwrites or appends the `SAVE_OWNERS_TOKEN` entry.
 * tokens: { access_token, refresh_token }
 */
function saveOwnerGoogleTokens(tokens = {}) {
    const {
        access_token, refresh_token, scope, token_type,
        expiry_date
    } = tokens;
    if (!access_token || !refresh_token) {
        throw new Error('Missing access_token or refresh_token');
    }

    // Create a new GoogleAuth instance with the provided tokens
    const googleAuthInstance = new googleAuth({
        access_token,
        refresh_token,
        scope,
        token_type,
        expiry_date
    });

    // Save the instance to the database
    googleAuthInstance.save()
        .then(() => {
            console.log('GoogleAuth instance saved successfully');
        })
        .catch((error) => {
            console.error('Error saving GoogleAuth instance:', error);
        });
}

module.exports = {
    getOwnerGoogleTokens,
    saveOwnerGoogleTokens,
};
