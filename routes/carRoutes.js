const express = require("express");
const router = express.Router();
const Car = require("../models/carModel.js");
const { authMiddleware, adminMiddleware } = require("../authMiddleware.js");

// Add a new Car (Admins only)
router.post("/add", authMiddleware, adminMiddleware, async (req, res) => {
    const {
        vehicleNumber,
        carName,
        model,
    } = req.body;

    try {
        const newCar = new Car({
            registrationNumber: vehicleNumber,
            make: carName || null,
            model: model || null,
            status: "available", 
            numberOfTrips: 0,
            trips: [],
            currentDriver: null,
        });

        await newCar.save();
        res.status(201).json(newCar);
    } catch (error) {
        console.error("Error adding car:", error);
        res.status(400).json({ message: error.message });
    }
});

// Get all Cars (Admins only)
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const cars = await Car.find();
        res.status(200).json(cars);
    } catch (error) {
        console.error("Error fetching cars:", error);
        res.status(500).json({ message: error.message });
    }
});

// Car Stats (Admins only)
router.get("/stats", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const inTripCars = await Car.countDocuments({ status: "in-trip" });
        const availableCars = await Car.countDocuments({ status: "available" });
        const inServiceCars = await Car.countDocuments({ status: "in-service" });

        res.status(200).json({
            inTripCars,
            availableCars,
            inServiceCars,
        });
    } catch (error) {
        console.error("Error fetching car statistics:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete Car (Admins only)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const car = await Car.findByIdAndDelete(id);
        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }
        res.status(200).json({ message: "Car deleted successfully" });
    } catch (error) {
        console.error("Error deleting car:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get specific car details (Admins only)
router.get("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const car = await Car.findById(id);
        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }
        res.status(200).json(car);
    } catch (error) {
        console.error("Error fetching car details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Update Car (Admins only)
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params;
    const {
        vehicleNumber,
        carName,
        model,
        pricePerDay,
        numberOfTrips,
        status,
        notes,
    } = req.body;

    try {
        const updates = {
            registrationNumber: vehicleNumber,
            make: carName,
            model: model,
            pricePerDay: pricePerDay,
            numberOfTrips: numberOfTrips,
            status: status,
            notes: notes,
        };

        const car = await Car.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        
        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }

        res.status(200).json(car);
    } catch (error) {
        console.error("Error updating car:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
