const express = require('express');
const router = express.Router();
const serviceController = require('./service.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const { validateRequest } = require('../../middleware/validate.middleware');
const serviceSchemas = require('./service.validation');
const { setServiceOwnerType, validateCategoryMatch } = require('./service.middleware');

// Public / Customer Route (Fetch all active services)
router.get('/services', serviceController.getPublicServices);

// Apply auth middleware for all service management routes below (Admin only)
router.use(authMiddleware(['admin']));

// Admin Route (Fetch all services, including inactive ones)
router.get('/admin/services', serviceController.getAdminServices);

const createUpload = require('../../middleware/upload');
const upload = createUpload('services'); // Points to Cloudinary assure-backend/services folder

// Middleware to process multipart/form-data before Zod validation
const processFormData = (req, res, next) => {
  // 1. Map Cloudinary URL and Public ID to req.body
  if (req.file) {
    if (req.file.path) req.body.image = req.file.path; 
    if (req.file.filename) req.body.image_public_id = req.file.filename; 
  }

  // 2. Convert string numbers back to actual numbers (since multipart makes everything a string)
  if (req.body.prebooking_charge) req.body.prebooking_charge = parseFloat(req.body.prebooking_charge);
  if (req.body.price) req.body.price = parseFloat(req.body.price);

  // 3. Parse JSON arrays if they exist
  if (req.body.custom_fields && typeof req.body.custom_fields === 'string') {
    try {
      req.body.custom_fields = JSON.parse(req.body.custom_fields);
    } catch (e) {
      // If it fails to parse, leave it as string so Zod throws a helpful validation error
    }
  }
  
  next();
};

// Create Service (Admin or Partner)
// Used by: "Manage Services" & "Manage Partner Services" UIs
router.post(
  '/admin/services',
  upload.single('image'), // Must run FIRST to parse multipart/form-data
  processFormData,        // Convert strings to numbers/JSON & map Cloudinary URL
  validateRequest(serviceSchemas.createServiceSchema),
  setServiceOwnerType,
  validateCategoryMatch,
  serviceController.createService
);

// Update Service
router.put(
  '/admin/services/:id',
  upload.single('image'),
  processFormData,
  validateRequest(serviceSchemas.updateServiceSchema),
  serviceController.updateService
);

// Toggle Service Status (Soft Delete)
router.patch(
  '/admin/services/:id/status',
  validateRequest(serviceSchemas.toggleServiceStatusSchema),
  serviceController.toggleServiceStatus
);

module.exports = router;
