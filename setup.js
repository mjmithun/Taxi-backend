const { MongoClient } = require('mongodb');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const url = process.env.DB_URL; 
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

const dbName = 'travels_table'; 

async function setupDatabase() {
    try {
        await client.connect();
        console.log("Connected successfully to MongoDB Atlas");

        const db = client.db(dbName);

        // Create Users Collection
        const usersCollection = db.collection('users');

        // Check if the users collection is empty (to avoid duplicates)
        const existingUsers = await usersCollection.countDocuments();
        if (existingUsers > 0) {
            console.log("Users collection already contains data. Skipping insertion.");
            return;
        }

        // Hash the passwords before storing them
        const hashedAdminPassword = await bcrypt.hash('password123', 10);
        const hashedDriverPassword = await bcrypt.hash('password123', 10);

        // Insert sample users
        await usersCollection.insertMany([
            {
                username: "admin1",
                password: hashedAdminPassword, // Store hashed password
                role: "admin",
            },
            {
                username: "driver1",
                password: hashedDriverPassword, // Store hashed password
                role: "driver",
            }
        ]);
        console.log("Users collection created with admin and driver");

    } catch (error) {
        console.error("Error setting up database:", error);
    } finally {
        await client.close();
    }
}

setupDatabase();
