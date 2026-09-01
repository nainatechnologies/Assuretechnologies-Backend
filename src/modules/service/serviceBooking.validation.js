const { z } = require('zod');

const BOOKING_STATUSES = ['NEW', 'ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'COMPLETED', 'CANCELLED'];

const isoDateString = z.string({ required_error: 'Scheduled date is required' }).refine((value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  
  // Normalize both dates to midnight to allow booking for "today"
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const scheduled = new Date(date);
  scheduled.setHours(0, 0, 0, 0);
  
  return scheduled.getTime() >= today.getTime();
}, {
  message: 'Scheduled date must be a valid date and cannot be in the past',
});

const addressSchema = z.union([
  z.string().min(5, 'Address is too short'),
  z.object({
    line1: z.string().min(3, 'Address line 1 is required').optional(),
    line2: z.string().optional(),
    city: z.string().min(2, 'City is required').optional(),
    state: z.string().min(2, 'State is required').optional(),
    country: z.string().min(2, 'Country is required').optional(),
    landmark: z.string().optional(),
  }).passthrough()
]);

const createServiceBookingSchema = z.object({
  service_id: z.string({ required_error: 'Service ID is required' }).uuid('Invalid Service ID'),
  scheduled_date: isoDateString,
  scheduled_time_slot: z.string().min(1, 'Scheduled time slot is required').optional().nullable(),
  address: addressSchema.refine((value) => {
    if (typeof value === 'string') return value.trim().length > 0;
    return Object.keys(value).length > 0;
  }, { message: 'Address is required' }),
  pincode: z.string({ required_error: 'Pincode is required' }).regex(/^\d{6}$/, 'Pincode must be a valid 6-digit number'),
  lat: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90').optional().nullable(),
  lng: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180').optional().nullable(),
  quantity: z.number({ invalid_type_error: 'Quantity must be a number' }).positive('Quantity must be greater than 0').optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
});

const verifyPaymentSchema = z.object({
  booking_id: z.string({ required_error: 'Booking ID is required' }).uuid('Invalid Booking ID'),
  razorpay_order_id: z.string().optional(),
  razorpay_payment_id: z.string().optional(),
  razorpay_signature: z.string().optional(),
}).refine((data) => {
  return data.razorpay_order_id || data.razorpay_payment_id || data.razorpay_signature;
}, {
  message: 'At least one Razorpay payment field is required',
  path: ['razorpay_order_id'],
});

const updateBookingStatusSchema = z.object({
  status: z.enum(BOOKING_STATUSES, {
    errorMap: () => ({ message: `Status must be one of: ${BOOKING_STATUSES.join(', ')}` })
  }),
  reason: z.string().optional()
});

const updateBookingStatusParamSchema = z.object({
  id: z.string().uuid('Invalid Booking ID')
});

const assignBookingSchema = z.object({
  technician_id: z.string().uuid('Invalid Technician ID').optional(),
  partner_id: z.string().uuid('Invalid Partner ID').optional()
}).refine(data => data.technician_id || data.partner_id, {
  message: 'Either technician_id or partner_id is required'
});

const TECHNICIAN_ACTIONS = ['START_WORK', 'ADD_PROGRESS', 'REQUEST_EXTRA_ITEMS', 'COMPLETE_WORK'];

const technicianActionSchema = z.object({
  action: z.enum(TECHNICIAN_ACTIONS, {
    errorMap: () => ({ message: `Action must be one of: ${TECHNICIAN_ACTIONS.join(', ')}` })
  }),
  description: z.string().optional(),
  photos: z.array(z.string().url('Photos must be valid URLs')).optional().default([]),
  photo_public_ids: z.array(z.string()).optional().default([]),
  extraItems: z.array(z.object({
    description: z.string().min(1, 'Item description is required'),
    qty: z.number().int().positive('Quantity must be greater than 0'),
    metadata: z.record(z.any()).optional().nullable()
  })).optional()
}).refine(data => {
  if (data.action === 'REQUEST_EXTRA_ITEMS' && (!data.extraItems || data.extraItems.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Extra items are required when action is REQUEST_EXTRA_ITEMS',
  path: ['extraItems']
}).refine(data => {
  if (data.action === 'ADD_PROGRESS' && (!data.description || data.description.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'Description is required when adding progress',
  path: ['description']
});

const customerActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('ACCEPT_WORK')
  }).strict(),
  z.object({
    action: z.literal('CANCEL'),
    reason: z.string().optional()
  }).strict(),
  z.object({
    action: z.literal('UPDATE_EXTRA_ITEM'),
    item_id: z.string({ required_error: 'Item ID is required' }).uuid('Invalid Item ID'),
    status: z.enum(['APPROVED', 'REJECTED'], {
      errorMap: () => ({ message: "Status must be either 'APPROVED' or 'REJECTED'" })
    })
  }).strict()
]);

module.exports = {
  createServiceBookingSchema,
  verifyPaymentSchema,
  updateBookingStatusSchema,
  updateBookingStatusParamSchema,
  assignBookingSchema,
  technicianActionSchema,
  customerActionSchema,
  BOOKING_STATUSES,
  TECHNICIAN_ACTIONS,
};

