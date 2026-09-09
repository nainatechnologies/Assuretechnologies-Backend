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

const deleteAdminInvoice = async (req, res) => {
  try {
    await invoiceService.deleteAdminInvoice(req.params.id);
    res.status(200).json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const downloadServiceInvoice = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { pdfBuffer, invoice } = await invoiceService.generateServiceInvoicePdf(bookingId);
  
  const fileName = `Invoice-${invoice.invoice_number || bookingId}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Length', pdfBuffer.length);

  res.send(pdfBuffer);
});

const createServiceInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.createServiceInvoice(req.body);
  res.status(201).json({ success: true, message: 'Invoice generated successfully', data: { invoice } });
});

const getPendingServiceBookings = asyncHandler(async (req, res) => {
  const pendingBookings = await invoiceService.getPendingServiceBookings();
  res.status(200).json({ success: true, data: pendingBookings });
});

module.exports = {
  createVendorInvoice,
  getAdminInvoices,
  deleteAdminInvoice,
  downloadServiceInvoice,
  createServiceInvoice,
  getPendingServiceBookings
};
