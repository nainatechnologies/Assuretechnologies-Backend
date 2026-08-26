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



const createVendor = asyncHandler(async (req, res) => {
  const vendor = await adminService.createVendor(req.body, req.files);
  res.status(201).json({ success: true, message: 'Vendor created successfully', data: { vendorId: vendor.id } });
});

const createTechnician = asyncHandler(async (req, res) => {
  const technician = await adminService.createTechnician(req.body, req.files);
  res.status(201).json({ success: true, message: 'Technician created successfully', data: { technicianId: technician.id } });
});



const getCategories = asyncHandler(async (req, res) => {
  const categories = await adminService.getCategories();
  res.status(200).json({ success: true, data: categories });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await adminService.createCategory(req.body);
  res.status(201).json({ success: true, data: category });
});



module.exports = {
  getVendors,
  getTechnicians,
  createVendor,
  createTechnician,
  getCategories,
  createCategory
};
