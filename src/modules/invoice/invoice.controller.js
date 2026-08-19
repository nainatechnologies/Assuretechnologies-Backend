const invoiceService = require('./invoice.service');
const asyncHandler = require('../../utils/asyncHandler');

const createVendorInvoice = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const vendor_id = req.user.id;
  const { items } = req.body;

  const invoice = await invoiceService.createVendorInvoice(vendor_id, orderId, items);

  res.status(201).json({ success: true, message: 'Invoice generated successfully', data: { invoice } });
});

const getAdminInvoices = asyncHandler(async (req, res) => {
  const invoices = await invoiceService.getAdminInvoices();
  res.status(200).json({ success: true, data: invoices });
});

module.exports = {
  createVendorInvoice,
  getAdminInvoices
};
