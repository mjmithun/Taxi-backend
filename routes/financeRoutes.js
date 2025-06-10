const express = require('express');
const mongoose = require('mongoose');
const Income = require('../models/incomeModel.js');
const CompanyFinance = require('../models/companyFinance.js');
const { authMiddleware, adminMiddleware } = require("../authMiddleware.js");

const router = express.Router();



router.get('/admin/company-finance/prev-balance/:year/:month', authMiddleware,adminMiddleware, async (req, res) => {
    try {
        const { year, month } = req.params;
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return res.status(400).json({ error: "Invalid year or month" });
        }

      
        const prevYear = monthNum === 1 ? yearNum - 1 : yearNum;
        const prevMonth = monthNum === 1 ? 12 : monthNum - 1;

    
        const prevFinance = await CompanyFinance.findOne({ year: prevYear, month: prevMonth });

        if (!prevFinance) {
            return res.json({ cashIn: 0 }); 
        }

        res.json({ cashIn: prevFinance.cashBox.endBalance });

    } catch (error) {
        res.status(500).json({ error: "An error occurred while fetching the data." });
    }
});


router.post('/admin/company-finance/:year/:month',authMiddleware,adminMiddleware, async (req, res) => {
    try {
        const { year, month } = req.params;
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return res.status(400).json({ error: "Invalid year or month" });
        }

        const { startBalance, cashIn, expenses } = req.body;

        if (!expenses || typeof expenses !== 'object') {
            return res.status(400).json({ error: "Expenses must be provided as an object" });
        }

        
        const cashOut = Object.values(expenses).reduce((acc, val) => acc + val, 0);

        
        const endBalance = startBalance + cashIn - cashOut;

        
        const finance = await CompanyFinance.findOneAndUpdate(
            { year: yearNum, month: monthNum },
            {
                year: yearNum,
                month: monthNum,
                cashBox: {
                    startBalance,
                    endBalance
                },
                cashIn,
                cashOut,
                expenses
            },
            { new: true, upsert: true }
        );

        res.status(200).json(finance);

    } catch (error) {
        res.status(500).json({ error: "An error occurred while processing the request." });
    }
});


router.get('/admin/company-finance/:year/:month', authMiddleware,adminMiddleware,async (req, res) => {
    try {
        const { year, month } = req.params;
        const finance = await CompanyFinance.findOne({ year, month });
        if (!finance) return res.status(404).json({ error: "No data found for the given month" });
        res.json(finance);
    } catch (error) {
        res.status(500).json({ error: "An error occurred while fetching the data." });
    }
});


router.get('/admin/company-finance/summary/:year', authMiddleware,adminMiddleware, async (req, res) => {
    try {
        const { year } = req.params;
        const yearNum = parseInt(year);

        if (isNaN(yearNum)) {
            return res.status(400).json({ error: "Invalid year" });
        }

        const yearlyData = await CompanyFinance.find({ year: yearNum }).sort({ month: 1 });

        if (!yearlyData.length) return res.status(404).json({ error: "No data found for the given year" });

        res.json(yearlyData);
    } catch (error) {
        res.status(500).json({ error: "An error occurred while fetching the data." });
    }
});


module.exports = router;
