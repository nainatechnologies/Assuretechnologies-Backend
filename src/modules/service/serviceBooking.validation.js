const { z } = require('zod');

const BOOKING_STATUSES = ['NEW', 'ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'COMPLETED', 'CANCELLED'];

const isoDateString = z.string({ required_error: 'Scheduled date is required' }).refine((value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}, {
  message: 'Scheduled date must be a valid date string',
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
  })
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

module.exports = {
  createServiceBookingSchema,
  verifyPaymentSchema,
  updateBookingStatusSchema,
  updateBookingStatusParamSchema,
  assignBookingSchema,
  BOOKING_STATUSES,
};
