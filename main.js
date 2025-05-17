const express = require("express");
const connectDB = require("./ConnectDB.js");
const cors = require("cors");
const driverRoutes = require("./routes/driverRoutes.js");
const carRoutes = require("./routes/carRoutes.js");
const authRoutes = require('./routes/authRoutes.js');
const tripRoutes = require("./routes/tripRoutes.js");
const financeRoutes = require("./routes/financeRoutes.js");
const path = require('path');
const incomeRoutes = require("./routes/incomeRoutes.js");
require("dotenv").config();

const PORT = process.env.PORT || 8080;

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
app.use('/api/finance',financeRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


const allowedOrigins = [
  'https://taxi-frontend-chi.vercel.app',
  'https://taxi-frontend-git-main-jayamithuns-projects.vercel.app',
  'https://taxi-frontend-hzqt0ecu8-jayamithuns-projects.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
   
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  
}));