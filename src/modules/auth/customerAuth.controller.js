const Customer = require('../customer/customer.model');
const { hashPassword, comparePassword } = require('../../utils/hash');
const { generateToken } = require('../../utils/jwt');

const register = async (req, res) => {
  try {
    const { email, mobile, password, full_name, full_address, pincode, state_name } = req.body;
    
    if (!mobile || !password || !full_name || !full_address || !pincode || !state_name) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const existingMobile = await Customer.findOne({ where: { mobile } });
    if (existingMobile) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: [{ field: 'mobile', message: 'This mobile number is already registered' }]
      });
    }

    if (email) {
      const existingEmail = await Customer.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation failed',
          errors: [{ field: 'email', message: 'This email address is already registered' }]
        });
      }
    }

    const password_hash = await hashPassword(password);
    
    const customer = await Customer.create({
      email: email || null,
      mobile,
      password_hash,
      full_name,
      full_address,
      pincode,
      state_name,
      is_mobile_verified: false // Needs OTP
    });

    res.status(201).json({ success: true, message: 'Registration successful. Please verify OTP.', data: { customerId: customer.id } });
  } catch (error) {
    console.error('Customer register error:', error);
    res.status(500).json({ success: false, message: 'Internal server error: ' + (error.message || 'Unknown error'), stack: error.stack });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    
    // MOCK OTP verification for development
    if (otp !== '123456') {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const customer = await Customer.findOne({ where: { mobile } });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.is_mobile_verified = true;
    await customer.save();

    const token = generateToken({ id: customer.id, role: 'customer' });
    const customerData = customer.toJSON();
    delete customerData.password_hash;

    res.status(200).json({ success: true, message: 'OTP verified successfully', data: { user: customerData, token } });
  } catch (error) {
    console.error('Customer OTP verify error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { mobile, email, password } = req.body;
    if ((!mobile && !email) || !password) {
      return res.status(400).json({ success: false, message: 'Mobile/email and password are required' });
    }

    const whereClause = mobile ? { mobile } : { email };
    const customer = await Customer.findOne({ where: whereClause });
    
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    if (!customer.is_mobile_verified) {
      return res.status(403).json({ success: false, message: 'Please verify your mobile number first' });
    }
    if (!customer.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await comparePassword(password, customer.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken({ id: customer.id, role: 'customer' });
    const customerData = customer.toJSON();
    delete customerData.password_hash;

        res.cookie('customer_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({ success: true, message: 'Login successful', data: { user: customerData } });
  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { mobile, email } = req.body;
    if (!mobile && !email) {
      return res.status(400).json({ success: false, message: 'Mobile or email is required' });
    }

    const whereClause = mobile ? { mobile } : { email };
    const customer = await Customer.findOne({ where: whereClause });
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // MOCK: In production, send SMS/Email with OTP here
    res.status(200).json({ success: true, message: 'OTP sent successfully. Please check your phone/email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const verifyResetOtp = async (req, res) => {
  try {
    const { mobile, email, otp } = req.body;
    if ((!mobile && !email) || !otp) {
      return res.status(400).json({ success: false, message: 'Mobile/email and OTP are required' });
    }

    // MOCK OTP verification
    if (otp !== '123456') {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const whereClause = mobile ? { mobile } : { email };
    const customer = await Customer.findOne({ where: whereClause });
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { mobile, email, otp, newPassword } = req.body;
    
    if ((!mobile && !email) || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // MOCK OTP verification again for security
    if (otp !== '123456') {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const whereClause = mobile ? { mobile } : { email };
    const customer = await Customer.findOne({ where: whereClause });
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const password_hash = await hashPassword(newPassword);
    customer.password_hash = password_hash;
    await customer.save();

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { register, verifyOtp, login, forgotPassword, verifyResetOtp, resetPassword };
