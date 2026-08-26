const { z } = require('zod');

const createServiceSchema = z.object({
  name: z.string({ required_error: 'Service name is required' }).trim().min(2, 'Name must be at least 2 characters'),
  category_id: z.string({ required_error: 'Please select a valid Category' }).trim().uuid('Please select a valid Category'),
  image: z.string().url('Image must be a valid URL'),
  custom_fields: z.array(z.any()).optional().nullable(),

  // Admin-specific (Optional initially)
  prebooking_charge: z.coerce.number().min(0, 'Prebooking charge cannot be negative').optional().nullable(),

  // Partner-specific (Optional initially)
  pricing_type_id: z.string().uuid('Invalid pricing type ID').optional().nullable(),
  price: z.coerce.number().min(0).optional().nullable(), // maps to rate
  required_partner_type_id: z.string().uuid('Invalid partner type ID').optional().nullable()
}).refine(data => {
  const hasAdminFields = data.prebooking_charge !== undefined && data.prebooking_charge !== null;
  const hasPartnerFields = data.pricing_type_id !== undefined || data.required_partner_type_id !== undefined;

  // 1. Must pick exactly one type of service
  if (!hasAdminFields && !hasPartnerFields) return false;
  if (hasAdminFields && hasPartnerFields) return false;

  // 2. Strict Rule: If it's a Partner service, Price is MANDATORY
  if (hasPartnerFields) {
     if (data.price === undefined || data.price === null) {
         return false;
     }
  }

  return true;
}, {
  message: 'Invalid payload: Partner Services strictly require a price. Admin Services require a prebooking_charge.'
});

const updateServiceSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
  category: z.string().trim().optional(),
  pricing_type_id: z.string().uuid('Invalid pricing type ID').optional().nullable(),
  rate: z.coerce.number().min(0).optional().nullable(),
  required_partner_type_id: z.string().uuid('Invalid partner type ID').optional().nullable(),
  image: z.string().url('Image must be a valid URL').optional().nullable(),
  prebooking_charge: z.coerce.number().min(0).optional().nullable(),
  custom_fields: z.array(z.any()).optional().nullable()
});

const toggleServiceStatusSchema = z.object({
  is_active: z.boolean({ required_error: 'is_active flag is required' })
});

module.exports = {
  createServiceSchema,
  updateServiceSchema,
  toggleServiceStatusSchema
};
