const adminService = require('./admin.service');
const asyncHandler = require('../../utils/asyncHandler');

const getVendors = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const search = req.query.search || '';
  
  const result = await adminService.getVendors(page, limit, search);
  res.status(200).json({ success: true, ...result });
});

const getTechnicians = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const search = req.query.search || '';

  const result = await adminService.getTechnicians(page, limit, search);
  res.status(200).json({ success: true, ...result });
});

const getPartners = asyncHandler(async (req, res) => {
  const result = await adminService.getPartners();
  res.status(200).json({ success: true, data: result });
});

const createVendor = asyncHandler(async (req, res) => {
  const vendor = await adminService.createVendor(req.body, req.files);
  res.status(201).json({ success: true, message: 'Vendor created successfully', data: { vendorId: vendor.id } });
});

const createTechnician = asyncHandler(async (req, res) => {
  const technician = await adminService.createTechnician(req.body, req.files);
  res.status(201).json({ success: true, message: 'Technician created successfully', data: { technicianId: technician.id } });
});

const createPartner = asyncHandler(async (req, res) => {
  const partner = await adminService.createPartner(req.body);
  res.status(201).json({ success: true, message: 'Partner created successfully', data: { partnerId: partner.id } });
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await adminService.getCategories();
  res.status(200).json({ success: true, data: categories });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await adminService.createCategory(req.body);
  res.status(201).json({ success: true, data: category });
});

const getPartnerTypes = asyncHandler(async (req, res) => {
  const types = await adminService.getPartnerTypes();
  res.status(200).json({ success: true, data: types });
});

const createPartnerType = asyncHandler(async (req, res) => {
  const type = await adminService.createPartnerType(req.body);
  res.status(201).json({ success: true, data: type });
});

const getPricingTypes = asyncHandler(async (req, res) => {
  const types = await adminService.getPricingTypes();
  res.status(200).json({ success: true, data: types });
});

const createPricingType = asyncHandler(async (req, res) => {
  const type = await adminService.createPricingType(req.body);
  res.status(201).json({ success: true, data: type });
});

module.exports = {
  getVendors,
  getTechnicians,
  getPartners,
  createVendor,
  createTechnician,
  createPartner,
  getCategories,
  createCategory,
  getPartnerTypes,
  createPartnerType,
  getPricingTypes,
  createPricingType
};
