const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const googleAuthTokenSchema = new Schema({
    access_token: {
        type: String,
        required: true
    },
    refresh_token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600
    },
    scope: {
        type: String,
        required: true
    },
    token_type: {
        type: String,
        required: true
    },
    expiry_date: {
        type: Date,
        required: true
    }
});
const GoogleAuthSchema = mongoose.model("GoogleAuth", googleAuthTokenSchema);
module.exports = GoogleAuthSchema;