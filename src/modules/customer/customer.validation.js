const { z } = require('zod');

const addAddressSchema = z.object({
  address_line1: z.string({ required_error: 'Address line 1 is required' }).trim().min(5, 'Address line 1 must be at least 5 characters'),
  address_line2: z.string().optional(),
  city: z.string({ required_error: 'City is required' }).trim().min(3, 'City must be at least 3 characters'),
  state: z.string({ required_error: 'State is required' }).trim().min(3, 'State must be at least 3 characters'),
  pincode: z.string({ required_error: 'Pincode is required' }).trim().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
  landmark: z.string().optional(),
  is_default: z.boolean().optional().default(false)
});

const updateProfileSchema = z.object({
  full_name: z.string().min(3, 'Full name must be at least 3 characters').optional(),
  full_address: z.string().min(10, 'Full address must be at least 10 characters').optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits').optional(),
  state_name: z.string().min(3, 'State must be at least 3 characters').optional(),
});

module.exports = {
  updateProfileSchema,
  addAddressSchema
};


