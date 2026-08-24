const { Op } = require('sequelize');
const crypto = require('crypto');
const stringSimilarity = require('string-similarity');
const { Service, Category, PricingType, PartnerType } = require('../../models');
const AppError = require('../../utils/AppError');

// Helper to auto-generate IDs for custom fields
const processCustomFields = (fields) => {
  if (!fields || !Array.isArray(fields)) return fields;
  return fields.map(field => {
    if (!field.id) field.id = 'cf_' + crypto.randomBytes(4).toString('hex');
    return field;
  });
};

const createService = async (data) => {
  // Check for duplicates (same name, category, and owner type)
  const existingServices = await Service.findAll({
    where: {
      category_id: data.category_id,
      service_owner_type: data.service_owner_type
    },
    attributes: ['name']
  });

  if (existingServices.length > 0) {
    const existingNames = existingServices.map(s => s.name);
    
    // Compare incoming name against all existing names
    const bestMatch = stringSimilarity.findBestMatch(data.name, existingNames).bestMatch;
    
    // If the highest score is > 0.85 (85% similar), block it!
    if (bestMatch.rating > 0.85) {
      throw new AppError(`Name is too similar to an existing service: '${bestMatch.target}'. Did you make a typo?`, 409);
    }
  }

  const serviceData = {
    ...data,
    custom_fields: processCustomFields(data.custom_fields)
  };
  return await Service.create(serviceData);
};

/**
 * Fetch Public Services (For Customer App)
 * - Excludes inactive services.
 * - Excludes sensitive fields like image_public_id or margins.
 * - Joins Category Name.
 */
const getPublicServices = async ({ search, category_id, service_owner_type, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const whereClause = { is_active: true }; // Force only active services

  if (search) whereClause.name = { [Op.like]: `%${search}%` };
  if (category_id) whereClause.category_id = category_id;
  if (service_owner_type) whereClause.service_owner_type = service_owner_type;

  const { count, rows } = await Service.findAndCountAll({
    where: whereClause,
    attributes: { 
      exclude: [
        'image_public_id', 
        'createdAt', 
        'updatedAt',
        'service_owner_type',
        'pricing_type_id',
        'required_partner_type_id'
      ] 
    }, // Hide sensitive/internal data from the mobile app
    include: [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name'] // Removed 'image' since the Category table doesn't have it
      }
    ],
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    order: [['createdAt', 'DESC']]
  });

  // Clean up the JSON by removing any keys that are strictly `null` (like `price` for Admin services)
  const cleanServices = rows.map(service => {
    const serviceJSON = service.toJSON();
    Object.keys(serviceJSON).forEach(key => {
      if (serviceJSON[key] === null) {
        delete serviceJSON[key];
      }
    });
    return serviceJSON;
  });

  return { total: count, page: parseInt(page, 10), limit: parseInt(limit, 10), services: cleanServices };
};

/**
 * Fetch Admin Services (For Admin Dashboard)
 * - Returns everything (Active & Inactive).
 * - Includes all relationships (Category, PricingType, PartnerType).
 */
const getAdminServices = async ({ search, category_id, service_owner_type, is_active, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const whereClause = {};

  if (is_active !== undefined) whereClause.is_active = is_active;
  if (search) whereClause.name = { [Op.like]: `%${search}%` };
  if (category_id) whereClause.category_id = category_id;
  if (service_owner_type) whereClause.service_owner_type = service_owner_type;

  const { count, rows } = await Service.findAndCountAll({
    where: whereClause,
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name'] },
      { model: PricingType, as: 'pricingType', attributes: ['id', 'name'] },
      { model: PartnerType, as: 'requiredPartnerType', attributes: ['id', 'name'] }
    ],
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    order: [['createdAt', 'DESC']]
  });

  return { total: count, page: parseInt(page, 10), limit: parseInt(limit, 10), services: rows };
};

const updateService = async (id, updateData) => {
  const service = await Service.findByPk(id);
  if (!service) throw new AppError('Service not found', 404);
  if (updateData.service_owner_type) delete updateData.service_owner_type;
  if (updateData.custom_fields) updateData.custom_fields = processCustomFields(updateData.custom_fields);
  await service.update(updateData);
  return service;
};

const toggleServiceStatus = async (id, is_active) => {
  const service = await Service.findByPk(id);
  if (!service) throw new AppError('Service not found', 404);
  await service.update({ is_active });
  return service;
};

module.exports = {
  createService,
  getPublicServices,
  getAdminServices,
  updateService,
  toggleServiceStatus
};
