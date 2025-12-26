// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URL) {
            throw new Error('MONGODB_URL environment variable is not defined');
        }

        console.log("🔗 Connecting to MongoDB...");

        const conn = await mongoose.connect(process.env.MONGODB_URL, {
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            bufferCommands: false, // Disable mongoose buffering
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });

    } catch (error) {
        console.error(`❌ MongoDB Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
