const PDFDocument = require('pdfkit');

function buildInvoicePdf(invoiceData, dataCallback, endCallback) {
  const doc = new PDFDocument({ margin: 50 });

  doc.on('data', dataCallback);
  doc.on('end', endCallback);

  generateHeader(doc);
  const customerBottomY = generateCustomerInformation(doc, invoiceData);
  const tableTop = Math.max(310, (customerBottomY || 260) + 25);
  generateInvoiceTable(doc, invoiceData, tableTop);
  generateFooter(doc);

  doc.end();
}

function generateHeader(doc) {
  doc
    .fillColor('#444444')
    .fontSize(20)
    .text('Assure Technologies', 50, 57)
    .fontSize(10)
    .text('123 Tech Avenue', 200, 65, { align: 'right' })
    .text('Hyderabad, Telangana, 500001', 200, 80, { align: 'right' })
    .moveDown();
}

function generateCustomerInformation(doc, invoiceData) {
  const customer = invoiceData.customer || {};
  
  doc
    .fillColor('#444444')
    .fontSize(20)
    .text('Invoice', 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .font('Helvetica')
    .text('Invoice Number:', 50, customerInformationTop)
    .font('Helvetica-Bold')
    .text(invoiceData.invoice_number || 'N/A', 150, customerInformationTop)
    .font('Helvetica')
    .text('Invoice Date:', 50, customerInformationTop + 15)
    .text(new Date().toLocaleDateString(), 150, customerInformationTop + 15);
    
  const billToX = 300;
  const billToWidth = 240;

  doc
    .font('Helvetica')
    .text('Bill To:', billToX, customerInformationTop);

  let currentY = customerInformationTop + 15;

  if (customer.name) {
    doc.font('Helvetica-Bold').text(customer.name, billToX, currentY, { width: billToWidth });
    currentY += doc.heightOfString(customer.name, { width: billToWidth }) + 4;
  }

  let addressText = customer.address || 'Address not provided';
  if (typeof addressText === 'string' && addressText.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(addressText);
      addressText = [parsed.line1, parsed.line2, parsed.city, parsed.state, parsed.country].filter(Boolean).join(', ');
    } catch (e) {}
  }

  doc.font('Helvetica').text(addressText, billToX, currentY, { width: billToWidth });
  currentY += doc.heightOfString(addressText, { width: billToWidth }) + 4;

  if (customer.mobile) {
    doc.text(customer.mobile, billToX, currentY, { width: billToWidth });
    currentY += doc.heightOfString(customer.mobile, { width: billToWidth }) + 4;
  }

  const hrY = Math.max(260, currentY + 10);
  generateHr(doc, hrY);

  return hrY;
}

function generateInvoiceTable(doc, invoiceData, startTop = 330) {
  let i;
  const invoiceTableTop = startTop;

  doc.font('Helvetica-Bold');
  generateTableRow(
    doc,
    invoiceTableTop,
    'Item',
    'Description',
    'Unit Cost',
    'Quantity',
    'Line Total'
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font('Helvetica');

  // Filter out any tax items from table rows so tax has no quantity column
  const allItems = invoiceData.items || [];
  const taxItem = allItems.find(item => item.item_type === 'Tax');
  const items = allItems.filter(item => item.item_type !== 'Tax');

  let position = invoiceTableTop;
  for (i = 0; i < items.length; i++) {
    const item = items[i];
    position = invoiceTableTop + 30 + (i * 30);
    generateTableRow(
      doc,
      position,
      item.item_type || 'Service',
      item.description,
      formatCurrency(item.price),
      String(item.qty != null ? item.qty : ''),
      formatCurrency(item.price * (item.qty || 1))
    );

    generateHr(doc, position + 20);
  }

  const subtotal = invoiceData.subtotal !== undefined
    ? parseFloat(invoiceData.subtotal)
    : items.reduce((acc, curr) => acc + (parseFloat(curr.price || 0) * parseInt(curr.qty || 1, 10)), 0);

  const taxAmount = invoiceData.tax_amount !== undefined
    ? parseFloat(invoiceData.tax_amount)
    : (taxItem ? parseFloat(taxItem.price || 0) : Math.max(0, parseFloat(invoiceData.total_amount || 0) - subtotal));

  const totalAmount = invoiceData.total_amount !== undefined
    ? parseFloat(invoiceData.total_amount)
    : (subtotal + taxAmount);

  const gstPercent = invoiceData.gst_percent !== undefined
    ? parseFloat(invoiceData.gst_percent)
    : 18;

  let summaryY = (items.length > 0 ? position : invoiceTableTop) + 35;

  // 1. Subtotal (Taxable Amount)
  doc.font('Helvetica-Bold');
  generateTableRow(
    doc,
    summaryY,
    '',
    '',
    'Subtotal',
    '',
    formatCurrency(subtotal)
  );

  // 2. GST Breakdown (if applicable, without any quantity)
  if (taxAmount > 0.001) {
    summaryY += 20;
    doc.font('Helvetica');
    const taxLabel = taxItem?.description || `GST (${gstPercent}%)`;
    generateTableRow(
      doc,
      summaryY,
      '',
      '',
      taxLabel,
      '', // No quantity for tax!
      formatCurrency(taxAmount)
    );
  }

  // 3. Grand Total
  summaryY += 25;
  generateHr(doc, summaryY - 5);
  doc.font('Helvetica-Bold');
  generateTableRow(
    doc,
    summaryY,
    '',
    '',
    'Total',
    '',
    formatCurrency(totalAmount)
  );
}

function generateFooter(doc) {
  doc
    .fontSize(10)
    .fillColor('#666666')
    .text(
      'Thank you for your business.',
      50,
      700,
      { align: 'center', width: 500 }
    );
}

function generateTableRow(doc, y, item, description, unitCost, quantity, lineTotal) {
  doc
    .fontSize(10)
    .text(item, 50, y, { width: 90 })
    .text(description, 150, y, { width: 190 })
    .text(unitCost, 280, y, { width: 90, align: 'right' })
    .text(quantity, 370, y, { width: 90, align: 'right' })
    .text(lineTotal, 0, y, { align: 'right' });
}

function generateHr(doc, y) {
  doc
    .strokeColor('#aaaaaa')
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}

function formatCurrency(amount) {
  return 'Rs. ' + Number(amount).toFixed(2);
}

function generateInvoicePdfBuffer(invoiceData) {
  return new Promise((resolve, reject) => {
    try {
      const chunks = [];
      buildInvoicePdf(
        invoiceData,
        (chunk) => chunks.push(chunk),
        () => resolve(Buffer.concat(chunks))
      );
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  buildInvoicePdf,
  generateInvoicePdfBuffer
};
