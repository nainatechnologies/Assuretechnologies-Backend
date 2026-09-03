const vendorAuthService = require('./vendorAuth.service');
const asyncHandler = require('../../utils/asyncHandler');

const login = asyncHandler(async (req, res) => {
  const { email, mobile, password } = req.body;
  
  const data = await vendorAuthService.login(email, mobile, password);

  res.cookie('vendor_token', data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(200).json({ success: true, message: 'Login successful', data: { user: data.user, token: data.token } });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { mobile, email } = req.body;
  await vendorAuthService.forgotPassword(email, mobile);
  res.status(200).json({ success: true, message: 'OTP sent successfully. Please check your email.' });
});

const verifyResetOtp = asyncHandler(async (req, res) => {
  const { mobile, email, otp } = req.body;
  await vendorAuthService.verifyResetOtp(email, mobile, otp);
  res.status(200).json({ success: true, message: 'OTP verified successfully' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { mobile, email, otp, newPassword } = req.body;
  await vendorAuthService.resetPassword(email, mobile, otp, newPassword);
  res.status(200).json({ success: true, message: 'Password reset successfully. Please login with your new password.' });
});

module.exports = {
  login,
  forgotPassword,
  verifyResetOtp,
  resetPassword
};
