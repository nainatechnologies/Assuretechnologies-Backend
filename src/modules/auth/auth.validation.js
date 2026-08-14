const { z } = require("zod");
const { commonValidations } = require("../../validations/common.validation");

const customerRegisterSchema = z.object({
  mobile: commonValidations.mobile,
  password: commonValidations.strictPassword,
  full_name: commonValidations.name,
  full_address: commonValidations.address,
  pincode: commonValidations.pincode,
  state_name: z.string().trim().min(2, "State name is required"),
  email: commonValidations.email.optional().or(z.literal('')),
});

const customerLoginSchema = z.object({
  mobile: commonValidations.mobile.optional(),
  email: commonValidations.email.optional(),
  password: commonValidations.loginPassword,
}).refine(data => data.mobile || data.email, {
  message: "Either mobile or email is required",
  path: ["mobile"]
});

const verifyOtpSchema = z.object({
  mobile: commonValidations.mobile,
  otp: commonValidations.otp,
});

const adminLoginSchema = z.object({
  email: commonValidations.email,
  password: commonValidations.loginPassword,
});

const vendorLoginSchema = z.object({
  email: commonValidations.email,
  password: commonValidations.loginPassword,
});

const partnerLoginSchema = z.object({
  mobile: commonValidations.mobile.optional(),
  email: commonValidations.email.optional(),
  password: commonValidations.loginPassword,
}).refine(data => data.mobile || data.email, {
  message: "Either mobile or email is required",
  path: ["mobile"]
});

const forgotPasswordSchema = z.object({
  mobile: commonValidations.mobile.optional(),
  email: commonValidations.email.optional(),
}).refine(data => data.mobile || data.email, {
  message: "Either mobile or email is required",
  path: ["mobile"]
});

const verifyResetOtpSchema = z.object({
  mobile: commonValidations.mobile.optional(),
  email: commonValidations.email.optional(),
  otp: commonValidations.otp,
}).refine(data => data.mobile || data.email, {
  message: "Either mobile or email is required",
  path: ["mobile"]
});

const resetPasswordSchema = z.object({
  mobile: commonValidations.mobile.optional(),
  email: commonValidations.email.optional(),
  otp: commonValidations.otp,
  newPassword: commonValidations.strictPassword,
}).refine(data => data.mobile || data.email, {
  message: "Either mobile or email is required",
  path: ["mobile"]
});

const vendorRegisterSchema = z.object({
  email: commonValidations.email,
  mobile: commonValidations.mobile,
  password: commonValidations.strictPassword,
  full_name: commonValidations.name,
  business_name: z.string().trim().min(3, "Business name is required"),
  address: commonValidations.address,
  gst_number: z.string().trim().length(15, "GST number must be 15 characters"),
  pincode: z.string().optional(),
  business_description: z.string().optional(),
  bank_account_details: z.string().optional(),
});

const technicianRegisterSchema = z.object({
  email: commonValidations.email,
  mobile: commonValidations.mobile,
  password: commonValidations.strictPassword,
  full_name: commonValidations.name,
  address: commonValidations.address,
  service_pincodes: z.any().optional(),
  services_provided: z.any().optional(),
});

const droneRegisterSchema = z.object({
  email: commonValidations.email,
  mobile: commonValidations.mobile,
  password: commonValidations.strictPassword,
  full_name: commonValidations.name,
  address: commonValidations.address,
  coverage_areas: z.array(z.string()).optional(),
  services_provided: z.array(z.string()).optional(),
});

const partnerRegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  mobile: z.string().min(10, 'Mobile must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Full name is required'),
  address: z.string().min(5, 'Address is required'),
  coverage_areas: z.array(z.string()).optional(),
  services_provided: z.array(z.string()).optional(),
  partner_type_id: z.coerce.number().int().positive('Invalid partner type ID'),
  custom_field_values: z.record(z.any()).optional()
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
  partnerRegisterSchema
};
