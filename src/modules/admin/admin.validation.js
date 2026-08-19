const { z } = require('zod');

const createPartnerTypeSchema = z.object({
  name: z.string({ required_error: 'Partner type name is required' }).trim().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional()
});

const createPricingTypeSchema = z.object({
  name: z.string({ required_error: 'Pricing type name is required' }).trim().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional()
});

module.exports = {
  createPartnerTypeSchema,
  createPricingTypeSchema
};
