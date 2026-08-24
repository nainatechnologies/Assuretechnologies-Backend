const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const { PartnerType, PricingType } = require('../../models');

/**
 * Middleware to dynamically determine if a service belongs to an Admin or a Partner.
 * This ensures the frontend cannot spoof the service_owner_type.
 * Relies on the payload having passed Zod validation first.
 */
const setServiceOwnerType = (req, res, next) => {
  // If pricing_type_id is provided, it's a Partner template service.
  if (req.body.pricing_type_id !== undefined && req.body.pricing_type_id !== null) {
    req.body.service_owner_type = 'PARTNER';
  } else {
    // Otherwise, it's a standard Admin service.
    req.body.service_owner_type = 'ADMIN';
  }

  next();
};

/**
 * Middleware to verify that the selected Partner Type and Pricing Type exist and match the Category.
 */
const validateCategoryMatch = asyncHandler(async (req, res, next) => {
  const { category_id, required_partner_type_id, pricing_type_id } = req.body;

  // 1. Check if Pricing Type exists (if provided)
  if (pricing_type_id) {
    const pricingType = await PricingType.findByPk(pricing_type_id);
    if (!pricingType) {
      throw new AppError('The selected Pricing Type is invalid or does not exist.', 400);
    }
  }

  // 2. Check if Partner Type exists and belongs to the selected Category
  if (required_partner_type_id) {
    const partnerType = await PartnerType.findByPk(required_partner_type_id);
    
    if (!partnerType) {
      throw new AppError('The selected Partner Type is invalid or no longer exists.', 400);
    }

    if (partnerType.category_id !== category_id) {
      throw new AppError('Mismatch Error: The selected Partner Type does not belong to the selected Category.', 400);
    }
  }

  next();
});

module.exports = {
  setServiceOwnerType,
  validateCategoryMatch
};
