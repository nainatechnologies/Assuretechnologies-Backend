const express = require('express');
const router = express.Router();
const bookingController = require('./serviceBooking.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const Technician = require('../technician/technician.model');
const Partner = require('../partner/partner.model');
const { validateRequest, validateParams } = require('../../middleware/validate.middleware');
const {
  createServiceBookingSchema,
  verifyPaymentSchema,
  updateBookingStatusSchema,
  updateBookingStatusParamSchema,
  assignBookingSchema,
  technicianActionSchema,
  partnerActionSchema,
  customerActionSchema,
} = require('./serviceBooking.validation');
const createUpload = require('../../middleware/upload');
const uploadProgress = createUpload('progress');

// Process multipart/form-data for progress photos before Zod validation
const processProgressFormData = (req, res, next) => {
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    req.body.photos = req.files.map(f => f.path);
    req.body.photo_public_ids = req.files.map(f => f.filename);
  } else if (!req.body.photos) {
    req.body.photos = [];
    req.body.photo_public_ids = [];
  }

  if (typeof req.body.photos === 'string') {
    try {
      req.body.photos = JSON.parse(req.body.photos);
    } catch (e) {
      req.body.photos = [req.body.photos];
    }
  }

  if (req.body.extraItems && typeof req.body.extraItems === 'string') {
    try {
      req.body.extraItems = JSON.parse(req.body.extraItems);
    } catch (e) {
      // Leave as is
    }
  }

  next();
};

// ----------------------------------------------------
// CUSTOMER ROUTES
// ----------------------------------------------------
// Create a new booking (customer)
router.post(
  '/customer/service-bookings',
  authMiddleware(['customer']),
  validateRequest(createServiceBookingSchema),
  bookingController.createBooking
);

// Verify Razorpay payment (customer)
router.post(
  '/customer/service-bookings/verify-payment',
  authMiddleware(['customer']),
  validateRequest(verifyPaymentSchema),
  bookingController.verifyPayment
);

// Get my bookings (customer)
router.get(
  '/customer/service-bookings',
  authMiddleware(['customer']),
  bookingController.getCustomerBookings
);

// Get specific booking details (customer)
router.get(
  '/customer/service-bookings/:id',
  authMiddleware(['customer']),
  validateParams(updateBookingStatusParamSchema),
  bookingController.getCustomerBookings
);

// Customer Action (Accept Work, Approve/Decline Extra Items)
router.patch(
  '/customer/service-bookings/:id/action',
  authMiddleware(['customer']),
  validateParams(updateBookingStatusParamSchema),
  validateRequest(customerActionSchema),
  bookingController.handleCustomerAction
);

// ----------------------------------------------------
// ADMIN ROUTES
// ----------------------------------------------------

// Get all bookings (admin)
router.get(
  '/admin/service-bookings',
  authMiddleware(['admin']),
  bookingController.getAdminBookings
);

// Update status (admin)
router.put(
  '/admin/service-bookings/:id/status',
  authMiddleware(['admin']),
  validateParams(updateBookingStatusParamSchema),
  validateRequest(updateBookingStatusSchema),
  bookingController.updateBookingStatus
);

// Assign booking to technician or partner (admin)
router.post(
  '/admin/service-bookings/:id/assign',
  authMiddleware(['admin']),
  validateParams(updateBookingStatusParamSchema),
  validateRequest(assignBookingSchema),
  bookingController.assignBooking
);

// Get available partners for a specific booking (admin)
router.get(
  '/admin/service-bookings/:id/available-partners',
  authMiddleware(['admin']),
  validateParams(updateBookingStatusParamSchema),
  bookingController.getAvailablePartnersForBooking
);

// ----------------------------------------------------
// TECHNICIAN ROUTES
// ----------------------------------------------------

// Get all assigned bookings (technician)
router.get(
  '/technician/service-bookings',
  authMiddleware(['technician']),
  bookingController.getTechnicianBookings
);

// Get specific booking details and history (technician)
router.get(
  '/technician/service-bookings/:id',
  authMiddleware(['technician']),
  validateParams(updateBookingStatusParamSchema),
  bookingController.getTechnicianBookingDetails
);

// Perform action (Start, Progress, Extra Items, Complete)
router.patch(
  '/technician/service-bookings/:id/action',
  authMiddleware(['technician']),
  uploadProgress.array('photos', 3),
  processProgressFormData,
  validateParams(updateBookingStatusParamSchema),
  validateRequest(technicianActionSchema),
  bookingController.handleTechnicianAction
);

// ----------------------------------------------------
// PARTNER ROUTES
// ----------------------------------------------------

// Get all assigned bookings (partner)
router.get(
  '/partner/service-bookings',
  authMiddleware(['partner']),
  bookingController.getPartnerBookings
);

// Get specific booking details and history (partner)
router.get(
  '/partner/service-bookings/:id',
  authMiddleware(['partner']),
  validateParams(updateBookingStatusParamSchema),
  bookingController.getPartnerBookingDetails
);

// Perform action (Start, Progress, Complete)
router.patch(
  '/partner/service-bookings/:id/action',
  authMiddleware(['partner']),
  uploadProgress.array('photos', 3),
  processProgressFormData,
  validateParams(updateBookingStatusParamSchema),
  validateRequest(partnerActionSchema),
  bookingController.handlePartnerAction
);

// ----------------------------------------------------
// WORKER DUTY AVAILABILITY (ON / OFF) ROUTES
// ----------------------------------------------------

// Toggle duty status ON/OFF (Technician & Partner)
router.patch(
  '/duty-status',
  authMiddleware(['technician', 'partner']),
  async (req, res) => {
    try {
      const { id, role } = req.user;
      const Model = role === 'technician' ? Technician : Partner;
      const worker = await Model.findByPk(id);

      if (!worker) {
        return res.status(404).json({
          success: false,
          message: `${role === 'technician' ? 'Technician' : 'Partner'} not found`
        });
      }

      const requestedStatus = req.body?.is_online;
      const newStatus = typeof requestedStatus === 'boolean'
        ? requestedStatus
        : !worker.is_online;
      worker.is_online = newStatus;
      await worker.save();

      return res.status(200).json({
        success: true,
        message: `Duty status turned ${worker.is_online ? 'ON' : 'OFF'} successfully`,
        data: { is_online: worker.is_online }
      });
    } catch (error) {
      console.error('Toggle duty status error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to update duty status'
      });
    }
  }
);

// Get current duty status (Technician & Partner)
router.get(
  '/duty-status',
  authMiddleware(['technician', 'partner']),
  async (req, res) => {
    try {
      const { id, role } = req.user;
      const Model = role === 'technician' ? Technician : Partner;
      const worker = await Model.findByPk(id, { attributes: ['id', 'is_online'] });

      return res.status(200).json({
        success: true,
        data: { is_online: worker ? !!worker.is_online : false }
      });
    } catch (error) {
      console.error('Get duty status error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch duty status'
      });
    }
  }
);

module.exports = router;
