const Vendor = require('../vendor/vendor.model');
const { comparePassword } = require('../../utils/hash');
const { generateToken } = require('../../utils/jwt');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const vendor = await Vendor.findOne({ where: { email } });
    if (!vendor) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!vendor.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await comparePassword(password, vendor.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken({ id: vendor.id, role: 'vendor' });
    const vendorData = vendor.toJSON();
    delete vendorData.password_hash;

        res.cookie('vendor_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({ success: true, message: 'Login successful', data: { user: vendorData } });
  } catch (error) {
    console.error('Vendor login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { login };
