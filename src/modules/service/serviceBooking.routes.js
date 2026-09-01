const express = require('express');
const router = express.Router();
const bookingController = require('./serviceBooking.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const { validateRequest, validateParams } = require('../../middleware/validate.middleware');
const {
  createServiceBookingSchema,
  verifyPaymentSchema,
  updateBookingStatusSchema,
  updateBookingStatusParamSchema,
  assignBookingSchema,
  technicianActionSchema,
  customerActionSchema,
} = require('./serviceBooking.validation');

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
  validateParams(updateBookingStatusParamSchema),
  validateRequest(technicianActionSchema),
  bookingController.handleTechnicianAction
);

module.exports = router;
