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
  message: { success: false, message: 'Please wait 30 seconds before requesting another OTP.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Admin Auth
router.post('/admin/login', validateRequest(authSchemas.adminLoginSchema), adminAuth.login);

// Global Logout
router.post('/logout', async (req, res) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else {
      token = req.cookies?.technician_token || req.cookies?.partner_token || req.cookies?.token;
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        if (decoded && decoded.id) {
          if (decoded.role === 'technician') {
            await Technician.update({ is_online: false }, { where: { id: decoded.id } });
          } else if (decoded.role === 'partner') {
            await Partner.update({ is_online: false }, { where: { id: decoded.id } });
          }
        }
      } catch (tokenErr) {
        // Token invalid or expired, ignore and proceed
      }
    }
  } catch (err) {
    console.error('Auto-offline on logout error:', err);
  }

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
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
