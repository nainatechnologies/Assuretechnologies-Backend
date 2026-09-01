const { z } = require('zod');

const addAddressSchema = z.object({
  full_name: z.string({ required_error: 'Full name is required' }).trim().min(3, 'Full name must be at least 3 characters'),
  mobile_number: z.string({ required_error: 'Mobile number is required' }).trim().regex(/^[6-9]\d{9}$/, 'Invalid 10-digit mobile number'),
  address_line1: z.string({ required_error: 'Address line 1 is required' }).trim().min(5, 'Address line 1 must be at least 5 characters'),
  address_line2: z.string().optional().nullable(),
  city: z.string({ required_error: 'City is required' }).trim().min(3, 'City must be at least 3 characters'),
  state: z.string({ required_error: 'State is required' }).trim().min(2, 'State must be at least 2 characters'),
  pincode: z.string({ required_error: 'Pincode is required' }).trim().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
  landmark: z.string().optional().nullable(),
  is_default: z.boolean().optional().default(false)
});

const updateProfileSchema = z.object({
  full_name: z.string().min(3, 'Full name must be at least 3 characters').optional(),
  full_address: z.string().min(10, 'Full address must be at least 10 characters').optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits').optional(),
  state_name: z.string().min(3, 'State must be at least 3 characters').optional(),
});

const updateAddressSchema = z.object({
  full_name: z.string().trim().min(3, 'Full name must be at least 3 characters').optional(),
  mobile_number: z.string().trim().regex(/^[6-9]\d{9}$/, 'Invalid 10-digit mobile number').optional(),
  address_line1: z.string().trim().min(5, 'Address line 1 must be at least 5 characters').optional(),
  address_line2: z.string().optional().nullable(),
  city: z.string().trim().min(3, 'City must be at least 3 characters').optional(),
  state: z.string().trim().min(2, 'State must be at least 2 characters').optional(),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits').optional(),
  landmark: z.string().optional().nullable(),
  is_default: z.boolean().optional()
});

module.exports = {
  updateAddressSchema,
  updateProfileSchema,
  addAddressSchema
};


