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
        
        if (!code) {
            throw new Error('No authorization code received');
        }
        
        console.log('Received authorization code, exchanging for tokens...');
        const tokens = await getTokenFromCode(code);
        
        console.log('Tokens received:', {
            has_access_token: !!tokens.access_token,
            has_refresh_token: !!tokens.refresh_token,
            scope: tokens.scope
        });

        if (!tokens.access_token) {
            throw new Error('No access token received from Google');
        }
        
        if (!tokens.refresh_token) {
            return res.status(400).send(`
                <h2>❌ No Refresh Token Received</h2>
                <p>This usually happens when you've already authorized this app before.</p>
                <h3>To fix this:</h3>
                <ol>
                    <li>Go to <a href="https://myaccount.google.com/permissions" target="_blank">Google Account Permissions</a></li>
                    <li>Find and remove "Kanakdhara Investments" (or your app name)</li>
                    <li>Try the authorization again: <a href="/api/google/auth">Click here</a></li>
                </ol>
                <p>Or use this direct revoke link and try again:</p>
                <a href="https://accounts.google.com/o/oauth2/revoke?token=${tokens.access_token}" target="_blank">Revoke Access</a>
            `);
        }

        // ✅ STORE TOKENS
        await saveOwnerGoogleTokens({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            scope: tokens.scope,
            token_type: tokens.token_type,
            expiry_date: tokens.expiry_date
        });

        res.send(`
            <h2>✅ Google Connected Successfully!</h2>
            <p>Refresh token has been saved to the database.</p>
            <p>You can now close this window and use the API.</p>
        `);
        
    } catch (err) {
        console.error('googleCallback error:', err);
        res.status(500).send(`
            <h2>❌ Google Authentication Failed</h2>
            <p>Error: ${err.message}</p>
            <p><a href="/api/google/auth">Try again</a></p>
        `);
    }
};
