const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const app = express();

const allowedOrigins = [
  'http://localhost:5173', // Admin
  'http://localhost:3000', // Customer (Assure-frontend)
  'http://localhost:5174', // Vendor
  'http://localhost:5175', // Technician
  'http://localhost:5176', // Partner
];

// Middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Assure Technologies API is running perfectly.' });
});

// Root Route
app.get('/', (req, res) => {
  res.send('Welcome to Assure Technologies Backend API');
});

const authRoutes = require('./modules/auth/auth.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const vendorRoutes = require('./modules/vendor/vendor.routes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);

module.exports = app;
