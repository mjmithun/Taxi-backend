const mongoose = require('mongoose');
const tripSchema = new mongoose.Schema({
    car: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car',
        required: true
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    
    startKm: {  
        type: Number,
        required: true,
        min: 0
    },
    endKm: {    
        type: Number,
        required: false,  
        min: 0
    },
    startDate: {  
        type: Date,
        required: true
    },
    endDate: {    
        type: Date,
        required: false  
    },
    fare: {
        type: Number,
        required: true,
        min: 0 
    },
    fareType: {
        type: String,
        enum: ['day', 'km'], 
        required: true
    },
    advance: {
        type: Number,
        default: 0,
        min: 0 
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled','review'],
        default: 'pending'
    },
    balance: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    discount:{
        type: Number,
        default: 0,
    }, 
    gstAmount:{
        type: Number,
        default: 0,
    },
    gstPercentage:{
        type: Number,
        default: 0,
    },
    tripExpense:{
        type: Number,
        default: 0,
    }, 
    remarks: { 
        type: String,
        trim: true
    },
    income: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Income',
        default: null
    },
    invoiceNumber: {
        type: String,
        unique: true, 
        required: true, 
    },
    // invoice: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Invoice',
    //     default: null
    // }
}, {
    timestamps: true
});

const Trip = mongoose.model('Trip', tripSchema);
module.exports = Trip;
