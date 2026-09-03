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

const updatePartnerTypeSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
  category_id: z.string().uuid('Please select a valid Category.').optional(),
  description: z.string().optional(),
  custom_fields: z.array(z.any()).optional()
});

const createPricingTypeSchema = z.object({
  name: z.string({ required_error: 'Pricing type name is required' }).trim().min(2, 'Name must be at least 2 characters'),
  label: z.string({ required_error: 'Frontend label is required' }).trim(),
  description: z.string().optional()
});

const updatePricingTypeSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
  label: z.string().trim().optional(),
  description: z.string().optional()
});

const updatePartnerSchema = z.object({
  full_name: z.string().trim().min(3, 'Name must be at least 3 characters long').optional(),
  email: z.string().trim().toLowerCase().email('Please provide a valid email address').optional(),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters long').optional().nullable(),
  address: z.string().trim().min(5, 'Address must be at least 5 characters long').optional(),
  partner_type_id: z.string().uuid('Please select a valid partner type').optional(),
  coverage_areas: z.array(z.string().regex(/^\d{6}$/, 'Each coverage area must be a valid 6-digit pincode')).min(1, 'Please provide at least one coverage pincode').optional(),
  services_provided: z.array(z.string().uuid('Please select a valid service from the list')).min(1, 'Please select at least one service').optional(),
  custom_field_values: z.record(z.any()).optional(),
  is_active: z.boolean().optional()
});

module.exports = {
  createCategorySchema,
  createPartnerTypeSchema,
  updatePartnerTypeSchema,
  createPricingTypeSchema,
  updatePricingTypeSchema,
  updatePartnerSchema
};
