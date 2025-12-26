// scripts/setupGoogleAuth.js
const { google } = require('googleapis');
const readline = require('readline');

// Add these to your .env file first:
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/google/callback';

const SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/calendar'
];

async function getRefreshToken() {
    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.error('❌ Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file first');
        process.exit(1);
    }

    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

    // Generate auth URL
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent'
    });

    console.log('🔗 Open this URL in your browser:');
    console.log(authUrl);
    console.log('\n📋 After authorization, copy the code from the URL and paste it below:');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Enter the authorization code: ', async (code) => {
        try {
            const { tokens } = await oauth2Client.getToken(code);
            
            console.log('\n✅ Success! Add these to your .env file:');
            console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
            console.log(`GOOGLE_ACCESS_TOKEN=${tokens.access_token}`);
            
            if (tokens.refresh_token) {
                console.log('\n🎉 Setup complete! Your refresh token is ready to use.');
            } else {
                console.log('\n⚠️  No refresh token received. Make sure to revoke existing permissions and try again.');
            }
            
        } catch (error) {
            console.error('❌ Error getting tokens:', error.message);
        }
        
        rl.close();
    });
}

if (require.main === module) {
    require('dotenv').config();
    getRefreshToken();
}

module.exports = { getRefreshToken };