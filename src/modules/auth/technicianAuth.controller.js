const Technician = require('../technician/technician.model');
const { comparePassword } = require('../../utils/hash');
const { generateToken } = require('../../utils/jwt');

const login = async (req, res) => {
  try {
    const { mobile, email, password } = req.body;
    if ((!mobile && !email) || !password) {
      return res.status(400).json({ success: false, message: 'Mobile/Email and password are required' });
    }

    const whereClause = email ? { email } : { mobile };
    const technician = await Technician.findOne({ where: whereClause });
    if (!technician) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!technician.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await comparePassword(password, technician.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken({ id: technician.id, role: 'technician' });
    const data = technician.toJSON();
    delete data.password_hash;

        res.cookie('technician_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({ success: true, message: 'Login successful', data: { user: data } });
  } catch (error) {
    console.error('Technician login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { login };
