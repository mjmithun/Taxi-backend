const express = require("express");
const router = express.Router();
const Car = require("../models/carModel.js");
const Income = require("../models/incomeModel.js");
const fs = require("fs");
const path = require("path");
const { authMiddleware, adminMiddleware } = require("../authMiddleware.js");




// ============================
// Aggregation Routes
// ============================

// Get total income and expenses
router.get(
  "/admin/total-income-expenses",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const incomes = await Income.aggregate([
        {
          $group: {
            _id: null,
            totalIncome: { $sum: "$tripIncome" },
            totalExpenses: {
              $sum: {
                $add: [
                  { $ifNull: ["$carMaintenance", 0] },
                  { $ifNull: ["$driverExpense", 0] },
                  { $ifNull: ["$extraExpense", 0] },
                ],
              },
            },
          },
        },
      ]);

      if (incomes.length > 0) {
        const { totalIncome, totalExpenses } = incomes[0];
        return res.status(200).json({ totalIncome, totalExpenses });
      } else {
        return res.status(200).json({ totalIncome: 0, totalExpenses: 0 });
      }
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// Get monthly income and expenses summary
router.get("/admin/monthly-summary/",
  authMiddleware,
  adminMiddleware,
   async (req, res) => {
  try {
    const currentDate = new Date();

    const monthlyData = await Income.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalIncome: { $sum: "$tripIncome" },
          totalDriverExpense: { $sum: "$driverExpense" },
          totalCarMaintenance: { $sum: "$carMaintenance" },
          totalExtraExpense: { $sum: "$extraExpense" },
        },
      },
      {
        $addFields: {
          totalExpense: {
            $add: [
              "$totalDriverExpense",
              "$totalCarMaintenance",
              "$totalExtraExpense",
            ],
          },
          grossProfit: "$totalIncome",
          netProfit: {
            $subtract: [
              "$totalIncome",
              {
                $add: [
                  "$totalDriverExpense",
                  "$totalCarMaintenance",
                  "$totalExtraExpense",
                ],
              },
            ],
          },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    monthlyData.forEach((item) => {
      const isCurrentMonth =
        item._id.year === currentDate.getFullYear() &&
        item._id.month === currentDate.getMonth() + 1;
      if (isCurrentMonth) {
        item.partialMonth = true;
      }
    });

    res.json(monthlyData);
  } catch (error) {
    res.status(500).json({
      error: "An error occurred while fetching the monthly summary.",
    });
  }
});

router.get(
  "/admin/weekly-summary",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const currentDate = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(currentDate.getDate() - 7);

      const weeklyData = await Income.aggregate([
        {
          // Match only documents created in the last 7 days
          $match: {
            createdAt: { $gte: sevenDaysAgo, $lte: currentDate },
          },
        },
        {
          // Group by day (year, month, day)
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            totalIncome: { $sum: "$tripIncome" },
            totalDriverExpense: { $sum: "$driverExpense" },
            totalCarMaintenance: { $sum: "$carMaintenance" },
            totalExtraExpense: { $sum: "$extraExpense" },
          },
        },
        {
          // Add calculated fields
          $addFields: {
            totalExpense: {
              $add: [
                "$totalDriverExpense",
                "$totalCarMaintenance",
                "$totalExtraExpense",
              ],
            },
            grossProfit: "$totalIncome",
            netProfit: {
              $subtract: [
                "$totalIncome",
                {
                  $add: [
                    "$totalDriverExpense",
                    "$totalCarMaintenance",
                    "$totalExtraExpense",
                  ],
                },
              ],
            },
          },
        },
        {
          // Sort by year, month, and day in ascending order
          $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
        },
      ]);

      // Respond with the weekly data
      res.json(weeklyData);
    } catch (error) {
      console.error("Error fetching weekly summary:", error);
      res.status(500).json({
        error: "An error occurred while fetching the weekly summary.",
      });
    }
  }
);
// Get total expense for a specific Income ID
router.get(
  "/admin/total-expense/:incomeId",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const { incomeId } = req.params;

    try {
      const aggregatedExpenses = await Income.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(incomeId),
          },
        },
        {
          $group: {
            _id: null,
            totalExpenses: {
              $sum: {
                $add: [
                  { $ifNull: ["$carMaintenance", 0] },
                  { $ifNull: ["$driverExpense", 0] },
                  { $ifNull: ["$extraExpense", 0] },
                ],
              },
            },
          },
        },
      ]);

      if (aggregatedExpenses.length > 0) {
        return res
          .status(200)
          .json({ totalExpense: aggregatedExpenses[0].totalExpenses });
      } else {
        return res.status(200).json({ totalExpense: 0 });
      }
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// ============================
// Update Routes
// ============================

// Update Income and related Car expenses
router.put("/admin/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;

    // Update income fields
    const updatedIncome = await Income.findByIdAndUpdate(
      id,
      {
        $set: {
          carMaintenance: updates.carMaintenance || 0,
          driverExpense: updates.driverExpense || 0,
          extraExpense: updates.extraExpense || 0,
        },
      },
      { new: true }
    );

    // Update Car expenses if carMaintenance is provided
    if (updates.carMaintenance) {
      const income = await Income.findById(id);
      const carData = await Car.findById(income.car);
      carData.expenses += updates.carMaintenance;
      await carData.save();
    }

    res.status(200).json(updatedIncome);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================
// Get Routes (Details)
// ============================

// // Get an invoice for a trip by ID
router.get("/admin/:id", authMiddleware, adminMiddleware, async (req, res) => {
  console.log("Trip Id : ",req.params.id);
  try {
    const tripId = req.params.id;
    const filePath = path.join(__dirname, `../invoices/invoice_${tripId}.pdf`);

    if (fs.existsSync(filePath)) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="invoice_${tripId}.pdf"`
      );
      return res.sendFile(filePath);
    } else {
      return res.status(404).json({ message: "Invoice not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
