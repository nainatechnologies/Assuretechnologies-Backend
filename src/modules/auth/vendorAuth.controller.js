const vendorAuthService = require('./vendorAuth.service');
const asyncHandler = require('../../utils/asyncHandler');

const login = asyncHandler(async (req, res) => {
  const { mobile, email, password } = req.body;
  
  const data = await vendorAuthService.login(mobile, email, password);

  res.cookie('vendor_token', data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(200).json({ success: true, message: 'Login successful', data: { user: data.user } });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { mobile, email } = req.body;
  await vendorAuthService.forgotPassword(mobile, email);
  res.status(200).json({ success: true, message: 'OTP sent successfully. Please check your phone/email.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { mobile, email, otp, newPassword } = req.body;
  await vendorAuthService.resetPassword(mobile, email, otp, newPassword);
  res.status(200).json({ success: true, message: 'Password reset successfully' });
});

module.exports = { login, forgotPassword, resetPassword };
