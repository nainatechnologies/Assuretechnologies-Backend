const { Invoice, InvoiceItem, Order, OrderItem, Vendor, Product, Customer } = require('../../models');
const AppError = require('../../utils/AppError');

const createVendorInvoice = async (vendor_id, orderId, items) => {
  const orderItems = await OrderItem.findAll({
    where: { order_id: orderId, vendor_id }
  });

  if (!orderItems || orderItems.length === 0) {
    throw new AppError('Order items not found for this vendor', 404);
  }

  const order = await Order.findOne({
    where: { order_number: orderId },
    include: [{ model: Customer, as: 'customer' }]
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const invoice_number = 'INV' + Date.now() + Math.floor(Math.random() * 1000);
  let total_amount = 0;
  const invoiceItemsData = [];

  for (const orderItem of orderItems) {
    const payloadItem = items.find(i => i.id === orderItem.id);
    if (!payloadItem) {
      throw new AppError(`Missing details for item: ${orderItem.product_id}`, 400);
    }

    total_amount += parseFloat(orderItem.subtotal);
    
    invoiceItemsData.push({
      description: payloadItem.productName || 'Product',
      qty: orderItem.qty,
      rate: orderItem.price,
      amount: orderItem.subtotal,
      warranty: payloadItem.warranty || '',
      model_number: payloadItem.modelNumber || '',
      hsn_code: payloadItem.hsnCode || '',
      serial_numbers: payloadItem.serialNumbers || []
    });
    
    orderItem.status = 'ACCEPTED';
    await orderItem.save();
  }

  const tax_amount = parseFloat((total_amount * 0.18).toFixed(2));
  const grand_total = total_amount + tax_amount;

  const invoice = await Invoice.create({
    invoice_number,
    order_id: orderId,
    vendor_id,
    customer_name: order.customer_name || (order.customer ? order.customer.full_name : 'N/A'),
    mobile: order.customer_contact || (order.customer ? order.customer.mobile : 'N/A'),
    email: order.customer ? order.customer.email : '',
    address: order.customer_address,
    additional_charges: 0,
    gst_percent: 18,
    grand_total,
    status: 'Paid',
    type: 'VENDOR'
  });

  for (const invItem of invoiceItemsData) {
    invItem.invoice_id = invoice.id;
    await InvoiceItem.create(invItem);
  }

  order.status = 'ACCEPTED';
  await order.save();

  return invoice;
};

const getAdminInvoices = async () => {
  return await Invoice.findAll({
    include: [
      { model: InvoiceItem, as: 'items' },
      { model: Vendor, as: 'vendor', attributes: ['id', 'business_name', 'full_name'] }
    ],
    order: [['createdAt', 'DESC']]
  });
};

module.exports = {
  createVendorInvoice,
  getAdminInvoices
};
