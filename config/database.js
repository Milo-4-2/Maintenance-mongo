// ============================================
// Database Configuration
// Establishes connection to MongoDB using
// the MONGO_URI from environment variables.
// Exits the process if connection fails.
// ============================================

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Attempt connection using URI from .env
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(` MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(` Error: ${error.message}`);
        process.exit(1); // Stop the server if DB is unreachable
    }
};

module.exports = connectDB;