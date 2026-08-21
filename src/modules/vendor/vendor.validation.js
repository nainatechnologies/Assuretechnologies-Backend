const { z } = require('zod');

const updateProfileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  address: z.string().min(10, 'Address must be at least 10 characters').optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits').optional(),
  business_description: z.string().optional(),
});

module.exports = {
  updateProfileSchema
};
