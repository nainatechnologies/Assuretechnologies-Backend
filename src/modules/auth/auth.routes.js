const express = require('express');
const router = express.Router();

const adminAuth = require('./adminAuth.controller');
const customerAuth = require('./customerAuth.controller');
const vendorAuth = require('./vendorAuth.controller');
const technicianAuth = require('./technicianAuth.controller');
const partnerAuth = require('./partnerAuth.controller');

const { validateRequest } = require('../../middleware/validate.middleware');
const authSchemas = require('./auth.validation');

// Admin Auth
router.post('/admin/login', validateRequest(authSchemas.adminLoginSchema), adminAuth.login);

// Global Logout
router.post('/logout', (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };
  res.clearCookie('token', cookieOptions);
  res.clearCookie('admin_token', cookieOptions);
  res.clearCookie('customer_token', cookieOptions);
  res.clearCookie('vendor_token', cookieOptions);
  res.clearCookie('technician_token', cookieOptions);
  res.clearCookie('partner_token', cookieOptions);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// Customer Auth
router.post('/customer/register', validateRequest(authSchemas.customerRegisterSchema), customerAuth.register);
router.post('/customer/verify-otp', validateRequest(authSchemas.verifyOtpSchema), customerAuth.verifyOtp);
router.post('/customer/login', validateRequest(authSchemas.customerLoginSchema), customerAuth.login);
router.post('/customer/forgot-password', validateRequest(authSchemas.forgotPasswordSchema), customerAuth.forgotPassword);
router.post('/customer/verify-reset-otp', validateRequest(authSchemas.verifyResetOtpSchema), customerAuth.verifyResetOtp);
router.post('/customer/reset-password', validateRequest(authSchemas.resetPasswordSchema), customerAuth.resetPassword);

// Vendor Auth
router.post('/vendor/login', validateRequest(authSchemas.vendorLoginSchema), vendorAuth.login);

// Technician Auth
router.post('/technician/login', validateRequest(authSchemas.partnerLoginSchema), technicianAuth.login);

// Partner Auth
router.post('/partner/login', validateRequest(authSchemas.partnerLoginSchema), partnerAuth.login);


// Customer Address routes
const authMiddleware = require('../../middleware/authMiddleware');
router.get('/customer/addresses', authMiddleware(['customer']), customerAuth.getAddresses);
router.post('/customer/addresses', authMiddleware(['customer']), customerAuth.addAddress);

module.exports = router;

