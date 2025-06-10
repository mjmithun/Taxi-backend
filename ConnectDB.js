const mongoose = require('mongoose');
require('dotenv').config();
const DB = process.env.DB_URL;
const connectDB = async () => {
    try {
        await mongoose.connect(
            `${DB}`
        );
        console.log("MongoDB connected");
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
