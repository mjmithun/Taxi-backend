const express = require("express");
const router = express.Router();
const Driver = require("../models/driverModel.js");
const User = require("../models/userModel.js");
const { authMiddleware, adminMiddleware } = require("../authMiddleware.js");

router.post("/add",authMiddleware,adminMiddleware, async (req, res) => {
  const {
    name,
    licenseNumber,
    contactNumber,
    email,
    address,
    dateOfBirth,
    password, 
  } = req.body;

  try {

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // Create new user instance
    const newUser = new User({
      name,
      email,
      password,
      role: "driver",
    });

    // Save the new user to the database
    await newUser.save();

    // Create new driver instance and associate userId from newUser
    const newDriver = new Driver({
      name,
      licenseNumber,
      contactNumber,
      email,
      address,
      dateOfBirth,
      status : "available",
      password, 
      user: newUser._id, 
    });

    
    await newDriver.save();

    res.status(201).json(newDriver);
  } catch (error) {
    console.error("Error adding driver:", error);
    res.status(400).json({ message: error.message });
  }
});



router.get("/",authMiddleware,adminMiddleware, async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.status(200).json(drivers);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ message: error.message });
  }
});

// Driver Stats
router.get("/stats",authMiddleware,adminMiddleware, async (req, res) => {
  try {
    const totalDrivers = await Driver.countDocuments();
    const availableDrivers = await Driver.countDocuments({ status: "available" });
    const inTripDrivers = await Driver.countDocuments({
      status: "in-trip",
    });

    res.status(200).json({
      totalDrivers,
      availableDrivers,
      inTripDrivers,
    });
  } catch (error) {
    console.error("Error fetching driver statistics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.delete("/:id",authMiddleware,adminMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const driver = await Driver.findByIdAndDelete(id);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    
    await User.findOneAndDelete({ email: driver.email });

    res.status(200).json({ message: "Driver and associated user deleted successfully" });
  } catch (error) {
    console.error("Error deleting driver and user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.get("/:id",authMiddleware,adminMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.status(200).json(driver);
  } catch (error) {
    console.error("Error fetching driver details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:id", authMiddleware,adminMiddleware,async (req, res) => {
  const { id } = req.params;
  const {
      name,
      licenseNumber,
      contactNumber,
      email,
      address,
      dateOfBirth,
      status,
      password,
  } = req.body;

  try {
      const updates = {
          name,
          licenseNumber,
          contactNumber,
          email,
          address,
          dateOfBirth,
          status,
          password,
      };

      
      if (password) {
          updates.password = password; 
      }

      const driver = await Driver.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
      
      if (!driver) {
          return res.status(404).json({ message: "Driver not found" });
      }

      res.status(200).json(driver);
  } catch (error) {
      console.error("Error updating driver:", error);
      res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
