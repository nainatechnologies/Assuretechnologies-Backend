const { z } = require('zod');

const addToCartSchema = z.object({
  productId: z.string().min(1, 'Invalid product ID'),
  quantity: z.coerce.number().int().positive('Quantity must be at least 1').default(1)
});

const updateCartItemSchema = z.object({
  productId: z.string().min(1, 'Invalid product ID'),
  quantity: z.coerce.number().int().nonnegative('Quantity must be 0 or greater')
});

module.exports = {
  addToCartSchema,
  updateCartItemSchema
};


