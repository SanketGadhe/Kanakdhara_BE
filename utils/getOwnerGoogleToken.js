module.exports.getOwnerGoogleTokens = () => ({
    access_token: process.env.GOOGLE_ACCESS_TOKEN,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});
