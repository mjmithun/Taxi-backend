const mongoose = require('mongoose');

const companyFinanceSchema = new mongoose.Schema({
    year: {
        type: Number,
        required: true
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    cashBox: {
        startBalance: {
            type: Number,
            required: true,
            default: 0
        },
        endBalance: {
            type: Number,
            required: true,
            default: 0
        }
    },
    expenses: {
        tripExpense: { type: Number, default: 0 },
        wages: { type: Number, default: 0 },
        maintenance: { type: Number, default: 0 },
        rent: { type: Number, default: 0 },
        utilities: { type: Number, default: 0 },
        phone: { type: Number, default: 0 },
        insurance: { type: Number, default: 0 },
        advertising: { type: Number, default: 0 },
        accounting: { type: Number, default: 0 },
        miscellaneous: { type: Number, default: 0 },
        loanPayments: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

const CompanyFinance = mongoose.model('CompanyFinance', companyFinanceSchema);

module.exports = CompanyFinance;
