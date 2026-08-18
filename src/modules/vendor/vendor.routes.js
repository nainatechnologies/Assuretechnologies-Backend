const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');

const productRoutes = require('../product/product.routes');
const orderRoutes = require('../order/order.routes');

// Vendor endpoints (protected by 'vendor' role)
router.use('/products', authMiddleware(['vendor']), productRoutes);
router.use('/orders', authMiddleware(['vendor']), orderRoutes);

module.exports = router;
