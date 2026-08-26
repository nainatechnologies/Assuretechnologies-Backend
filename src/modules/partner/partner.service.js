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

  const existingPartner = await Partner.findOne({ where: { email } });
  if (existingPartner) throw new AppError('Email already registered', 400);

  const existingMobile = await Partner.findOne({ where: { mobile } });
  if (existingMobile) throw new AppError('Mobile already registered', 400);

  const password_hash = await hashPassword(password);

  const partner = await Partner.create({
    email, mobile, password_hash, full_name, address,
    coverage_areas: coverage_areas || [],
    services_provided: services_provided || [],
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

module.exports = {
  getPartners,
  createPartner,
  getPartnerTypes,
  createPartnerType,
  updatePartnerType,
  togglePartnerTypeStatus,
  getPricingTypes,
  createPricingType,
  updatePricingType,
  togglePricingTypeStatus
};
