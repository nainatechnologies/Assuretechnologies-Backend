const { z } = require('zod');

const orderItemsSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  qty: z.number().int().positive('Quantity must be positive'),
});

const createOrderSchema = z.object({
  items: z.array(orderItemsSchema).min(1, 'Order must contain at least one item'),
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_contact: z.string().regex(/^\d{10}$/, 'Invalid contact number format'),
  customer_address: z.string().min(1, 'Customer address is required'),
  payment_status: z.enum(['PENDING', 'PAID']).optional(),
  company_name: z.string().min(2, 'Company name must be at least 2 characters').max(100, 'Company name too long').optional().or(z.literal('')),
  gst_number: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Zz]{1}[0-9A-Z]{1}$/, 'Invalid 15-digit GST Number format').optional().or(z.literal(''))
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['NEW', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'])
});

const updateOrderTrackingSchema = z.object({
  transportName: z.string().min(1, 'Transport name is required'),
  trackingId: z.string().min(1, 'Tracking ID is required'),
  trackUrl: z.string().optional().nullable()
});

const splitOrderItemSchema = z.object({
  newVendorId: z.string().uuid('Invalid vendor ID').nullable(),
  qtyToTransfer: z.number().int().positive('Quantity must be positive')
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  updateOrderTrackingSchema,
  splitOrderItemSchema,
};

