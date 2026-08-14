const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const productController = require('../product/product.controller');
const authMiddleware = require('../../middleware/authMiddleware');

// Apply auth middleware for all admin routes
router.use(authMiddleware(['admin']));

const { validateRequest } = require('../../middleware/validate.middleware');
const authSchemas = require('../auth/auth.validation');
const createUpload = require('../../middleware/upload');
const uploadVendor = createUpload('vendors');
const uploadTechnician = createUpload('technicians');

// Provider fetch endpoints
router.get('/vendors', adminController.getVendors);
router.get('/technicians', adminController.getTechnicians);
router.get('/partners', adminController.getPartners);

// Provider creation endpoints
router.post('/vendors', uploadVendor.fields([{ name: 'aadhar_proof', maxCount: 1 }, { name: 'pan_proof', maxCount: 1 }, { name: 'shop_photo', maxCount: 1 }]), validateRequest(authSchemas.vendorRegisterSchema), adminController.createVendor);
router.post('/technicians', uploadTechnician.fields([{ name: 'id_proof', maxCount: 1 }, { name: 'noc_document', maxCount: 1 }]), validateRequest(authSchemas.technicianRegisterSchema), adminController.createTechnician);
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


