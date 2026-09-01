const vendorService = require('./vendor.service');
const asyncHandler = require('../../utils/asyncHandler');

exports.getProfile = asyncHandler(async (req, res) => {
  const result = await vendorService.getProfile(req.user.id);
  res.status(200).json({ success: true, data: result });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const result = await vendorService.updateProfile(req.user.id, req.body);
  res.status(200).json({ success: true, data: result });
});

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const result = await vendorService.getDashboardStats(req.user.id);
  res.status(200).json({ success: true, data: result });
});

exports.getRecentOrders = asyncHandler(async (req, res) => {
  const result = await vendorService.getRecentOrders(req.user.id);
  res.status(200).json({ success: true, data: result });
});

exports.getPayoutsOverview = asyncHandler(async (req, res) => {
  const result = await vendorService.getPayoutsOverview(req.user.id);
  res.status(200).json({ success: true, data: result });
});

exports.getPayoutOrders = asyncHandler(async (req, res) => {
  const result = await vendorService.getPayoutOrders(req.user.id);
  res.status(200).json({ success: true, data: result });
});
