const { z } = require('zod');

const createCategorySchema = z.object({
  name: z.string({ required_error: 'Category name is required' }).trim().min(2, 'Name must be at least 2 characters'),
  is_active: z.boolean().optional()
});

const createPartnerTypeSchema = z.object({
  name: z.string({ required_error: 'Partner type name is required' }).trim().min(2, 'Name must be at least 2 characters'),
  category_id: z.string({ required_error: 'Category ID is required' }).uuid('Please select a valid Category.'),
  description: z.string().optional(),
  custom_fields: z.array(z.any()).optional()
});

const createPricingTypeSchema = z.object({
  name: z.string({ required_error: 'Pricing type name is required' }).trim().min(2, 'Name must be at least 2 characters'),
  label: z.string({ required_error: 'Frontend label is required' }).trim(),
  description: z.string().optional()
});

module.exports = {
  createCategorySchema,
  createPartnerTypeSchema,
  createPricingTypeSchema
};
