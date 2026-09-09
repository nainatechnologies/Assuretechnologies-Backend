const PDFDocument = require('pdfkit');

function buildInvoicePdf(invoiceData, dataCallback, endCallback) {
  const doc = new PDFDocument({ margin: 50 });

  doc.on('data', dataCallback);
  doc.on('end', endCallback);

  generateHeader(doc);
  generateCustomerInformation(doc, invoiceData);
  generateInvoiceTable(doc, invoiceData);
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
  const customer = invoiceData.customer;
  
  doc
    .fillColor('#444444')
    .fontSize(20)
    .text('Invoice', 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .text('Invoice Number:', 50, customerInformationTop)
    .font('Helvetica-Bold')
    .text(invoiceData.invoice_number, 150, customerInformationTop)
    .font('Helvetica')
    .text('Invoice Date:', 50, customerInformationTop + 15)
    .text(new Date().toLocaleDateString(), 150, customerInformationTop + 15)
    
    .text('Bill To:', 300, customerInformationTop)
    .font('Helvetica-Bold')
    .text(customer.name, 300, customerInformationTop + 15)
    .font('Helvetica')
    .text(customer.address || 'Address not provided', 300, customerInformationTop + 30)
    .text(customer.mobile, 300, customerInformationTop + 45)
    .moveDown();

  generateHr(doc, 260);
}

function generateInvoiceTable(doc, invoiceData) {
  let i;
  const invoiceTableTop = 330;

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

  let position = 0;
  for (i = 0; i < invoiceData.items.length; i++) {
    const item = invoiceData.items[i];
    position = invoiceTableTop + 30 + (i * 30);
    generateTableRow(
      doc,
      position,
      item.item_type || 'Service',
      item.description,
      formatCurrency(item.price),
      item.qty,
      formatCurrency(item.price * item.qty)
    );

    generateHr(doc, position + 20);
  }

  const subtotalPosition = position + 40;
  doc.font('Helvetica-Bold');
  generateTableRow(
    doc,
    subtotalPosition,
    '',
    '',
    'Subtotal',
    '',
    formatCurrency(invoiceData.total_amount)
  );

  const totalPosition = subtotalPosition + 20;
  doc.font('Helvetica-Bold');
  generateTableRow(
    doc,
    totalPosition,
    '',
    '',
    'Total',
    '',
    formatCurrency(invoiceData.total_amount)
  );
}

function generateFooter(doc) {
  doc
    .fontSize(10)
    .text(
      'Payment is due within 15 days. Thank you for your business.',
      50,
      780,
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
