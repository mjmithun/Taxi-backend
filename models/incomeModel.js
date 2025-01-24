const mongoose = require('mongoose');
const incomeSchema = new mongoose.Schema({
    trip: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Trip",
        required: true
    },
    car: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Car",
        required: true
    },
    driver: {
        type:mongoose.Schema.Types.ObjectId,
        ref: "Driver",
        required: true
    },
    tripIncome: {  
        type: Number,
        required: true,
        min: 0,
        default : 0
    },
    driverExpense: {
        type: Number,
        min: 0,
        default: 0 // Optional: Set a default value of 0 if no expense is provided
    },
    carMaintenance: {
        type: Number,
        min: 0,
        default: 0 // Optional: Set a default value of 0 if no maintenance is provided
    },
    extraExpense: {
        type: Number,
        min: 0,
        default: 0 // Optional: Set a default value of 0 if no extra expense is provided
    },
}, {
    timestamps: true
});

const Income = mongoose.model('Income', incomeSchema);

module.exports = Income;
