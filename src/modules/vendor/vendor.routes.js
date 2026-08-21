const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const { validateRequest } = require('../../middleware/validate.middleware');
const { updateProfileSchema } = require('./vendor.validation');
const vendorController = require('./vendor.controller');

const productRoutes = require('../product/product.routes');
const orderRoutes = require('../order/order.routes');

// Vendor Profile endpoints
router.get('/profile', authMiddleware(['vendor']), vendorController.getProfile);
router.put('/profile', authMiddleware(['vendor']), validateRequest(updateProfileSchema), vendorController.updateProfile);

// Vendor endpoints (protected by 'vendor' role)
router.use('/products', authMiddleware(['vendor']), productRoutes);
router.use('/orders', authMiddleware(['vendor']), orderRoutes);

module.exports = router;
