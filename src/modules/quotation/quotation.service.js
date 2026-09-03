const { Quotation, QuotationItem } = require('../../models');
const { sequelize } = require('../../config/database');
const AppError = require('../../utils/AppError');

const generateQuotationNumber = () => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(new Date());

  const p = {};
  parts.forEach(x => { p[x.type] = x.value; });
  return `QTN-${p.year}${p.month}${p.day}-${p.hour}${p.minute}${p.second}`;
};

const createQuotation = async (data) => {
  const transaction = await sequelize.transaction();
  try {
    const quotationNumber = generateQuotationNumber();

    // 1. Calculate items total
    let subtotal = 0;
    const itemsData = (data.services || []).map(item => {
      const itemTotal = Number(item.qty) * Number(item.cost);
      subtotal += itemTotal;
      return {
        service_name: item.service_name,
        qty: item.qty,
        cost: item.cost,
        total: itemTotal
      };
    });

    // 2. Calculate grand total
    const additionalCharges = Number(data.additional_charges || 0);
    const gstPercent = Number(data.gst_percent !== undefined ? data.gst_percent : 18);
    const totalBeforeGst = subtotal + additionalCharges;
    const gstAmount = (totalBeforeGst * gstPercent) / 100;
    const grandTotal = totalBeforeGst + gstAmount;

    // 3. Create Quotation record
    const quotation = await Quotation.create({
      quotation_number: quotationNumber,
      customer_name: data.customer_name,
      mobile: data.mobile,
      email: data.email || null,
      company_name: data.company_name || null,
      gst_number: data.gst_number ? data.gst_number.toUpperCase() : null,
      address: data.address || null,
      pincode: data.pincode || null,
      subtotal,
      additional_charges_desc: data.additional_charges_desc || null,
      additional_charges: additionalCharges,
      gst_percent: gstPercent,
      grand_total: grandTotal
    }, { transaction });

    // 4. Create Quotation Items
    const itemsWithFk = itemsData.map(item => ({
      ...item,
      quotation_id: quotation.id
    }));
    await QuotationItem.bulkCreate(itemsWithFk, { transaction });

    await transaction.commit();

    return await Quotation.findByPk(quotation.id, {
      include: [{ model: QuotationItem, as: 'items' }]
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getQuotations = async () => {
  const quotations = await Quotation.findAll({
    include: [{ model: QuotationItem, as: 'items' }],
    order: [['createdAt', 'DESC']]
  });
  return { data: quotations, total: quotations.length };
};

const getQuotationById = async (id) => {
  const quotation = await Quotation.findByPk(id, {
    include: [{ model: QuotationItem, as: 'items' }]
  });
  if (!quotation) {
    throw new AppError('Quotation not found', 404);
  }
  return quotation;
};

const deleteQuotation = async (id) => {
  const quotation = await Quotation.findByPk(id);
  if (!quotation) {
    throw new AppError('Quotation not found', 404);
  }
  await quotation.destroy();
  return { success: true, message: 'Quotation deleted successfully' };
};

module.exports = {
  createQuotation,
  getQuotations,
  getQuotationById,
  deleteQuotation
};
