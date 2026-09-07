const { z } = require('zod');

const createProductSchema = z.object({
  name: z.string({ required_error: 'Product name is required' }).trim().min(2, 'Product name must be at least 2 characters'),
  category: z.string({ required_error: 'Category is required' }).trim().min(2, 'Category must be at least 2 characters'),
  base_price: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
    z.number({ required_error: 'Price is required' }).positive('Price must be greater than 0')
  ).optional(),
  price: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
    z.number().positive('Price must be greater than 0')
  ).optional(),
  discount: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? 0 : Number(val)),
    z.number().min(0, 'Discount cannot be negative').max(100, 'Discount cannot exceed 100')
  ).optional().default(0),
  admin_commission: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? 0 : Number(val)),
    z.number().min(0, 'Admin commission cannot be negative').max(100, 'Admin commission cannot exceed 100')
  ).optional().default(0),
  stock: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? 0 : Number(val)),
    z.number().int().min(0, 'Stock cannot be negative')
  ).optional().default(0),
  description: z.string().trim().optional().nullable().default(''),
  status: z.enum(['In Stock', 'Out of Stock', 'Draft', 'Active', 'Inactive']).optional().default('In Stock'),
  banner: z.string().optional().nullable()
}).refine((data) => data.base_price !== undefined || data.price !== undefined, {
  message: 'Price (base_price or price) is required',
  path: ['base_price']
});

const updateProductSchema = z.object({
  name: z.string().trim().min(2, 'Product name must be at least 2 characters').optional(),
  category: z.string().trim().min(2, 'Category must be at least 2 characters').optional(),
  base_price: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
    z.number().positive('Price must be greater than 0')
  ).optional(),
  price: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
    z.number().positive('Price must be greater than 0')
  ).optional(),
  discount: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
    z.number().min(0).max(100)
  ).optional(),
  admin_commission: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
    z.number().min(0).max(100)
  ).optional(),
  stock: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
    z.number().int().min(0)
  ).optional(),
  description: z.string().trim().optional().nullable(),
  status: z.enum(['In Stock', 'Out of Stock', 'Draft', 'Active', 'Inactive']).optional(),
  banner: z.string().optional().nullable()
});

module.exports = {
  createProductSchema,
  updateProductSchema
};
