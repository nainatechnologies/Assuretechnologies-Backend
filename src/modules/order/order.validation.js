const { z } = require('zod');

const createOrderSchema = z.object({
  items: z.array(z.object({
    product_id: z.coerce.number().int().positive('Invalid product ID'),
    quantity: z.coerce.number().int().positive('Quantity must be at least 1')
  })).min(1, 'Order must contain at least one item'),
  shipping_address_id: z.coerce.number().int().positive('Invalid shipping address ID').optional(),
  payment_method: z.enum(['cod', 'online']).default('cod'),
});

const splitOrderItemSchema = z.object({
  quantity_to_split: z.coerce.number().int().positive('Quantity to split must be at least 1')
});

module.exports = {
  createOrderSchema,
  splitOrderItemSchema
};
