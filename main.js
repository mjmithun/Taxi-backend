const express = require("express");
const connectDB = require("./ConnectDB.js");
const cors = require("cors");
const driverRoutes = require("./routes/driverRoutes.js");
const carRoutes = require("./routes/carRoutes.js");
const authRoutes = require('./routes/authRoutes.js');
const tripRoutes = require("./routes/tripRoutes.js");
const path = require('path');
//const invoiceRoutes = require("./routes/invoiceRoutes.js");
const incomeRoutes = require("./routes/incomeRoutes.js");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

app.use('./invoices', express.static(path.join(__dirname, 'invoices')));
// Routes
app.use("/api/drivers", driverRoutes);
app.use("/api/cars", carRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
//app.use('/api/invoices',invoiceRoutes);
app.use('/api/incomes',incomeRoutes);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));