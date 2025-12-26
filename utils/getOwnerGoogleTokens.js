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
 * Persist owner tokens into the database
 * tokens: { access_token, refresh_token, scope, token_type, expiry_date }
 */
async function saveOwnerGoogleTokens(tokens = {}) {
    const {
        access_token, refresh_token, scope, token_type,
        expiry_date
    } = tokens;
    
    if (!access_token || !refresh_token) {
        throw new Error('Missing access_token or refresh_token');
    }

    try {
        // Remove existing tokens first
        await googleAuth.deleteMany({});
        
        // Create a new GoogleAuth instance with the provided tokens
        const googleAuthInstance = new googleAuth({
            access_token,
            refresh_token,
            scope,
            token_type,
            expiry_date
        });

        // Save the instance to the database
        await googleAuthInstance.save();
        console.log('GoogleAuth tokens saved successfully to database');
        
    } catch (error) {
        console.error('Error saving GoogleAuth tokens:', error);
        throw error;
    }
}

module.exports = {
    getOwnerGoogleTokens,
    saveOwnerGoogleTokens,
};
