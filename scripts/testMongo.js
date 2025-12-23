const mongoose = require('mongoose');
require('dotenv').config();

const url = process.env.MONGODB_URL;
console.log('Using MONGODB_URL:', url);

(async () => {
    try {
        const conn = await mongoose.connect(url);
        console.log('✅ Connected to MongoDB:', conn.connection.host);
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Connection error:', err && err.message ? err.message : err);
        if (err && err.stack) console.error(err.stack);
        process.exit(1);
    }
})();
