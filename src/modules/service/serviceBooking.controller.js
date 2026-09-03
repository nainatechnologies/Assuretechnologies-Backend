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
  const { id } = req.params;
  const booking_id = id || req.query.id || null;
  const bookings = await bookingService.getCustomerBookings(req.user, booking_id);
  res.status(200).json({
    success: true,
    data: bookings
  });
});

const getAdminBookings = asyncHandler(async (req, res) => {
  const { status, owner_type, page = 1, limit = 10 } = req.query;
  const bookings = await bookingService.getAdminBookings(status, owner_type, parseInt(page), parseInt(limit));
  res.status(200).json({
    success: true,
    ...bookings
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
  const { status, reason } = req.body;

  const result = await bookingService.updateBookingStatus(id, status, reason);
  res.status(200).json({
    success: true,
    ...result
  });
});

const assignBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await bookingService.assignBooking(id, req.body);
  res.status(200).json({
    success: true,
    ...result
  });
});

const getTechnicianBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingService.getTechnicianBookings(req.user.id);
  res.status(200).json({
    success: true,
    data: bookings
  });
});

const getTechnicianBookingDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const booking = await bookingService.getTechnicianBookingDetails(id, req.user.id);
  res.status(200).json({
    success: true,
    data: booking
  });
});

const handleTechnicianAction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await bookingService.handleTechnicianAction(id, req.user.id, req.body);
  res.status(200).json({
    success: true,
    ...result
  });
});

const handleCustomerAction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await bookingService.handleCustomerAction(id, req.user.id, req.body);
  res.status(200).json({
    success: true,
    ...result
  });
});

const getAvailablePartnersForBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const availablePartners = await bookingService.getAvailablePartnersForBooking(id);
  res.status(200).json({
    success: true,
    data: availablePartners
  });
});

const getPartnerBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingService.getPartnerBookings(req.user.id);
  res.status(200).json({
    success: true,
    data: bookings
  });
});

const getPartnerBookingDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const booking = await bookingService.getPartnerBookingDetails(id, req.user.id);
  res.status(200).json({
    success: true,
    data: booking
  });
});

const handlePartnerAction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await bookingService.handlePartnerAction(id, req.user.id, req.body);
  res.status(200).json({
    success: true,
    ...result
  });
});

module.exports = {
  createBooking,
  getCustomerBookings,
  handleCustomerAction,
  getAdminBookings,
  verifyPayment,
  updateBookingStatus,
  assignBooking,
  getTechnicianBookings,
  getTechnicianBookingDetails,
  handleTechnicianAction,
  getAvailablePartnersForBooking,
  getPartnerBookings,
  getPartnerBookingDetails,
  handlePartnerAction
};
