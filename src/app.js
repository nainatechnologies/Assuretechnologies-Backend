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
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
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
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

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
const productRoutes = require('./modules/product/product.routes');
const orderRoutes = require('./modules/order/order.routes');
const cartRoutes = require('./modules/cart/cart.routes');
const customerRoutes = require('./modules/customer/customer.routes');
const invoiceRoutes = require('./modules/invoice/invoice.routes');
const serviceRoutes = require('./modules/service/service.routes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api', serviceRoutes);

// Global Error Handler (must be the last middleware)
const errorMiddleware = require('./middleware/errorMiddleware');
app.use(errorMiddleware);

module.exports = app;


