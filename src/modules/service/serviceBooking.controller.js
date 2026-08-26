const bookingService = require('./serviceBooking.service');
const asyncHandler = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');

const createBooking = asyncHandler(async (req, res) => {
  const result = await bookingService.createBooking(req.body, req.user);
  res.status(201).json({
    success: true,
    ...result
  });
});

const getCustomerBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingService.getCustomerBookings(req.user);
  res.status(200).json({
    success: true,
    data: bookings
  });
});

const getAdminBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingService.getAdminBookings();
  res.status(200).json({
    success: true,
    data: bookings
  });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { booking_id, ...payment_data } = req.body;

  const result = await bookingService.verifyPayment(booking_id, payment_data, req.user);
  res.status(200).json({
    success: true,
    ...result
  });
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const result = await bookingService.updateBookingStatus(id, status);
  res.status(200).json({
    success: true,
    ...result
  });
});

module.exports = {
  createBooking,
  getCustomerBookings,
  getAdminBookings,
  verifyPayment,
  updateBookingStatus
};
