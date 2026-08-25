const { z } = require('zod');

const updateProfileSchema = z.object({
  full_name: z.string().min(3, 'Full name must be at least 3 characters').optional(),
  business_name: z.string().min(3, 'Business name must be at least 3 characters').optional(),
  gst_number: z.string().length(15, 'GST number must be exactly 15 characters').optional(),
  address: z.string().min(10, 'Address must be at least 10 characters').optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits').optional(),
  business_description: z.string().optional(),
});

module.exports = {
  updateProfileSchema
};
