const Customer = require('../customer/customer.model');
const CustomerAddress = require('../customer/customerAddress.model');
const { hashPassword, comparePassword } = require('../../utils/hash');
const { generateToken } = require('../../utils/jwt');
const AppError = require('../../utils/AppError');

const register = async (data) => {
  const { email, mobile, password, full_name, full_address, pincode, state_name } = data;
  
  if (!mobile || !password || !full_name || !full_address || !pincode || !state_name) {
    throw new AppError('Missing required fields', 400);
  }

  const existingMobile = await Customer.findOne({ where: { mobile } });
  if (existingMobile) {
    throw new AppError('This mobile number is already registered', 400);
  }

  if (email) {
    const existingEmail = await Customer.findOne({ where: { email } });
    if (existingEmail) {
      throw new AppError('This email address is already registered', 400);
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

  return { customerId: customer.id };
};

const verifyOtp = async (mobile, otp) => {
  if (otp !== '123456') {
    throw new AppError('Invalid OTP', 400);
  }

  const customer = await Customer.findOne({ where: { mobile } });
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  customer.is_mobile_verified = true;
  await customer.save();

  const token = generateToken({ id: customer.id, role: 'customer' });
  const customerData = customer.toJSON();
  delete customerData.password_hash;

  return { user: customerData, token };
};

const login = async (mobile, email, password) => {
  if ((!mobile && !email) || !password) {
    throw new AppError('Mobile/email and password are required', 400);
  }

  const whereClause = mobile ? { mobile } : { email };
  const customer = await Customer.findOne({ where: whereClause });
  
  if (!customer) throw new AppError('Invalid credentials', 401);
  if (!customer.is_mobile_verified) throw new AppError('Please verify your mobile number first', 403);
  if (!customer.is_active) throw new AppError('Account is deactivated', 403);

  const isMatch = await comparePassword(password, customer.password_hash);
  if (!isMatch) throw new AppError('Invalid credentials', 401);

  const token = generateToken({ id: customer.id, role: 'customer' });
  const customerData = customer.toJSON();
  delete customerData.password_hash;

  return { user: customerData, token };
};

const forgotPassword = async (mobile, email) => {
  if (!mobile && !email) throw new AppError('Mobile or email is required', 400);

  const whereClause = mobile ? { mobile } : { email };
  const customer = await Customer.findOne({ where: whereClause });
  
  if (!customer) throw new AppError('Customer not found', 404);

  return true;
};

const verifyResetOtp = async (mobile, email, otp) => {
  if ((!mobile && !email) || !otp) throw new AppError('Mobile/email and OTP are required', 400);
  if (otp !== '123456') throw new AppError('Invalid OTP', 400);

  const whereClause = mobile ? { mobile } : { email };
  const customer = await Customer.findOne({ where: whereClause });
  if (!customer) throw new AppError('Customer not found', 404);

  return true;
};

const resetPassword = async (mobile, email, otp, newPassword) => {
  if ((!mobile && !email) || !otp || !newPassword) throw new AppError('Missing required fields', 400);
  if (otp !== '123456') throw new AppError('Invalid or expired OTP', 400);

  const whereClause = mobile ? { mobile } : { email };
  const customer = await Customer.findOne({ where: whereClause });
  if (!customer) throw new AppError('Customer not found', 404);

  const password_hash = await hashPassword(newPassword);
  customer.password_hash = password_hash;
  await customer.save();

  return true;
};

const getAddresses = async (customer_id) => {
  const customer = await Customer.findByPk(customer_id);
  const addresses = await CustomerAddress.findAll({ where: { customer_id } });
  
  let allAddresses = [];
  if (customer && customer.full_address) {
    allAddresses.push({
      id: 'default',
      full_name: customer.full_name,
      mobile_number: customer.mobile,
      pincode: customer.pincode,
      address_line1: customer.full_address,
      address_line2: '',
      landmark: '',
      city: '',
      state: customer.state_name,
      isDefault: true
    });
  }
  
  return allAddresses.concat(addresses);
};

const addAddress = async (customer_id, data) => {
  const { full_name, mobile_number, pincode, address_line1, address_line2, landmark, city, state } = data;
  return await CustomerAddress.create({
    customer_id,
    full_name, mobile_number, pincode, address_line1, address_line2, landmark, city, state
  });
};

module.exports = {
  register, verifyOtp, login, forgotPassword, verifyResetOtp, resetPassword, getAddresses, addAddress
};
