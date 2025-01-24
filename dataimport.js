const mongoose = require("mongoose");
const fs = require("fs");

// Connect to MongoDB
mongoose
    .connect(
        "mongodb://sarapavansriram:p%40V%40n*IIV0III@ac-yytfqbz-shard-00-00.utsng4a.mongodb.net:27017,ac-yytfqbz-shard-00-01.utsng4a.mongodb.net:27017,ac-yytfqbz-shard-00-02.utsng4a.mongodb.net:27017/table?ssl=true&replicaSet=atlas-32cixo-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Travels"
    )
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB connection error:", err));

// Define Schema and Model
const Schema = mongoose.Schema;
const driverSchema = new Schema({
    Car: String,
    Type: String,
    CarNo: String,
    Fuel: String,
    Transmission: String,
    status: String,
});

// Model name is 'Car', and the collection name is 'car'
const Car = mongoose.model("Car", driverSchema, "Car_list");

// Read JSON File
const filePath = "D:/Gokulam_travels/backend/data/carsample.json"; // Update path here
let data;
try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    console.log("Data read from file:", data);
} catch (err) {
    console.log("Error reading JSON file:", err);
    process.exit(1);
}

// Insert Data
Car.insertMany(data)
    .then(() => {
        console.log("Data inserted successfully");
        mongoose.connection.close(); // Close connection after insertion
    })
    .catch((err) => console.log("Error inserting data:", err));
