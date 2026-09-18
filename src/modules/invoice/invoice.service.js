const { Invoice, InvoiceItem, Order, OrderItem, Vendor, Product, Customer, ServiceBooking, Service, ExtraItemsRequest } = require('../../models');
const AppError = require('../../utils/AppError');
const { buildInvoicePdf, generateInvoicePdfBuffer } = require('../../utils/pdfGenerator');
const { uploadPdfStreamToCloudinary } = require('../../utils/cloudinary');

const createVendorInvoice = async (vendor_id, orderId, items) => {
  const order = await Order.findOne({
    where: { order_number: orderId },
    include: [{ model: Customer, as: 'customer' }]
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const orderItems = await OrderItem.findAll({
    where: { order_id: order.id, vendor_id }
  });

  if (!orderItems || orderItems.length === 0) {
    throw new AppError('Order items not found for this vendor', 404);
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
  const invoices = await Invoice.findAll({
    include: [
      { model: InvoiceItem, as: 'items' },
      { model: Vendor, as: 'vendor', attributes: ['id', 'business_name', 'full_name'] }
    ],
    order: [['createdAt', 'DESC']]
  });

  const formatted = await Promise.all(invoices.map(async (inv) => {
    const json = inv.toJSON ? inv.toJSON() : inv;
    if (json.type === 'SERVICE' && json.order_id && (json.order_id.startsWith('BKG-') || json.order_id.startsWith('SR-'))) {
      try {
        const autoId = parseInt(json.order_id.split('-')[1]) - 1000;
        const booking = await ServiceBooking.findOne({
          where: { auto_id: autoId },
          include: [{ model: Service }]
        });
        if (booking && booking.Service) {
          json.service_name = booking.Service.name;
        }
      } catch (err) {
        console.error('Error resolving service name for invoice:', err);
      }
    }

    if (json.type === 'VENDOR') {
      json.sold_by = json.vendor ? (json.vendor.business_name || json.vendor.full_name) : 'Assure Technologies';
      json.product_name = (json.items && json.items.length > 0 && json.items[0].description)
        ? json.items.map(i => i.description).filter(Boolean).join(', ')
        : 'Product';
    } else {
      json.sold_by = 'Assure Technologies';
    }

    return json;
  }));

  return formatted;
};

const deleteAdminInvoice = async (id) => {
  const invoice = await Invoice.findByPk(id);
  if (!invoice) throw new AppError('Invoice not found', 404);
  await invoice.destroy();
};

const createServiceInvoice = async (invoiceData) => {
  const { srNo, customerName, mobile, email, address, items, additionalChargesDesc, additionalCharges, gstPercent, grandTotal, serviceName } = invoiceData;

  const booking = await ServiceBooking.findOne({
    where: { auto_id: parseInt(srNo.split('-')[1]) - 1000 },
    include: [
      { model: Service },
      { model: Order }
    ]
  });

  // Validate base service payload against DB truth
  if (items && items.length > 0) {
    if (booking) {
      const trueQty = booking.quantity ? parseFloat(booking.quantity) : 1;
      const trueRate = (booking.Order && booking.Order.subtotal_amount && trueQty) ? parseFloat(booking.Order.subtotal_amount) / trueQty : (booking.Service ? parseFloat(booking.Service.prebooking_charge) : 0);
      
      const payloadQty = parseFloat(items[0].qty) || 0;
      const payloadRate = parseFloat(items[0].rate) || 0;

      if (payloadQty !== trueQty || payloadRate !== trueRate) {
        throw new AppError('Base service quantity and rate cannot be modified.', 400);
      }
    }
  }

  const invoice_number = 'INV' + Date.now() + Math.floor(Math.random() * 1000);

  // Calculate remaining balance based on what was already paid in the Order
  const orderTotal = booking && booking.Order ? parseFloat(booking.Order.total_amount) : 0;
  const grandTotalParsed = parseFloat(grandTotal) || 0;
  // If the new invoice total is greater than what was originally paid, there's a balance.
  // E.g., Order total = 1180, Invoice grand total = 1180 (no balance)
  // E.g., Order total = 1180, Invoice grand total = 2360 (balance = 1180)
  // Allow a small margin of error for floating point
  let balance = grandTotalParsed - orderTotal;
  if (balance < 1) balance = 0; // if it's pennies, ignore it

  const invoice = await Invoice.create({
    invoice_number,
    order_id: srNo, // We map the booking's display_id (e.g. BKG-1025) to order_id
    customer_name: customerName || 'N/A',
    mobile: mobile || 'N/A',
    email: email || '',
    address: address || '',
    additional_charges_desc: additionalChargesDesc || '',
    additional_charges: additionalCharges || 0,
    gst_percent: gstPercent || 18,
    grand_total: grandTotal,
    status: balance > 0 ? 'Pending' : 'Paid',
    type: 'SERVICE'
  });

  if (items && items.length > 0) {
    for (const item of items) {
      await InvoiceItem.create({
        invoice_id: invoice.id,
        description: item.description || serviceName || 'Service',
        qty: item.qty || 1,
        rate: item.rate || 0,
        amount: item.amount || 0,
        warranty: item.warranty || '',
        model_number: item.modelNumber || '',
        hsn_code: item.hsnCode || '',
        serial_numbers: Array.isArray(item.serialNumbers) ? JSON.stringify(item.serialNumbers) : (item.serialNumbers || '[]')
      });
    }
  }

  // Update the Order with the remaining balance
  if (booking && booking.Order && balance > 0) {
    booking.Order.remaining_balance = balance;
    booking.Order.remaining_balance_paid = false;
    await booking.Order.save();
  }

  // Generate PDF and upload to Cloudinary
  try {
    const billableItems = items && items.length > 0 ? items.map(item => ({
      item_type: 'Item',
      description: item.description || serviceName || 'Service',
      price: parseFloat(item.rate || 0),
      qty: parseInt(item.qty || 1, 10)
    })) : [];

    if (parseFloat(invoice.additional_charges) > 0) {
      billableItems.push({
        item_type: 'Additional Charges',
        description: invoice.additional_charges_desc || 'Extra Fees',
        price: parseFloat(invoice.additional_charges),
        qty: 1
      });
    }

    const subtotal = billableItems.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
    const gstAmount = parseFloat(invoice.grand_total) - subtotal;

    const pdfInvoiceData = {
      invoice_number: invoice.invoice_number,
      customer: {
        name: invoice.customer_name,
        mobile: invoice.mobile,
        address: invoice.address || 'Address not provided'
      },
      items: billableItems,
      subtotal: subtotal,
      gst_percent: parseFloat(invoice.gst_percent || 18),
      tax_amount: gstAmount > 0.01 ? gstAmount : 0,
      total_amount: parseFloat(invoice.grand_total)
    };

    const pdfBuffer = await generateInvoicePdfBuffer(pdfInvoiceData);
    const pdfUrl = await uploadPdfStreamToCloudinary(pdfBuffer, `invoice_${invoice.invoice_number}`);
    
    invoice.invoice_pdf_url = pdfUrl;
    await invoice.save();
  } catch (error) {
    console.error('Error generating/uploading PDF during invoice creation:', error);
    // We don't fail the invoice creation if PDF upload fails, but it won't have a URL.
  }

  return invoice;
};

const getPendingServiceBookings = async () => {
  // Find all COMPLETED bookings
  const bookings = await ServiceBooking.findAll({
    where: { status: 'COMPLETED' },
    include: [
      { 
        model: Service, 
        include: [{ model: require('../../models').Category, as: 'category' }] 
      },
      { model: Order, include: [{ model: Customer, as: 'customer' }] },
      { model: ExtraItemsRequest, as: 'extra_items', where: { status: 'APPROVED' }, required: false }
    ],
    order: [['createdAt', 'DESC']]
  });

  // Filter out the ones that already have an invoice
  // Since order_id in Invoice maps to display_id of booking
  const displayIds = bookings.map(b => b.display_id);
  const existingInvoices = await Invoice.findAll({
    where: { order_id: displayIds, type: 'SERVICE' },
    attributes: ['order_id']
  });
  
  const existingInvoiceIds = existingInvoices.map(i => i.order_id);
  
  const pending = bookings.filter(b => !existingInvoiceIds.includes(b.display_id));

  // Map to the format the admin frontend expects (mockSRs format)
  return pending.map(b => {
    const customer = b.Order && b.Order.customer ? b.Order.customer : {};
    return {
      id: b.id,
      srNo: b.display_id,
      customerName: customer.full_name || (b.Order && b.Order.customer_name) || 'N/A',
      mobile: customer.mobile || (b.Order && b.Order.customer_contact) || 'N/A',
      email: customer.email || '',
      address: (() => {
        let addr = b.address;
        if (typeof addr === 'string' && addr.trim().startsWith('{')) {
          try { addr = JSON.parse(addr); } catch (e) {}
        }
        if (typeof addr === 'object' && addr !== null) {
          return [addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');
        }
        return addr || '';
      })(),
      service: b.Service ? b.Service.name : 'Custom Service',
      category: (b.Service && b.Service.category) ? b.Service.category.name : 'Service',
      qty: b.quantity ? parseFloat(b.quantity) : 1,
      rate: (b.Order && b.Order.subtotal_amount && b.quantity) ? parseFloat(b.Order.subtotal_amount) / parseFloat(b.quantity) : (b.Service ? parseFloat(b.Service.prebooking_charge) : 0),
      completedOn: b.updatedAt.toDateString(),
      extraItems: b.extra_items ? b.extra_items.map((extra) => ({
        description: extra.description,
        qty: extra.qty
      })) : []
    };
  });
};

const generateServiceInvoicePdf = async (bookingId) => {
  let booking = null;
  const bookingIdStr = String(bookingId || '').trim();

  if (bookingIdStr.startsWith('BKG-') || bookingIdStr.startsWith('SR-')) {
    const rawNumber = bookingIdStr.startsWith('SR-') ? bookingIdStr.replace('SR-', '') : bookingIdStr.replace('BKG-', '');
    const autoId = parseInt(rawNumber, 10) - 1000;
    if (!isNaN(autoId)) {
      booking = await ServiceBooking.findOne({
        where: { auto_id: autoId },
        include: [
          { model: Service },
          { model: Order, include: [{ model: Customer, as: 'customer' }] },
          { model: ExtraItemsRequest, as: 'extra_items', where: { status: 'APPROVED' }, required: false }
        ]
      });
    }
  } else if (!isNaN(Number(bookingIdStr)) && bookingIdStr !== '') {
    booking = await ServiceBooking.findOne({
      where: { auto_id: Number(bookingIdStr) },
      include: [
        { model: Service },
        { model: Order, include: [{ model: Customer, as: 'customer' }] },
        { model: ExtraItemsRequest, as: 'extra_items', where: { status: 'APPROVED' }, required: false }
      ]
    });
  }

  if (!booking) {
    // Fallback to internal UUID if display_id fails
    const bookingByUuid = await ServiceBooking.findByPk(bookingIdStr, {
      include: [
        { model: Service },
        { model: Order, include: [{ model: Customer, as: 'customer' }] },
        { model: ExtraItemsRequest, as: 'extra_items', where: { status: 'APPROVED' }, required: false }
      ]
    });
    if (bookingByUuid) {
      booking = bookingByUuid;
    }
  }

  const displayId = booking ? (booking.display_id || `SR-${booking.auto_id + 1000}`) : bookingIdStr;

  let savedInvoice = await Invoice.findOne({
    where: { order_id: displayId, type: 'SERVICE' },
    include: [{ model: InvoiceItem, as: 'items' }]
  });

  if (!savedInvoice && bookingIdStr !== displayId) {
    savedInvoice = await Invoice.findOne({
      where: { order_id: bookingIdStr, type: 'SERVICE' },
      include: [{ model: InvoiceItem, as: 'items' }]
    });
  }

  if (!savedInvoice && booking && booking.auto_id) {
    // Dual prefix fallback (check alternate prefix)
    const altDisplayId = displayId.startsWith('SR-') ? `BKG-${booking.auto_id + 1000}` : `SR-${booking.auto_id + 1000}`;
    savedInvoice = await Invoice.findOne({
      where: { order_id: altDisplayId, type: 'SERVICE' },
      include: [{ model: InvoiceItem, as: 'items' }]
    });
  }

  if (!savedInvoice) {
    throw new AppError('Invoice not generated by Admin yet', 404);
  }

  // Generate the PDF buffer
  const billableItems = (savedInvoice.items || []).map(item => ({
    item_type: 'Item',
    description: item.description,
    price: parseFloat(item.rate),
    qty: item.qty
  }));

  if (parseFloat(savedInvoice.additional_charges) > 0) {
    billableItems.push({
      item_type: 'Additional Charges',
      description: savedInvoice.additional_charges_desc || 'Extra Fees',
      price: parseFloat(savedInvoice.additional_charges),
      qty: 1
    });
  }

  const subtotal = billableItems.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
  const gstAmount = parseFloat(savedInvoice.grand_total) - subtotal;

  const invoiceData = {
    invoice_number: savedInvoice.invoice_number,
    customer: {
      name: savedInvoice.customer_name,
      mobile: savedInvoice.mobile,
      address: savedInvoice.address || 'Address not provided'
    },
    items: billableItems,
    subtotal: subtotal,
    gst_percent: parseFloat(savedInvoice.gst_percent || 18),
    tax_amount: gstAmount > 0.01 ? gstAmount : 0,
    total_amount: parseFloat(savedInvoice.grand_total)
  };

  const pdfBuffer = await generateInvoicePdfBuffer(invoiceData);

  // If not already uploaded to Cloudinary, upload and save URL
  if (!savedInvoice.invoice_pdf_url) {
    try {
      const pdfUrl = await uploadPdfStreamToCloudinary(pdfBuffer, `invoice_${savedInvoice.invoice_number}`);
      savedInvoice.invoice_pdf_url = pdfUrl;
      await savedInvoice.save();
    } catch (err) {
      console.error('Failed to cache invoice PDF to Cloudinary:', err);
    }
  }

  return { pdfBuffer, invoice: savedInvoice };
};

const autoGenerateProductInvoice = async (orderId) => {
  const existingInvoice = await Invoice.findOne({ where: { order_id: orderId } });
  if (existingInvoice) {
    if (existingInvoice.status !== 'Paid') {
      existingInvoice.status = 'Paid';
      await existingInvoice.save();
    }
    return existingInvoice;
  }

  const order = await Order.findOne({
    where: { order_number: orderId },
    include: [
      { model: Customer, as: 'customer' },
      { 
        model: OrderItem, 
        as: 'items',
        include: [{ model: Product, as: 'product' }]
      }
    ]
  });

  if (!order) return null;

  const vendorId = (order.items && order.items.length > 0) ? order.items[0].vendor_id : null;
  const invoice_number = 'INV' + Date.now() + Math.floor(Math.random() * 1000);
  const grand_total = parseFloat(order.total_amount) || 0;

  const invoice = await Invoice.create({
    invoice_number,
    order_id: order.order_number,
    vendor_id: vendorId,
    customer_name: order.customer_name || (order.customer ? order.customer.full_name : 'N/A'),
    mobile: order.customer_contact || (order.customer ? order.customer.mobile : 'N/A'),
    email: order.customer ? order.customer.email : '',
    address: order.customer_address || '',
    additional_charges: 0,
    gst_percent: 18,
    grand_total,
    status: 'Paid',
    type: 'VENDOR'
  });

  if (order.items && order.items.length > 0) {
    for (const item of order.items) {
      await InvoiceItem.create({
        invoice_id: invoice.id,
        description: (item.product ? item.product.name : (item.Product ? item.Product.name : 'Product')),
        qty: item.qty || 1,
        rate: item.price || 0,
        amount: item.subtotal || 0,
        warranty: '',
        model_number: '',
        hsn_code: '',
        serial_numbers: '[]'
      });
    }
  }

  try {
    const billableItems = (order.items && order.items.length > 0) ? order.items.map(item => ({
      item_type: 'Product',
      description: (item.product ? item.product.name : (item.Product ? item.Product.name : 'Product')),
      price: parseFloat(item.price || 0),
      qty: parseInt(item.qty || 1, 10)
    })) : [];

    const subtotal = billableItems.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
    const gstAmount = grand_total - subtotal;

    const pdfInvoiceData = {
      invoice_number: invoice.invoice_number,
      customer: {
        name: invoice.customer_name,
        mobile: invoice.mobile,
        address: invoice.address || 'Address not provided'
      },
      items: billableItems,
      subtotal: subtotal,
      gst_percent: parseFloat(invoice.gst_percent || 18),
      tax_amount: gstAmount > 0.01 ? gstAmount : 0,
      total_amount: grand_total
    };

    const pdfBuffer = await generateInvoicePdfBuffer(pdfInvoiceData);
    const pdfUrl = await uploadPdfStreamToCloudinary(pdfBuffer, `invoice_${invoice.invoice_number}`);
    invoice.invoice_pdf_url = pdfUrl;
    await invoice.save();
  } catch (pdfErr) {
    console.error('Error auto-generating PDF for product order invoice:', pdfErr);
  }

  return invoice;
};

const generateOrderInvoicePdf = async (orderId) => {
  const orderIdStr = String(orderId || '').trim();

  let invoice = await Invoice.findOne({
    where: { order_id: orderIdStr, type: 'VENDOR' },
    include: [
      { model: InvoiceItem, as: 'items' },
      { model: Vendor, as: 'vendor' }
    ]
  });

  if (!invoice) {
    const { Op } = require('sequelize');
    const order = await Order.findOne({
      where: {
        [Op.or]: [{ order_number: orderIdStr }, { id: orderIdStr }]
      }
    });

    if (order) {
      invoice = await Invoice.findOne({
        where: { order_id: order.order_number, type: 'VENDOR' },
        include: [
          { model: InvoiceItem, as: 'items' },
          { model: Vendor, as: 'vendor' }
        ]
      });

      if (!invoice && (order.status === 'COMPLETED' || order.status === 'Delivered' || order.payment_status === 'PAID')) {
        await autoGenerateProductInvoice(order.order_number);
        invoice = await Invoice.findOne({
          where: { order_id: order.order_number, type: 'VENDOR' },
          include: [
            { model: InvoiceItem, as: 'items' },
            { model: Vendor, as: 'vendor' }
          ]
        });
      }
    }
  }

  if (!invoice) {
    throw new AppError('Invoice not found for this order', 404);
  }

  const billableItems = (invoice.items || []).map(item => ({
    item_type: 'Product',
    description: item.description,
    price: parseFloat(item.rate),
    qty: item.qty
  }));

  const subtotal = billableItems.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
  const gstAmount = parseFloat(invoice.grand_total) - subtotal;

  const invoiceData = {
    invoice_number: invoice.invoice_number,
    customer: {
      name: invoice.customer_name,
      mobile: invoice.mobile,
      address: invoice.address || 'Address not provided'
    },
    items: billableItems,
    subtotal: subtotal,
    gst_percent: parseFloat(invoice.gst_percent || 18),
    tax_amount: gstAmount > 0.01 ? gstAmount : 0,
    total_amount: parseFloat(invoice.grand_total)
  };

  const pdfBuffer = await generateInvoicePdfBuffer(invoiceData);

  if (!invoice.invoice_pdf_url) {
    try {
      const pdfUrl = await uploadPdfStreamToCloudinary(pdfBuffer, `invoice_${invoice.invoice_number}`);
      invoice.invoice_pdf_url = pdfUrl;
      await invoice.save();
    } catch (err) {
      console.error('Failed to cache order invoice PDF to Cloudinary:', err);
    }
  }

  return { pdfBuffer, invoice };
};

module.exports = {
  deleteAdminInvoice,
  createVendorInvoice,
  getAdminInvoices,
  generateServiceInvoicePdf,
  createServiceInvoice,
  getPendingServiceBookings,
  autoGenerateProductInvoice,
  generateOrderInvoicePdf
};
