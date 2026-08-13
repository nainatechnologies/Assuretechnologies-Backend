const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');

const productRoutes = require('../product/product.routes');

// Vendor endpoints (protected by 'vendor' role)
router.use('/products', authMiddleware(['vendor']), productRoutes);

module.exports = router;
