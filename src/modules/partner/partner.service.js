const Partner = require('./partner.model');
const PartnerType = require('./partnerType.model');
const PricingType = require('./pricingType.model');
const Category = require('../category/category.model');
const { hashPassword } = require('../../utils/hash');
const AppError = require('../../utils/AppError');

const getPartners = async () => {
  return await Partner.findAll({
    attributes: { exclude: ['password_hash'] },
    include: [{ model: PartnerType, as: 'partnerType' }],
    order: [['createdAt', 'DESC']]
  });
};

const createPartner = async (data) => {
  const { email, mobile, password, full_name, address, coverage_areas, services_provided, partner_type_id, custom_field_values } = data;

  if (!services_provided || !Array.isArray(services_provided) || services_provided.length === 0) {
    throw new AppError('At least one service is required for a partner.', 400);
  }

  if (!coverage_areas || !Array.isArray(coverage_areas) || coverage_areas.length === 0) {
    throw new AppError('At least one coverage area (pincode) is required for a partner.', 400);
  }

  const existingPartner = await Partner.findOne({ where: { email } });
  if (existingPartner) throw new AppError('Email already registered', 400);

  const existingMobile = await Partner.findOne({ where: { mobile } });
  if (existingMobile) throw new AppError('Mobile already registered', 400);

  const password_hash = await hashPassword(password);

  const partner = await Partner.create({
    email, mobile, password_hash, full_name, address,
    coverage_areas,
    services_provided,
    partner_type_id,
    custom_field_values: custom_field_values || {},
    is_active: true
  });

  return partner;
};

const getPartnerTypes = async () => {
  return await PartnerType.findAll({ 
    include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']] 
  });
};

const createPartnerType = async (data) => {
  const { name, category_id, custom_fields } = data;
  return await PartnerType.create({ name, category_id, custom_fields: custom_fields || [] });
};

const updatePartnerType = async (id, updateData) => {
  const type = await PartnerType.findByPk(id);
  if (!type) throw new AppError('Partner type not found', 404);
  await type.update(updateData);
  return type;
};

const togglePartnerTypeStatus = async (id, is_active) => {
  const type = await PartnerType.findByPk(id);
  if (!type) throw new AppError('Partner type not found', 404);
  await type.update({ is_active });
  return type;
};

const getPricingTypes = async () => {
  return await PricingType.findAll({ order: [['createdAt', 'DESC']] });
};

const createPricingType = async (data) => {
  const { name, label } = data;
  return await PricingType.create({ name, label });
};

const updatePricingType = async (id, updateData) => {
  const type = await PricingType.findByPk(id);
  if (!type) throw new AppError('Pricing type not found', 404);
  await type.update(updateData);
  return type;
};

const togglePricingTypeStatus = async (id, is_active) => {
  const type = await PricingType.findByPk(id);
  if (!type) throw new AppError('Pricing type not found', 404);
  await type.update({ is_active });
  return type;
};

const updatePartner = async (id, updateData) => {
  const partner = await Partner.findByPk(id);
  if (!partner) throw new AppError('Partner not found', 404);

  if (updateData.email && updateData.email !== partner.email) {
    const existingPartner = await Partner.findOne({ where: { email: updateData.email } });
    if (existingPartner) throw new AppError('Email already registered', 400);
  }

  if (updateData.mobile && updateData.mobile !== partner.mobile) {
    const existingMobile = await Partner.findOne({ where: { mobile: updateData.mobile } });
    if (existingMobile) throw new AppError('Mobile already registered', 400);
  }

  if (updateData.password) {
    updateData.password_hash = await hashPassword(updateData.password);
    delete updateData.password;
  }

  if (updateData.services_provided && (!Array.isArray(updateData.services_provided) || updateData.services_provided.length === 0)) {
    throw new AppError('At least one service is required for a partner.', 400);
  }

  if (updateData.coverage_areas && (!Array.isArray(updateData.coverage_areas) || updateData.coverage_areas.length === 0)) {
    throw new AppError('At least one coverage area (pincode) is required for a partner.', 400);
  }

  await partner.update(updateData);
  return await Partner.findByPk(id, {
    attributes: { exclude: ['password_hash'] },
    include: [{ model: PartnerType, as: 'partnerType' }]
  });
};

const togglePartnerStatus = async (id, is_active) => {
  const partner = await Partner.findByPk(id);
  if (!partner) throw new AppError('Partner not found', 404);
  await partner.update({ is_active });
  return partner;
};

module.exports = {
  getPartners,
  createPartner,
  updatePartner,
  togglePartnerStatus,
  getPartnerTypes,
  createPartnerType,
  updatePartnerType,
  togglePartnerTypeStatus,
  getPricingTypes,
  createPricingType,
  updatePricingType,
  togglePricingTypeStatus
};
