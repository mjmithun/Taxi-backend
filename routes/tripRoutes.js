    const express = require("express");
    const bodyParser = require('body-parser');
    const router = express.Router();
    const Trip = require("../models/tripModel.js");
    const Driver = require('../models/driverModel.js');
    const Car = require("../models/carModel.js")
    const Invoice =  require("../models/invoiceModel.js");
    const Income = require("../models/incomeModel.js");
    const Customer = require("../models/customerModel.js");
    const { authMiddleware, adminMiddleware, driverMiddleware } = require("../authMiddleware.js");
    const {generateInvoicePDF} = require('../services/generateInvoice.js');
    const {sendInvoiceByEmail} = require('../services/gmailService.js');
    // const {sendInvoiceViaWhatsApp} = require('../services/whatsappService.js');
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));


    const generateInvoiceNumber = async () => {
        const prefix = "INV";
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ""); 
        const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); 
        return `${prefix}${datePart}${randomPart}`;
    };





    //Admin's Part

    router.get("/admin", authMiddleware, adminMiddleware, async (req, res) => {
        try {
            const trips = await Trip.find().populate('car driver customer');
            res.status(200).json(trips);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });
    // Admin's request to get pending reviews
    router.get("/admin/pending", authMiddleware, adminMiddleware, async (req, res) => {
       
    
        try {
            const pendingTrips = await Trip.where('status').equals('review')
                .populate('driver')
                .populate('car')
                .populate('customer');
    
            if (!pendingTrips.length) {
                return res.status(404).json({ message: "No trips are pending review" });
            }
            res.status(200).json({ message: "Trips pending review", trips: pendingTrips });
        } catch (error) {
            console.error("Error fetching pending trips:", error);
            res.status(500).json({ message: "An error occurred while fetching pending trips", error: error.message });
        }
    });
    
    router.post("/admin/add", authMiddleware, adminMiddleware, async (req, res) => { 
        const { car, driver, startKm, fare, fareType, advance, customerName, customerPhoneNumber, customerAadhaarNumber, customerAddress,customerEmail,startDate } = req.body; 
    
        try {
            // Validate driver availability
            const driverData = await Driver.findById(driver);
            if (!driverData || driverData.status !== 'available') {
                return res.status(400).json({ message: "Driver is either unavailable or inactive." });
            }
            if (driverData.status === 'in-trip') {
                return res.status(400).json({ message: "Driver is currently assigned to another trip." });
            }
    
            // Validate car availability
            const carData = await Car.findById(car);
            if (!carData || carData.status !== 'available') {
                return res.status(400).json({ message: "Car is currently in use or unavailable." });
            }

            let customer = await Customer.findOne({ contactNumber: customerPhoneNumber });
           
            if (!customer) {
                customer = new Customer({
                    name: customerName,
                    contactNumber: parseInt(customerPhoneNumber),
                    AadhaarNo:parseInt(customerAadhaarNumber),
                    email: customerEmail,
                    address: customerAddress,
                    trips: [],
                    numberOfTrips: 0,
                });
                await customer.save();
            }
                
            const invoNo = await generateInvoiceNumber();
            // Create a new trip instance
            const newTrip = new Trip({
                car,
                driver,
                startKm,
                endKm:  null,  // Use provided endKm or null
                startDate: startDate,  // Use current date for startDate
                endDate: null,           // Initially, endDate is null
                fare,
                fareType,                // Include fareType from request body
                status: 'pending',
                advance: parseInt(advance) || 0,
                customer: customer._id,
                invoiceNumber : invoNo,
            });
    
            // Save the new trip
            await newTrip.save();        
    
            // Update driver data
            driverData.trips.push(newTrip._id);
            driverData.status = 'in-trip'; 
            driverData.currentCar = carData._id;
            driverData.numberOfTrips = (driverData.numberOfTrips || 0) + 1; // Increment numberOfTrips
            await driverData.save();
    
            // Update car data
            carData.trips.push(newTrip._id);
            carData.status = 'in-trip'; 
            carData.currentDriver = driverData._id;
            carData.numberOfTrips = (carData.numberOfTrips || 0) + 1; // Increment numberOfTrips
            await carData.save();

            //Update customer data
            customer.trips.push(newTrip._id);
            customer.numberOfTrips += 1;
            await customer.save();
    
            // Respond with the created trip
            res.status(201).json(newTrip);
        } catch (error) {
            console.error("Error creating trip:", error);
            res.status(500).json({ message: error.message });
        }
    });
    

    router.get("/admin/:id",authMiddleware,adminMiddleware, async (req, res) => {
        const { id } = req.params;
        try {
            const trip = await Trip.findById(id).populate('car driver customer');

            if (!trip) {
                return res.status(404).json({ message: "Trip not found" });
            }

            if (req.user.role === 'driver' && trip.driver.toString() !== req.user.userId.toString()) {
                return res.status(403).json({ message: "Access denied" });
            }

            res.status(200).json(trip);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });


   // PUT request to update trip information, ensuring admin and auth middleware validation
    router.put("/admin/:id", authMiddleware, adminMiddleware, async (req, res) => {
        const { id } = req.params; // Extract trip id from params
        const updates = req.body; // Extract updates from request body

        try {
            // Find the current trip and populate related car and driver information
            const trip = await Trip.findById(id).populate('car driver customer');
            
            // If trip is not found, return 404 error
            if (!trip) {
                return res.status(404).json({ message: "Trip not found" });
            }

            // Flags to track if car or driver is changed
            let isCarChanged = false;
            let isDriverChanged = false;
            
        // Handle customer changes
        if (updates.customerPhoneNumber && updates.customerPhoneNumber !== trip.customer?.contactNumber) {
            // Remove the trip reference from the old customer
            if (trip.customer) {
                const oldCustomer = await Customer.findById(trip.customer); // Fetch the old customer
                if (oldCustomer) {
                    oldCustomer.trips.pull(trip._id);
                    oldCustomer.numberOfTrips = oldCustomer.trips.length; // Update the number of trips

                    await oldCustomer.save(); // Save the old customer document
                }
            }
        
            // Check if a customer with the new phone number already exists
            let newCustomer = await Customer.findOne({ contactNumber: updates.customerPhoneNumber });
        
            // If not, create a new customer
            if (!newCustomer) {
                const newCustomerData = {
                    name: updates.customerName || "New Customer", // Default name if not provided
                    contactNumber: updates.customerPhoneNumber,
                    AadhaarNo: updates.customerAadhaarNumber || "000000000000", // Default Aadhaar if not provided
                    email: updates.customerEmail || null,
                    address: updates.customerAddress || "",
                    trips: [trip._id],
                    numberOfTrips: 1,
                };
                newCustomer = await Customer.create(newCustomerData);
            } else {
                // Ensure the trip is not already in the trips array of the new customer
                if (!newCustomer.trips.includes(trip._id)) {
                    newCustomer.trips.push(trip._id); // Add the trip to the new customer
                }
                newCustomer.numberOfTrips = newCustomer.trips.length; // Update the number of trips
                await newCustomer.save(); // Save the new customer document
            }
        
            // Update the trip's customer reference
            trip.customer = newCustomer._id;
            await trip.save(); // Save the updated trip
        }
        
        
        else if ((updates.customerAadhaarNumber  || updates.customerName || updates.customerEmail  ||updates.customerAddress) && trip.customer) {
            // Create an object to hold the fields that need to be updated
            const updateFields = {};
        
            if (updates.customerName && updates.customerName !== trip.customer.name) {
                updateFields.name = updates.customerName;
            }
            if (updates.customerAadhaarNo && updates.customerAadhaarNo !== trip.customer.AadhaarNo) {
                updateFields.AadhaarNo = updates.customerAadhaarNo;
            }
            if (updates.customerEmail && updates.customerEmail !== trip.customer.email) {
                updateFields.email = updates.customerEmail;
            }
            if (updates.customerAddress && updates.customerAddress !== trip.customer.address) {
                updateFields.address = updates.customerAddress;
            }
        
            if (Object.keys(updateFields).length > 0) {
                await Customer.findByIdAndUpdate(
                    trip.customer,
                    {
                        $set: updateFields,
                    },
                    { new: true }
                );
            }
        }
            // Case: Both car and driver are being updated
            if ((updates.car && updates.car.toString() !== trip.car.toString()) &&
                (updates.driver && updates.driver.toString() !== trip.driver.toString())) {
                
                isCarChanged = true;
                isDriverChanged = true;

                // Fetch new and current car/driver data
                const newCar = await Car.findById(updates.car);
                const newDriver = await Driver.findById(updates.driver);
                const currCar = await Car.findById(trip.car);
                const currDriver = await Driver.findById(trip.driver);

                // Error handling: Check if new car and driver exist
                if (!newCar) {
                    return res.status(404).json({ message: "Selected Car not found" });
                }
                if (!newDriver) {
                    return res.status(404).json({ message: "Selected Driver not found" });
                }

                // Update current car: Remove trip, set car status and driver to null
                currCar.trips.pop();
                currCar.numberOfTrips = currCar.trips.length;
                currCar.currentDriver = null;
                currCar.status = "available";
                await currCar.save();

                // Update new car: Add trip, assign driver, set status to "in-trip"
                newCar.currentDriver = newDriver;
                newCar.trips.push(trip.id);
                newCar.numberOfTrips = newCar.trips.length;
                newCar.status = "in-trip";
                newCar.currentDriver = newDriver;
                await newCar.save();

                // Update current driver: Remove trip, set status and car to null
                currDriver.trips.pop();
                currDriver.numberOfTrips = currDriver.trips.length;
                currDriver.currentCar = null;
                currDriver.status = "available";
                await currDriver.save();

                // Update new driver: Add trip, assign car, set status to "in-trip"
                newDriver.trips.push(trip.id);
                newDriver.numberOfTrips = newDriver.trips.length;
                newDriver.currentCar = newCar; // Assign the new car
                newDriver.status = "in-trip";
                newDriver.currentCar = newCar;
                await newDriver.save();


            // Case: Only car is being updated
            } else if (updates.car && updates.car.toString() !== trip.car.toString()) {
                isCarChanged = true;

                // Fetch new and current car data
                const newCar = await Car.findById(updates.car);
                const currCar = await Car.findById(trip.car);
                const currDriver = await Driver.findById(trip.driver);

                // Error handling: Check if new car exists
                if (!newCar) {
                    return res.status(400).json({ message: "New car not found" });
                }

                // Update current car: Remove trip, set car status and driver to null
                currCar.trips.pop();
                currCar.numberOfTrips = currCar.trips.length;
                currCar.currentDriver = null;
                currCar.status = "available";
                await currCar.save();

                // Update new car: Add trip, assign driver, set status to "in-trip"
                newCar.currentDriver = trip.driver;
                newCar.trips.push(trip.id);
                newCar.numberOfTrips = newCar.trips.length;
                newCar.status = "in-trip";
                await newCar.save();

                currDriver.currentCar = newCar;
                await currDriver.save();
            // Case: Only driver is being updated
            } else if (updates.driver && updates.driver.toString() !== trip.driver.toString()) {
                isDriverChanged = true;

                // Fetch new and current driver data
                const newDriver = await Driver.findById(updates.driver);
                const currDriver = await Driver.findById(trip.driver);
                const currCar = await Car.findById(trip.car);
                // Error handling: Check if new driver exists
                if (!newDriver) {
                    return res.status(400).json({ message: "New driver not found" });
                }

                // Update current driver: Remove trip, set status and car to null
                currDriver.trips.pop();
                currDriver.numberOfTrips = currDriver.trips.length;
                currDriver.currentCar = null;
                currDriver.status = "available";
                await currDriver.save();

                // Update new driver: Add trip, assign car, set status to "in-trip"
                newDriver.trips.push(trip.id);
                newDriver.numberOfTrips = newDriver.trips.length;
                newDriver.currentCar = trip.car;
                newDriver.status = "in-trip";
                await newDriver.save();

                currCar.currentDriver = newDriver;
                await currCar.save();
            }

            // Perform the update on the trip document
            const updatedTrip = await Trip.findByIdAndUpdate(id, updates, { new: true });

            // Error handling: Check if update succeeded
            if (!updatedTrip) {
                return res.status(404).json({ message: "Trip update failed or trip not found" });
            }

            // Log changes if car or driver was updated
            // if (isCarChanged && isDriverChanged) {
            //     console.log("Both car and driver updated");
            // } else if (isCarChanged) {
            //     console.log(`Car updated for trip ${id}`);
            // } else if (isDriverChanged) {
            //     console.log(`Driver updated for trip ${id}`);
            // }

            // Send success response with the updated trip
            res.status(200).json(updatedTrip);

        } catch (error) {
            // Handle any unexpected errors
            res.status(500).json({ message: error.message });
        }
    });


    router.delete("/admin/:id", authMiddleware, adminMiddleware, async (req, res) => {
        const { id } = req.params;

        try {
            const trip = await Trip.findById(id);

            if (!trip) {
                return res.status(404).json({ message: "Trip not found" });
            }
            const driverData = await Driver.findById(trip.driver);
            if (driverData) {
                driverData.trips.pull(trip._id); 
                driverData.numberOfTrips = driverData.trips.length;
                driverData.status = 'available'; 
                driverData.currentCar = null;
                await driverData.save();
            }

            // Remove trip reference from the car
            const carData = await Car.findById(trip.car);
            if (carData) {
                carData.trips.pull(trip._id); 
                carData.numberOfTrips = carData.trips.length;
                carData.status = 'available'; 
                carData.currentDriver = null;
                await carData.save();
            }

            // Remove trip reference from the customer

            const customerData = await Customer.findById(trip.customer);
            if (customerData) {
                customerData.trips.pull(trip._id); 
                customerData.numberOfTrips = customerData.trips.length;
                await customerData.save();
            }

            // Delete the trip
            await Trip.findByIdAndDelete(id);

            res.status(200).json({ message: "Trip deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }); 

    // Ending a Trip By Admin
    router.post("/admin/:id/end", authMiddleware, adminMiddleware, async (req, res) => {
        const { id } = req.params;
        const { endKm ,endDate} = req.body;
    
        if (!endKm) {
            return res.status(400).json({ message: "Please provide endKm" });
        }
    
        try {
            const trip = await Trip.findById(id);
            if (!trip) {
                return res.status(404).json({ message: "Trip not found" });
            }
    
            
            // Check if the trip is still pending
            if (trip.status !== 'pending') {
                return res.status(400).json({ message: "Trip is already completed or cancelled" });
            }
    
            // Validate endKm to make sure it's greater than startKm
            if (endKm <= trip.startKm) {
                return res.status(400).json({ message: "EndKm must be greater than startKm." });
            }

            const driverData = await Driver.findById(trip.driver);
            if (driverData) {
                driverData.currentCar = null;  // Set the current car to null
                driverData.status = 'available'; // Update status to available
                await driverData.save();
            } else {
                console.error("Driver not found for trip:", trip.driver);
            }
    
            // Update car details
            const carData = await Car.findById(trip.car);
            if (carData) {
                carData.currentDriver = null;  // Set current driver to null
                carData.status = "available";  // Update car status to available
               
                await carData.save();
            } else {
                console.error("Car not found for trip:", trip.car);
            }
            
            
            trip.endKm = endKm;
            trip.endDate = endDate; 
            trip.status = 'review';  
    
            await trip.save();
    
            res.status(200).json({ message: "Trip details submitted for admin review", trip });
    
        } catch (error) {
            console.error("Error ending trip:", error);
            res.status(500).json({ message: error.message });
        }
    });
    
    
    //Driver's part

    router.get("/driver", authMiddleware,driverMiddleware, async (req, res) => {
        try {
            const driver = await Driver.findOne({ user: req.user.userId });
            if (!driver) {
                return res.status(404).json({ message: "Driver not found" });
            }
            const trips = await Trip.find({ driver: driver._id }).populate('car driver');
            res.status(200).json(trips);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });


    router.post("/driver/:id/end", authMiddleware, driverMiddleware, async (req, res) => {
        const { id } = req.params;
        const { endKm,endDate,tripExpense} = req.body;

        try {
            const trip = await Trip.findById(id).populate('driver');

            if (!trip) {
                return res.status(404).json({ message: "Trip not found" });
            }

            
            if (trip.driver.user.toString() !== req.user.userId.toString()) {
                return res.status(403).json({ message: "Access denied" });
            }

            
            if (trip.status !== 'pending') {
                return res.status(400).json({ message: "Trip is already completed or cancelled" });
            }

            
            if (endKm <= trip.startKm) {
                return res.status(400).json({ message: "EndKm must be greater than startKm." });
            }

            const driverData = await Driver.findById(trip.driver);
            if (driverData) {
                driverData.currentCar = null;  // Set the current car to null
                driverData.status = 'available'; // Update status to available
                await driverData.save();
            } else {
                console.error("Driver not found for trip:", trip.driver);
            }
    
            // Update car details
            const carData = await Car.findById(trip.car);
            if (carData) {
                carData.currentDriver = null;  // Set current driver to null
                carData.status = "available";  // Update car status to available
                await carData.save();
            } else {
                console.error("Car not found for trip:", trip.car);
            }
    
            trip.endKm = endKm;
            trip.endDate = endDate;
            trip.tripExpense = tripExpense;
            trip.status = 'review';  
    
            await trip.save();
    
            res.status(200).json({ message: "Trip details submitted for admin review", trip });
    
        } catch (error) {
            console.error("Error ending trip:", error);
            res.status(500).json({ message: error.message });
        }
    });


    //Admin's Finalise API
    router.get("/admin/pending", authMiddleware, adminMiddleware, async (req, res) => {
        try {
            const pendingTrips = await Trip.where('status').equals('review')
                .populate('driver')
                .populate('car')
                .populate('customer');
    
            if (!pendingTrips.length) {
                
                return res.status(404).json({ message: "No trips are pending review" });
            }
            res.status(200).json({ message: "Trips pending review", trips: pendingTrips });
        } catch (error) {
            console.error("Error fetching pending trips:", error);
            res.status(500).json({ message: "An error occurred while fetching pending trips", error: error.message });
        }
    });

    router.get("/admin/pending/:id", authMiddleware, adminMiddleware, async (req, res) => {
        const { id } = req.params;
        try {
            const pendingtrip = await Trip.findOne({ _id: id, status: 'review' })
                .populate('car')
                .populate('driver')
                .populate('customer');
            if (!pendingtrip) {
                return res.status(404).json({ message: "Trip not found or not pending review" });
            }
            if (req.user.role === 'driver' && pendingtrip.driver._id.toString() !== req.user.userId.toString()) {
                return res.status(403).json({ message: "Access denied" });
            }
            res.status(200).json(pendingtrip);
        } catch (error) {
            console.error("Error fetching trip:", error);
            res.status(500).json({ message: "An error occurred while fetching the trip", error: error.message });
        }
    });
    
    
    

    router.post("/admin/:id/finalize-trip", authMiddleware, adminMiddleware, async (req, res) => {
        const { id } = req.params;
        let { discount, tripExpense, balance,gstAmount,gstPercentage } = req.body; 
    
        try {
            const trip = await Trip.findById(id).populate('driver').populate('car').populate('customer');
            const carData = await Car.findById(trip.car);
            if (!trip) {
                return res.status(404).json({ message: "Trip not found" });
            }
    
            // Check if the trip is already completed or cancelled
            if (trip.status === 'completed' || trip.status === 'cancelled') {
                return res.status(400).json({ message: "This trip is already completed or canceled" });
            }
            
            discount = parseInt(discount);
            tripExpense = parseInt(tripExpense);
            balance = parseInt(balance);
            gstPercentage = parseInt(gstPercentage);
            gstAmount = parseInt(gstAmount);
           
            if (discount) {
                trip.discount = discount; 
            }
            if (tripExpense) {
                trip.tripExpense = tripExpense;
            }
            if (balance) {
                trip.balance = balance; 
            }
            if(gstAmount){
                trip.gstAmount = gstAmount;
            }
            if(gstPercentage){
                trip.gstPercentage = gstPercentage;
            }

            
            
            const tripIncome = trip.balance + trip.advance - trip.tripExpense;
            carData.income += tripIncome;
            await carData.save();
            const income = new Income({
                trip: trip._id,
                car: trip.car,
                driver: trip.driver,
                tripIncome: tripIncome
            });
            await income.save();
    
           
            trip.income = income._id;
           
            trip.status = 'completed';
    
            await trip.save();
    
            // Send invoice to the customer (via email, etc.)

            const invo = {
                "car": trip.car.make,
                "car_no" : trip.car.registrationNumber,
                "driver": trip.driver.name,
                "customerName": trip.customer.name,
                "customerEmail": trip.customer.email,
                "tripId" : trip._id,
                "invoiceNo": trip.invoiceNumber,
                "tripStartDate": trip.startDate,
                "tripEndDate": trip.endDate,
                "tripAdvance": trip.advance,
                "tripBalance": trip.balance,
                "tripIncome": tripIncome,
                "tripStartKm" : trip.startKm,
                "tripEndKm" : trip.endKm,
                "tripKm": trip.endKm - trip.startKm,
                "paymentDate": Date.now(),
                "discount": trip.discount,
                "tripExpense": trip.tripExpense,
                "gstPercentage" : trip.gstPercentage,
                "gstAmount" : trip.gstAmount,
            };
            
    
            const filePath = await generateInvoicePDF(invo);

            await sendInvoiceByEmail(trip.customer.email, filePath);
            // await sendInvoiceViaWhatsApp(trip.customer.contactNumber,`invoices/${trip._id}.pdf`);
            
    
            res.status(200).json({ message: "Trip finalized, invoice generated, and sent to customer", trip });
        } catch (error) {
            console.error("Error finalizing trip:", error);
            res.status(500).json({ message: error.message });
        }
    });
    

    module.exports = router;
