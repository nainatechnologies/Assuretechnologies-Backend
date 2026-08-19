const express = require('express');
const router = express.Router();
const invoiceController = require('./invoice.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const { validateRequest } = require('../../middleware/validate.middleware');
const invoiceSchemas = require('./invoice.validation');

// Vendor routes
router.post('/vendor/orders/:orderId', authMiddleware(['vendor']), validateRequest(invoiceSchemas.createInvoiceSchema), invoiceController.createVendorInvoice);

// Admin routes
router.get('/admin', authMiddleware(['admin']), invoiceController.getAdminInvoices);

router.delete('/admin/:id', authMiddleware(['admin']), invoiceController.deleteAdminInvoice);

module.exports = router;
