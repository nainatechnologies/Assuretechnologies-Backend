const vendorService = require('./vendor.service');
const asyncHandler = require('../../utils/asyncHandler');

exports.getProfile = asyncHandler(async (req, res) => {
  const result = await vendorService.getProfile(req.user.id);
  res.status(200).json(result);
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const result = await vendorService.updateProfile(req.user.id, req.body);
  res.status(200).json(result);
});
