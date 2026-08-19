const vendorAuthService = require('./vendorAuth.service');
const asyncHandler = require('../../utils/asyncHandler');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const data = await vendorAuthService.login(email, password);

  res.cookie('vendor_token', data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(200).json({ success: true, message: 'Login successful', data: { user: data.user } });
});

module.exports = { login };
