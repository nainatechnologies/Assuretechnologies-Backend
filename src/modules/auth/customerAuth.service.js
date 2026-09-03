const { sequelize } = require('../../config/database');
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

  if (full_address) {
    await CustomerAddress.create({
      customer_id: customer.id,
      full_name: customer.full_name,
      mobile_number: customer.mobile,
      pincode: customer.pincode,
      address_line1: customer.full_address,
      address_line2: '',
      landmark: '',
      city: '',
      state: customer.state_name,
      is_default: true
    });
  }

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
  if (!customer) return [];

  // Auto-backfill registration address if not already in CustomerAddress
  if (customer.full_address) {
    const existingRegistrationAddress = await CustomerAddress.findOne({
      where: {
        customer_id,
        address_line1: customer.full_address,
        mobile_number: customer.mobile
      }
    });

    if (!existingRegistrationAddress) {
      const addressCount = await CustomerAddress.count({ where: { customer_id } });
      await CustomerAddress.create({
        customer_id: customer.id,
        full_name: customer.full_name,
        mobile_number: customer.mobile,
        pincode: customer.pincode,
        address_line1: customer.full_address,
        address_line2: '',
        landmark: '',
        city: '',
        state: customer.state_name,
        is_default: addressCount === 0
      });
    }
  }

  const addresses = await CustomerAddress.findAll({ 
    where: { customer_id },
    order: [['is_default', 'DESC'], ['createdAt', 'DESC']]
  });

  // Ensure at least one address is default if addresses exist
  if (addresses.length > 0 && !addresses.some(a => a.is_default)) {
    addresses[0].is_default = true;
    await addresses[0].save();
  }

  return addresses.map(a => a.toJSON());
};

const addAddress = async (customer_id, data) => {
  const { full_name, mobile_number, pincode, address_line1, address_line2, landmark, city, state, is_default } = data;
  
  const t = await sequelize.transaction();
  try {
    const existingCount = await CustomerAddress.count({ where: { customer_id }, transaction: t });
    const shouldBeDefault = Boolean(is_default || existingCount === 0);

    if (shouldBeDefault) {
      await CustomerAddress.update({ is_default: false }, { where: { customer_id }, transaction: t });
    }

    const created = await CustomerAddress.create({
      customer_id,
      full_name: full_name.trim(),
      mobile_number: mobile_number.trim(),
      pincode: pincode.trim(),
      address_line1: address_line1.trim(),
      address_line2: address_line2 ? address_line2.trim() : '',
      landmark: landmark ? landmark.trim() : '',
      city: city.trim(),
      state: state.trim(),
      is_default: shouldBeDefault
    }, { transaction: t });

    await t.commit();
    return created;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const updateAddress = async (customer_id, address_id, data) => {
  const t = await sequelize.transaction();
  try {
    const address = await CustomerAddress.findOne({ 
      where: { id: address_id, customer_id },
      transaction: t 
    });

    if (!address) {
      throw new AppError('Address not found or unauthorized', 404);
    }

    // Pick only sanitized allowed fields to prevent mass-assignment
    const allowedFields = ['full_name', 'mobile_number', 'pincode', 'address_line1', 'address_line2', 'landmark', 'city', 'state', 'is_default'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        address[field] = typeof data[field] === 'string' ? data[field].trim() : data[field];
      }
    }

    if (data.is_default) {
      await CustomerAddress.update({ is_default: false }, { where: { customer_id }, transaction: t });
      address.is_default = true;
    }

    await address.save({ transaction: t });
    await t.commit();
    return address;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const deleteAddress = async (customer_id, address_id) => {
  const t = await sequelize.transaction();
  try {
    const address = await CustomerAddress.findOne({ 
      where: { id: address_id, customer_id },
      transaction: t 
    });

    if (!address) {
      throw new AppError('Address not found or unauthorized', 404);
    }

    const wasDefault = address.is_default;
    await address.destroy({ transaction: t });

    // If deleted address was default, promote next available address as default
    if (wasDefault) {
      const nextAddress = await CustomerAddress.findOne({ 
        where: { customer_id },
        order: [['createdAt', 'DESC']],
        transaction: t
      });
      if (nextAddress) {
        nextAddress.is_default = true;
        await nextAddress.save({ transaction: t });
      }
    }

    await t.commit();
    return true;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const setDefaultAddress = async (customer_id, address_id) => {
  const t = await sequelize.transaction();
  try {
    const address = await CustomerAddress.findOne({ 
      where: { id: address_id, customer_id },
      transaction: t 
    });

    if (!address) {
      throw new AppError('Address not found or unauthorized', 404);
    }

    await CustomerAddress.update({ is_default: false }, { where: { customer_id }, transaction: t });
    address.is_default = true;
    await address.save({ transaction: t });

    await t.commit();
    return address;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

module.exports = {
  register, verifyOtp, login, forgotPassword, verifyResetOtp, resetPassword, getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress
};
