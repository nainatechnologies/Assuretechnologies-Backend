const adminService = require('./admin.service');
const asyncHandler = require('../../utils/asyncHandler');

const getVendors = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const result = await adminService.getVendors(Number(page), Number(limit), search);
  res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
});

const getTechnicians = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const result = await adminService.getTechnicians(Number(page), Number(limit), search);
  res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
});

const createVendor = asyncHandler(async (req, res) => {
  const vendor = await adminService.createVendor(req.body, req.files);
  res.status(201).json({ success: true, data: vendor });
});

const createTechnician = asyncHandler(async (req, res) => {
  const technician = await adminService.createTechnician(req.body, req.files);
  res.status(201).json({ success: true, data: technician });
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await adminService.getCategories();
  res.status(200).json({ success: true, data: categories });
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await adminService.createCategory(req.body);
  res.status(201).json({ success: true, data: category });
});

const getCustomers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const result = await adminService.getCustomers(page, limit, search);
  res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
});

const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await adminService.getCustomerById(req.params.id);
  res.status(200).json({ success: true, data: customer });
});

const updateCustomerStatus = asyncHandler(async (req, res) => {
  const customer = await adminService.updateCustomerStatus(req.params.id, req.body.is_active);
  res.status(200).json({ success: true, message: 'Customer status updated successfully', data: customer });
});

const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await adminService.updateCustomer(req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Customer details updated successfully', data: customer });
});

// ==================== PAYMENTS & SETTLEMENTS ====================

const getPaymentSummary = asyncHandler(async (req, res) => {
  const summary = await adminService.getPaymentSummary();
  res.status(200).json({ success: true, data: summary });
});

const getPaymentTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', type = 'all' } = req.query;
  const result = await adminService.getPaymentTransactions({
    page: parseInt(page),
    limit: parseInt(limit),
    search,
    type
  });
  res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
});

const getPendingPayouts = asyncHandler(async (req, res) => {
  const { search = '' } = req.query;
  const payouts = await adminService.getPendingPayouts(search);
  res.status(200).json({ success: true, data: payouts });
});

const getVendorLedger = asyncHandler(async (req, res) => {
  const { search = '' } = req.query;
  const ledger = await adminService.getVendorLedger(search);
  res.status(200).json({ success: true, data: ledger });
});

const processVendorPayout = asyncHandler(async (req, res) => {
  const { vendor_id, order_item_ids, amount, payment_method, transaction_reference } = req.body;
  const payout = await adminService.processVendorPayout({
    vendor_id,
    order_item_ids,
    amount,
    payment_method,
    transaction_reference,
    file: req.file
  });
  res.status(201).json({
    success: true,
    message: 'Vendor payout processed and recorded successfully',
    data: payout
  });
});

const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  res.status(200).json({ success: true, data: stats });
});

const getRecentActivity = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const activity = await adminService.getRecentActivity(Number(limit));
  res.status(200).json({ success: true, data: activity });
});

module.exports = {
  getVendors,
  getTechnicians,
  createVendor,
  createTechnician,
  getCategories,
  createCategory,
  getCustomers,
  getCustomerById,
  updateCustomerStatus,
  updateCustomer,
  getPaymentSummary,
  getPaymentTransactions,
  getPendingPayouts,
  getVendorLedger,
  processVendorPayout,
  getDashboardStats,
  getRecentActivity
};
