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

module.exports = router;
