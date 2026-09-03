const express = require('express');
const router = express.Router();
const partnerController = require('./partner.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const { validateRequest } = require('../../middleware/validate.middleware');
const checkExists = require('../../middleware/checkExists.middleware');
const Category = require('../category/category.model');
const authSchemas = require('../auth/auth.validation');
const adminSchemas = require('../admin/admin.validation');

// Protect all partner routes for Admin only
router.use('/admin', authMiddleware(['admin']));

// Partner Endpoints
router.get('/admin/partners', partnerController.getPartners);
router.post('/admin/partners', validateRequest(authSchemas.partnerRegisterSchema), partnerController.createPartner);
router.put('/admin/partners/:id', validateRequest(adminSchemas.updatePartnerSchema), partnerController.updatePartner);
router.patch('/admin/partners/:id/status', partnerController.togglePartnerStatus);

// Partner Types
router.get('/admin/partner-types', partnerController.getPartnerTypes);
router.post(
  '/admin/partner-types', 
  validateRequest(adminSchemas.createPartnerTypeSchema), 
  checkExists(Category, 'body.category_id', 'Category'),
  partnerController.createPartnerType
);
router.put(
  '/admin/partner-types/:id',
  validateRequest(adminSchemas.updatePartnerTypeSchema),
  partnerController.updatePartnerType
);
router.patch('/admin/partner-types/:id/status', partnerController.togglePartnerTypeStatus);

// Pricing Types
router.get('/admin/pricing-types', partnerController.getPricingTypes);
router.post('/admin/pricing-types', validateRequest(adminSchemas.createPricingTypeSchema), partnerController.createPricingType);
router.put('/admin/pricing-types/:id', validateRequest(adminSchemas.updatePricingTypeSchema), partnerController.updatePricingType);
router.patch('/admin/pricing-types/:id/status', partnerController.togglePricingTypeStatus);

module.exports = router;
