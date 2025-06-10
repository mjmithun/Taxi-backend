const mongoose = require("mongoose");
const Driver = require("./models/driverModel"); // Adjust the path as needed

// Connect to the database
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://sarapavansriram:p%40V%40n*IIV0III@ac-yytfqbz-shard-00-00.utsng4a.mongodb.net:27017,ac-yytfqbz-shard-00-01.utsng4a.mongodb.net:27017,ac-yytfqbz-shard-00-02.utsng4a.mongodb.net:27017/travels_table?ssl=true&replicaSet=atlas-32cixo-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Travels", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error", error);
    process.exit(1);
  }
};

// Function to update currentCar to null for all drivers
const updateDrivers = async () => {
  try {
    // Update all drivers to set currentCar to null
    const result = await Driver.updateMany({}, { $set: { currentCar: null } });
    console.log(`${result.modifiedCount} drivers updated to set currentCar to null.`);
  } catch (error) {
    console.error("Error updating drivers:", error);
  }
};

// Main function to execute migration
const main = async () => {
  await connectDB();
  await updateDrivers();
  // Close the connection
  mongoose.connection.close();
};

// Execute the main function
main();
