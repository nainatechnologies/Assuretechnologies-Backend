const { z } = require('zod');

// Inline validation rules
const mobileRegex = /^[6-9]\d{9}$/;
const mobileErrorMsg = 'Please enter a valid 10-digit mobile number';
const mobileValidation = z.string({ required_error: 'Please provide a mobile number', invalid_type_error: mobileErrorMsg }).trim().regex(mobileRegex, mobileErrorMsg);

const otpValidation = z.string({ required_error: 'Please provide the OTP', invalid_type_error: 'Please enter a valid OTP' }).trim().length(6, 'Please enter exactly 6 numbers for the OTP');

const strictPasswordValidation = z.string({ required_error: 'Password is required', invalid_type_error: 'Please enter a valid password format' })
  .min(8, 'Password must be at least 8 characters long')
  .max(72, 'Password must be at most 72 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const loginPasswordValidation = z.string({ required_error: 'Please provide your password' }).min(1, 'Please provide your password');

const emailValidation = z.string({ required_error: 'Email is required', invalid_type_error: 'Please enter a valid email format' })
  .trim().toLowerCase().email('Please provide a valid email address').max(254, 'Email is too long');

const pincodeValidation = z.string({ required_error: 'Pincode is required' }).trim().length(6, 'Pincode must be exactly 6 digits');

const nameValidation = z.string({ required_error: 'Name is required' }).trim().min(3, 'Name must be at least 3 characters long').regex(/^[A-Za-z\s]+$/, 'Name can only contain letters and spaces');

const addressValidation = z.string({ required_error: 'Address is required' }).trim().min(5, 'Address must be at least 5 characters long');


const customerRegisterSchema = z.object({
  mobile: mobileValidation,
  password: strictPasswordValidation,
  full_name: nameValidation,
  full_address: addressValidation,
  pincode: pincodeValidation,
  state_name: z.string().trim().min(2, 'State name is required'),
  email: emailValidation,
});

const customerLoginSchema = z.object({
  mobile: mobileValidation.optional(),
  email: emailValidation.optional(),
  password: loginPasswordValidation,
}).refine(data => data.mobile || data.email, {
  message: 'Either mobile or email is required',
  path: ['mobile']
});

const verifyOtpSchema = z.object({
  mobile: mobileValidation,
  otp: otpValidation,
});

const adminLoginSchema = z.object({
  email: emailValidation,
  password: loginPasswordValidation,
});

const vendorLoginSchema = z.object({
  email: emailValidation,
  password: loginPasswordValidation,
});

const partnerLoginSchema = z.object({
  mobile: mobileValidation.optional(),
  email: emailValidation.optional(),
  password: loginPasswordValidation,
}).refine(data => data.mobile || data.email, {
  message: 'Either mobile or email is required',
  path: ['mobile']
});

const forgotPasswordSchema = z.object({
  mobile: mobileValidation.optional(),
  email: emailValidation.optional(),
}).refine(data => data.mobile || data.email, {
  message: 'Either mobile or email is required',
  path: ['mobile']
});

const verifyResetOtpSchema = z.object({
  mobile: mobileValidation.optional(),
  email: emailValidation.optional(),
  otp: otpValidation,
}).refine(data => data.mobile || data.email, {
  message: 'Either mobile or email is required',
  path: ['mobile']
});

const resetPasswordSchema = z.object({
  mobile: mobileValidation.optional(),
  email: emailValidation.optional(),
  otp: otpValidation,
  newPassword: strictPasswordValidation,
}).refine(data => data.mobile || data.email, {
  message: 'Either mobile or email is required',
  path: ['mobile']
});

const vendorRegisterSchema = z.object({
  email: emailValidation,
  mobile: mobileValidation,
  password: strictPasswordValidation,
  full_name: nameValidation,
  business_name: z.string().trim().min(3, 'Business name is required'),
  address: addressValidation,
  gst_number: z.string().trim().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i, 'Please enter a valid 15-character GST number (e.g. 22AAAAA0000A1Z5)'),
  pincode: pincodeValidation.optional(),
  business_description: z.string().optional(),
  bank_account_details: z.string().optional(),
});

const technicianRegisterSchema = z.object({
  email: emailValidation,
  mobile: mobileValidation,
  password: strictPasswordValidation,
  full_name: nameValidation,
  address: addressValidation,
  service_pincodes: z.array(z.string().regex(/^\d{6}$/, 'Each service pincode must be a valid 6-digit pincode')).min(1, 'Please select at least one service pincode'),
  services_provided: z.array(z.string().uuid('Please select a valid service from the list')).min(1, 'Please select at least one service'),
});

const droneRegisterSchema = z.object({
  email: emailValidation,
  mobile: mobileValidation,
  password: strictPasswordValidation,
  full_name: nameValidation,
  address: addressValidation,
  coverage_areas: z.array(z.string().regex(/^\d{6}$/, 'Each coverage area must be a valid 6-digit pincode')).min(1, 'Please select at least one coverage pincode'),
  services_provided: z.array(z.string().uuid('Please select a valid service from the list')).min(1, 'Please select at least one service'),
});

const partnerRegisterSchema = z.object({
  email: emailValidation,
  mobile: mobileValidation,
  password: strictPasswordValidation,
  full_name: nameValidation,
  address: addressValidation,
  coverage_areas: z.array(z.string().regex(/^\d{6}$/, 'Each coverage area must be a valid 6-digit pincode')).min(1, 'Please select at least one coverage pincode'),
  services_provided: z.array(z.string().uuid('Please select a valid service from the list')).min(1, 'Please select at least one service'),
  partner_type_id: z.string({ required_error: 'Please select a partner type' }).uuid('Please select a valid partner type'),
  custom_field_values: z.record(z.any()).optional()
});

const technicianSetPasswordSchema = z.object({
  email: emailValidation,
  old_password: loginPasswordValidation,
  new_password: strictPasswordValidation,
  confirm_password: z.string({ required_error: 'Please confirm your new password' })
}).refine(data => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password']
}).refine(data => data.old_password !== data.new_password, {
  message: 'New password cannot be the same as the old password',
  path: ['new_password']
});

const partnerSetPasswordSchema = z.object({
  email: emailValidation,
  old_password: loginPasswordValidation,
  new_password: strictPasswordValidation,
  confirm_password: z.string({ required_error: 'Please confirm your new password' })
}).refine(data => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password']
}).refine(data => data.old_password !== data.new_password, {
  message: 'New password cannot be the same as the old password',
  path: ['new_password']
});

module.exports = {
  customerRegisterSchema,
  customerLoginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
  adminLoginSchema,
  vendorLoginSchema,
  vendorRegisterSchema,
  partnerLoginSchema,
  technicianRegisterSchema,
  droneRegisterSchema,
  partnerRegisterSchema,
  technicianSetPasswordSchema,
  partnerSetPasswordSchema
};
