const { Invoice, InvoiceItem, Order, OrderItem, Vendor, Product, Customer } = require('../../models');

// Vendor generates invoice
const createVendorInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const vendor_id = req.user.id;
    const { items } = req.body; // array of items with modelNumber, hsnCode, serialNumbers

    // Validate the order belongs to this vendor
    const orderItems = await OrderItem.findAll({
      where: { order_id: orderId, vendor_id }
    });

    if (!orderItems || orderItems.length === 0) {
      return res.status(404).json({ message: 'Order items not found for this vendor' });
    }

    const order = await Order.findOne({
      where: { order_number: orderId },
      include: [{ model: Customer, as: 'customer' }]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Prepare Invoice details
    const invoice_number = 'INV' + Date.now() + Math.floor(Math.random() * 1000);
    let total_amount = 0;
    const invoiceItemsData = [];

    // Process each item
    for (const orderItem of orderItems) {
      const payloadItem = items.find(i => i.id === orderItem.id);
      if (!payloadItem) {
        return res.status(400).json({ message: `Missing details for item: ${orderItem.product_id}` });
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
      
      // Update order item status
      orderItem.status = 'ACCEPTED';
      await orderItem.save();
    }

    const tax_amount = parseFloat((total_amount * 0.18).toFixed(2));
    const grand_total = total_amount + tax_amount;

    // Create Invoice
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

    // Create Invoice Items
    for (const invItem of invoiceItemsData) {
      invItem.invoice_id = invoice.id;
      await InvoiceItem.create(invItem);
    }

    // Update overall order status if all items are accepted
    // For simplicity, we just set the order status to ACCEPTED
    order.status = 'ACCEPTED';
    await order.save();

    res.status(201).json({ message: 'Invoice generated successfully', invoice });
  } catch (error) {
    console.error('Error creating vendor invoice:', error);
    res.status(500).json({ message: 'Server error while generating invoice' });
  }
};

// Admin fetches all invoices
const getAdminInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      include: [
        { model: InvoiceItem, as: 'items' },
        { model: Vendor, as: 'vendor', attributes: ['id', 'business_name', 'full_name'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(invoices);
  } catch (error) {
    console.error('Error fetching admin invoices:', error);
    res.status(500).json({ message: 'Server error while fetching invoices' });
  }
};

module.exports = {
  createVendorInvoice,
  getAdminInvoices
};
