const partnerAuthService = require('./partnerAuth.service');
const asyncHandler = require('../../utils/asyncHandler');

const login = asyncHandler(async (req, res) => {
  const { mobile, email, password } = req.body;
  
  const data = await partnerAuthService.login(mobile, email, password);

  if (data.requiresPasswordChange) {
    return res.status(200).json({
      success: true,
      requiresPasswordChange: true,
      message: 'Password reset required on first login'
    });
  }

  res.cookie('partner_token', data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(200).json({ success: true, message: 'Login successful', data: { user: data.user, token: data.token } });
});

const setPassword = asyncHandler(async (req, res) => {
  const { email, old_password, new_password } = req.body;

  const data = await partnerAuthService.setPassword(email, old_password, new_password);

  res.cookie('partner_token', data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(200).json({ success: true, message: 'Password updated and logged in', data: { user: data.user, token: data.token } });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { mobile, email } = req.body;
  await partnerAuthService.forgotPassword(mobile, email);
  res.status(200).json({ success: true, message: 'OTP sent successfully. Please check your phone/email.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { mobile, email, otp, newPassword } = req.body;
  await partnerAuthService.resetPassword(mobile, email, otp, newPassword);
  res.status(200).json({ success: true, message: 'Password reset successfully' });
});

module.exports = { login, setPassword, forgotPassword, resetPassword };
