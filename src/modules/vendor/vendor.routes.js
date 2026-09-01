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

// Dashboard endpoints
router.get('/dashboard/stats', authMiddleware(['vendor']), vendorController.getDashboardStats);
router.get('/dashboard/recent-orders', authMiddleware(['vendor']), vendorController.getRecentOrders);

// Payouts & Financial Overview endpoints
router.get('/payouts/overview', authMiddleware(['vendor']), vendorController.getPayoutsOverview);
router.get('/payouts', authMiddleware(['vendor']), vendorController.getPayoutOrders);

// Vendor endpoints (protected by 'vendor' role)
router.use('/products', authMiddleware(['vendor']), productRoutes);
router.use('/orders', authMiddleware(['vendor']), orderRoutes);

module.exports = router;
