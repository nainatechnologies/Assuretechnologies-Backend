const express = require('express');
const router = express.Router();

const adminAuth = require('./adminAuth.controller');
const customerAuth = require('./customerAuth.controller');
const vendorAuth = require('./vendorAuth.controller');
const technicianAuth = require('./technicianAuth.controller');
const partnerAuth = require('./partnerAuth.controller');

const { validateRequest } = require('../../middleware/validate.middleware');
const authSchemas = require('./auth.validation');
const customerSchemas = require('../customer/customer.validation');
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../../utils/jwt');
const Technician = require('../technician/technician.model');
const Partner = require('../partner/partner.model');

const otpLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 1, // Limit each IP to 1 OTP request per window
  skipFailedRequests: true, // Do not count 4xx errors (e.g. Customer not found) against the rate limit
  message: { success: false, message: 'Please wait 30 seconds before requesting another OTP.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Admin Auth
router.post('/admin/login', validateRequest(authSchemas.adminLoginSchema), adminAuth.login);

// Portal-Isolated Logout Handler
const handleLogout = async (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  };

  const roleCookieMap = {
    admin: 'admin_token',
    customer: 'customer_token',
    vendor: 'vendor_token',
    technician: 'technician_token',
    partner: 'partner_token'
  };

  let token = null;
  let detectedRole = req.params?.portal || req.body?.role || req.query?.role || null;

  // 1. Extract Bearer Token from Authorization Header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. If no Bearer token, check cookies
  if (!token) {
    if (detectedRole && roleCookieMap[detectedRole]) {
      token = req.cookies?.[roleCookieMap[detectedRole]];
    } else {
      for (const [r, cookieName] of Object.entries(roleCookieMap)) {
        if (req.cookies?.[cookieName]) {
          token = req.cookies[cookieName];
          detectedRole = r;
          break;
        }
      }
      if (!token && req.cookies?.token) {
        token = req.cookies.token;
      }
    }
  }

  // 3. Decode Token to verify user identity & role
  if (token) {
    try {
      const decoded = verifyToken(token);
      if (decoded && decoded.role) {
        detectedRole = decoded.role;
      }
      if (decoded && decoded.id) {
        if (decoded.role === 'technician') {
          await Technician.update({ is_online: false }, { where: { id: decoded.id } });
        } else if (decoded.role === 'partner') {
          await Partner.update({ is_online: false }, { where: { id: decoded.id } });
        }
      }
    } catch (tokenErr) {
      // Token invalid or expired, proceed with logout
    }
  }

  // 4. Role-isolated cookie clearing
  if (detectedRole && roleCookieMap[detectedRole]) {
    res.clearCookie(roleCookieMap[detectedRole], cookieOptions);
    res.clearCookie('token', cookieOptions);
  } else {
    // Fallback: if no specific role could be detected, clear all
    Object.values(roleCookieMap).forEach(cName => res.clearCookie(cName, cookieOptions));
    res.clearCookie('token', cookieOptions);
  }

  return res.status(200).json({
    success: true,
    message: detectedRole
      ? `${detectedRole.charAt(0).toUpperCase() + detectedRole.slice(1)} logged out successfully`
      : 'Logged out successfully'
  });
};

// Global & Role-Specific Logout Routes
router.post('/logout', handleLogout);
router.post('/admin/logout', (req, res, next) => { req.params.portal = 'admin'; handleLogout(req, res, next); });
router.post('/customer/logout', (req, res, next) => { req.params.portal = 'customer'; handleLogout(req, res, next); });
router.post('/vendor/logout', (req, res, next) => { req.params.portal = 'vendor'; handleLogout(req, res, next); });
router.post('/technician/logout', (req, res, next) => { req.params.portal = 'technician'; handleLogout(req, res, next); });
router.post('/partner/logout', (req, res, next) => { req.params.portal = 'partner'; handleLogout(req, res, next); });

// Customer Auth
router.post('/customer/register', otpLimiter, validateRequest(authSchemas.customerRegisterSchema), customerAuth.register);
router.post('/customer/verify-otp', validateRequest(authSchemas.verifyOtpSchema), customerAuth.verifyOtp);
router.post('/customer/login', validateRequest(authSchemas.customerLoginSchema), customerAuth.login);
router.post('/customer/forgot-password', otpLimiter, validateRequest(authSchemas.forgotPasswordSchema), customerAuth.forgotPassword);
router.post('/customer/reset-password', validateRequest(authSchemas.resetPasswordSchema), customerAuth.resetPassword);

// Vendor Auth
router.post('/vendor/login', validateRequest(authSchemas.vendorLoginSchema), vendorAuth.login);
router.post('/vendor/forgot-password', otpLimiter, validateRequest(authSchemas.forgotPasswordSchema), vendorAuth.forgotPassword);
router.post('/vendor/reset-password', validateRequest(authSchemas.resetPasswordSchema), vendorAuth.resetPassword);

// Technician Auth
router.post('/technician/login', validateRequest(authSchemas.partnerLoginSchema), technicianAuth.login);
router.post('/technician/set-password', validateRequest(authSchemas.technicianSetPasswordSchema), technicianAuth.setPassword);
router.post('/technician/forgot-password', otpLimiter, validateRequest(authSchemas.forgotPasswordSchema), technicianAuth.forgotPassword);
router.post('/technician/reset-password', validateRequest(authSchemas.resetPasswordSchema), technicianAuth.resetPassword);

// Partner Auth
router.post('/partner/login', validateRequest(authSchemas.partnerLoginSchema), partnerAuth.login);
router.post('/partner/set-password', validateRequest(authSchemas.partnerSetPasswordSchema), partnerAuth.setPassword);
router.post('/partner/forgot-password', otpLimiter, validateRequest(authSchemas.forgotPasswordSchema), partnerAuth.forgotPassword);
router.post('/partner/reset-password', validateRequest(authSchemas.resetPasswordSchema), partnerAuth.resetPassword);


// Customer Address routes
const authMiddleware = require('../../middleware/authMiddleware');
router.get('/customer/addresses', authMiddleware(['customer']), customerAuth.getAddresses);
router.post('/customer/addresses', authMiddleware(['customer']), validateRequest(customerSchemas.addAddressSchema), customerAuth.addAddress);
router.put('/customer/addresses/:id', authMiddleware(['customer']), validateRequest(customerSchemas.updateAddressSchema), customerAuth.updateAddress);
router.delete('/customer/addresses/:id', authMiddleware(['customer']), customerAuth.deleteAddress);
router.patch('/customer/addresses/:id/default', authMiddleware(['customer']), customerAuth.setDefaultAddress);

module.exports = router;
