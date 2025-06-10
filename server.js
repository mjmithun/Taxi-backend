const mongoose = require("mongoose");
require("dotenv").config();
const Driver = require("./models/driverModel.js"); // Import the Driver model
const connectDB = require("./ConnectDB.js");


const migrateContactNumbers = async () => {
  try {
    const drivers = await Driver.find(); // Fetch all drivers

    // Iterate over each driver and convert contactNumber from string to number
    for (const driver of drivers) {
      if (typeof driver.contactNumber === "string") {
        const contactNumber = parseInt(driver.contactNumber, 10); // Convert to number

        // If the conversion was successful, update the driver
        if (!isNaN(contactNumber)) {
          driver.contactNumber = contactNumber;
          await driver.save(); // Save the updated driver
          console.log(`Updated contactNumber for driver ${driver._id}`);
        } else {
          console.log(`Skipping invalid contactNumber for driver ${driver._id}`);
        }
      }
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error during migration:", error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the migration
(async () => {
  await connectDB();
  await migrateContactNumbers();
})();
