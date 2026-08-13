const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const productController = require('../product/product.controller');
const authMiddleware = require('../../middleware/authMiddleware');

// Apply auth middleware for all admin routes
router.use(authMiddleware(['admin']));

const { validateRequest } = require('../../middleware/validate.middleware');
const authSchemas = require('../auth/auth.validation');

// Provider fetch endpoints
router.get('/vendors', adminController.getVendors);
router.get('/technicians', adminController.getTechnicians);
router.get('/partners', adminController.getPartners);

// Provider creation endpoints
router.post('/vendors', validateRequest(authSchemas.vendorRegisterSchema), adminController.createVendor);
router.post('/technicians', validateRequest(authSchemas.technicianRegisterSchema), adminController.createTechnician);
router.post('/partners', validateRequest(authSchemas.partnerRegisterSchema), adminController.createPartner);

// Partner Types
router.get('/partner-types', adminController.getPartnerTypes);
router.post('/partner-types', adminController.createPartnerType);

// Pricing Types
router.get('/pricing-types', adminController.getPricingTypes);
router.post('/pricing-types', adminController.createPricingType);

// Products
const productRoutes = require('../product/product.routes');
router.use('/products', productRoutes);

// Orders
const orderRoutes = require('../order/order.routes');
router.use('/orders', orderRoutes);

module.exports = router;


