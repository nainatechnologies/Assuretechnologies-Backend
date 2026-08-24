const serviceService = require('./service.service');
const asyncHandler = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');

const createService = asyncHandler(async (req, res) => {
  const service = await serviceService.createService(req.body);

  res.status(201).json({
    success: true,
    message: 'Service created successfully',
    data: service
  });
});

const getPublicServices = asyncHandler(async (req, res) => {
  const result = await serviceService.getPublicServices(req.query);

  res.status(200).json({
    success: true,
    message: 'Services retrieved successfully',
    data: result
  });
});

const getAdminServices = asyncHandler(async (req, res) => {
  const result = await serviceService.getAdminServices(req.query);

  res.status(200).json({
    success: true,
    message: 'Admin services retrieved successfully',
    data: result
  });
});

const updateService = asyncHandler(async (req, res) => {
  const service = await serviceService.updateService(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Service updated successfully',
    data: service
  });
});

const toggleServiceStatus = asyncHandler(async (req, res) => {
  const { is_active } = req.body;
  const service = await serviceService.toggleServiceStatus(req.params.id, is_active);

  res.status(200).json({
    success: true,
    message: `Service status updated to ${is_active ? 'active' : 'inactive'}`,
    data: service
  });
});

module.exports = {
  createService,
  getPublicServices,
  getAdminServices,
  updateService,
  toggleServiceStatus
};
