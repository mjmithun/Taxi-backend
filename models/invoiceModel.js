const mongoose = require('mongoose');

// Invoice schema definition
const invoiceSchema = new mongoose.Schema({
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
    trip: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',
        required: true
    },
    issuedDate: {
        type: Date,
        default: Date.now
    },
    totalKm: {
        type: Number,
        required: true,
        min: 0 
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0 
    },
    paymentDate: {
        type: Date,
        default : Date.now
    },
    remarks: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});



const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;
