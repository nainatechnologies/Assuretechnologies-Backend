const express = require('express');
const router = express.Router();
const invoiceController = require('./invoice.controller');
const authMiddleware = require('../../middleware/authMiddleware');

// Vendor routes
router.post('/vendor/orders/:orderId', authMiddleware(['vendor']), invoiceController.createVendorInvoice);

// Admin routes
router.get('/admin', authMiddleware(['admin']), invoiceController.getAdminInvoices);

module.exports = router;
