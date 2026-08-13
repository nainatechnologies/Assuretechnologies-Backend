const { z } = require("zod");

const mobileRegex = /^[6-9]\d{9}$/;
const mobileErrorMsg = "Please enter a valid 10-digit mobile number";

const commonValidations = {
  mobile: z
    .string({
      required_error: "Please provide a mobile number",
      invalid_type_error: mobileErrorMsg,
    })
    .trim()
    .regex(mobileRegex, mobileErrorMsg),
    
  otp: z
    .string({
      required_error: "Please provide the OTP",
      invalid_type_error: "Please enter a valid OTP",
    })
    .trim()
    .length(6, "Please enter exactly 6 numbers for the OTP"),

  strictPassword: z
    .string({
      required_error: "Password is required",
      invalid_type_error: "Please enter a valid password format",
    })
    .min(8, "Password must be at least 8 characters long")
    .max(72, "Password must be at most 72 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),

  loginPassword: z
    .string({
      required_error: "Please provide your password",
    })
    .min(1, "Please provide your password"),
    
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Please enter a valid email format",
    })
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address")
    .max(254, "Email is too long (maximum is 254 characters)"),

  pincode: z
    .string({
      required_error: "Pincode is required",
    })
    .trim()
    .length(6, "Pincode must be exactly 6 digits"),
    
  name: z
    .string({
      required_error: "Name is required",
    })
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .regex(/^[A-Za-z\s]+$/, "Name can only contain letters and spaces"),
    
  address: z
    .string({
      required_error: "Address is required",
    })
    .trim()
    .min(5, "Address must be at least 5 characters long")
};

module.exports = {
  commonValidations
};
