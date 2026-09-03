const customerAuthService = require('./customerAuth.service');
const asyncHandler = require('../../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const data = await customerAuthService.register(req.body);
  res.status(201).json({ success: true, message: 'Registration successful. Please verify OTP.', data });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { mobile, otp } = req.body;
  const data = await customerAuthService.verifyOtp(mobile, otp);
  res.status(200).json({ success: true, message: 'OTP verified successfully', data });
});

const login = asyncHandler(async (req, res) => {
  const { mobile, email, password } = req.body;
  const data = await customerAuthService.login(mobile, email, password);
  
  res.cookie('customer_token', data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(200).json({ success: true, message: 'Login successful', data: { user: data.user, token: data.token } });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { mobile, email } = req.body;
  await customerAuthService.forgotPassword(mobile, email);
  res.status(200).json({ success: true, message: 'OTP sent successfully. Please check your phone/email.' });
});

const verifyResetOtp = asyncHandler(async (req, res) => {
  const { mobile, email, otp } = req.body;
  await customerAuthService.verifyResetOtp(mobile, email, otp);
  res.status(200).json({ success: true, message: 'OTP verified successfully' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { mobile, email, otp, newPassword } = req.body;
  await customerAuthService.resetPassword(mobile, email, otp, newPassword);
  res.status(200).json({ success: true, message: 'Password reset successfully' });
});

const getAddresses = asyncHandler(async (req, res) => {
  const data = await customerAuthService.getAddresses(req.user.id);
  res.status(200).json({ success: true, data });
});

const addAddress = asyncHandler(async (req, res) => {
  const data = await customerAuthService.addAddress(req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Address added successfully', data });
});

const updateAddress = asyncHandler(async (req, res) => {
  const data = await customerAuthService.updateAddress(req.user.id, req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Address updated successfully', data });
});

const deleteAddress = asyncHandler(async (req, res) => {
  await customerAuthService.deleteAddress(req.user.id, req.params.id);
  res.status(200).json({ success: true, message: 'Address deleted successfully' });
});

const setDefaultAddress = asyncHandler(async (req, res) => {
  const data = await customerAuthService.setDefaultAddress(req.user.id, req.params.id);
  res.status(200).json({ success: true, message: 'Default address set successfully', data });
});

module.exports = {
  register, verifyOtp, login, forgotPassword, verifyResetOtp, resetPassword, getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress
};
