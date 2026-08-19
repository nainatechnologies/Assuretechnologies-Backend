const { z } = require('zod');

const productSchema = z.object({
  name: z.string({ required_error: 'Product name is required' }).trim().min(3, 'Product name must be at least 3 characters'),
  description: z.string({ required_error: 'Product description is required' }).trim().min(10, 'Product description must be at least 10 characters'),
  price: z.coerce.number({ required_error: 'Price is required' }).positive('Price must be greater than 0'),
  category_id: z.coerce.number().int().positive('Invalid category ID'),
  partner_type_id: z.coerce.number().int().positive('Invalid partner type ID').optional(),
  vendor_id: z.coerce.number().int().positive('Invalid vendor ID').optional(),
});

module.exports = {
  createProductSchema: productSchema,
  updateProductSchema: productSchema.partial(),
};
