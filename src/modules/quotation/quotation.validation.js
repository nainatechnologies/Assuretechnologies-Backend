const { z } = require('zod');

const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Zz]{1}[0-9A-Z]{1}$/;
const mobileRegex = /^(\+91[\-\s]?)?[6-9]\d{9}$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;

const serviceItemSchema = z.object({
  service_name: z.string().min(1, 'Service name is required'),
  qty: z.number().int().min(1).default(1),
  cost: z.number().min(0, 'Cost must be positive')
});

const createQuotationSchema = z.object({
  customer_name: z.string().min(2, 'Customer name must be at least 2 characters'),
  mobile: z.string().regex(mobileRegex, 'Invalid 10-digit Indian mobile number'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')).nullable(),
  company_name: z.string().optional().or(z.literal('')).nullable(),
  gst_number: z.string().regex(gstRegex, 'Invalid 15-character GSTIN format').optional().or(z.literal('')).nullable(),
  address: z.string().optional().or(z.literal('')).nullable(),
  pincode: z.string().regex(pincodeRegex, 'Pincode must be exactly 6 digits').optional().or(z.literal('')).nullable(),
  services: z.array(serviceItemSchema).min(1, 'At least one service item is required'),
  additional_charges_desc: z.string().optional().or(z.literal('')).nullable(),
  additional_charges: z.number().optional().default(0),
  gst_percent: z.number().min(0).max(100).optional().default(18)
});

module.exports = {
  createQuotationSchema
};
