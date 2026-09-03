const { Op } = require('sequelize');
const Vendor = require('../vendor/vendor.model');
const { comparePassword, hashPassword } = require('../../utils/hash');
const { generateToken } = require('../../utils/jwt');
const AppError = require('../../utils/AppError');

const findVendor = async (email, mobile) => {
  const cleanEmail = email ? email.trim().toLowerCase() : null;
  const cleanMobile = mobile ? mobile.trim() : null;

  if (cleanEmail && cleanMobile) {
    return await Vendor.findOne({
      where: {
        [Op.or]: [{ email: cleanEmail }, { mobile: cleanMobile }]
      }
    });
  } else if (cleanEmail) {
    return await Vendor.findOne({ where: { email: cleanEmail } });
  } else if (cleanMobile) {
    return await Vendor.findOne({ where: { mobile: cleanMobile } });
  }
  return null;
};

const login = async (email, mobile, password) => {
  if ((!email && !mobile) || !password) {
    throw new AppError('Email or mobile number and password are required', 400);
  }

  const user = await findVendor(email, mobile);
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }
  if (!user.is_active) {
    throw new AppError('Account is deactivated', 403);
  }

  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = generateToken({ id: user.id, role: 'vendor' });
  
  const userData = user.toJSON();
  delete userData.password_hash;

  return { user: userData, token };
};

const forgotPassword = async (email, mobile) => {
  if (!email && !mobile) {
    throw new AppError('Email or mobile number is required', 400);
  }

  const user = await findVendor(email, mobile);
  if (!user) {
    throw new AppError('Vendor account not found with this email / mobile', 404);
  }
  if (!user.is_active) {
    throw new AppError('Vendor account is deactivated', 403);
  }

  return true;
};

const verifyResetOtp = async (email, mobile, otp) => {
  if ((!email && !mobile) || !otp) {
    throw new AppError('Email/mobile and OTP are required', 400);
  }
  if (otp !== '123456') {
    throw new AppError('Invalid OTP', 400);
  }

  const user = await findVendor(email, mobile);
  if (!user) {
    throw new AppError('Vendor account not found', 404);
  }

  return true;
};

const resetPassword = async (email, mobile, otp, newPassword) => {
  if ((!email && !mobile) || !otp || !newPassword) {
    throw new AppError('Missing required fields', 400);
  }
  if (otp !== '123456') {
    throw new AppError('Invalid or expired OTP', 400);
  }

  const user = await findVendor(email, mobile);
  if (!user) {
    throw new AppError('Vendor account not found', 404);
  }

  user.password_hash = await hashPassword(newPassword);
  await user.save();

  return true;
};

module.exports = {
  login,
  forgotPassword,
  verifyResetOtp,
  resetPassword
};
