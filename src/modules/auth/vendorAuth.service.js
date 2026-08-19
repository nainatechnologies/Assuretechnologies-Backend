const Vendor = require('../vendor/vendor.model');
const { comparePassword } = require('../../utils/hash');
const { generateToken } = require('../../utils/jwt');
const AppError = require('../../utils/AppError');

const login = async (email, password) => {
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await Vendor.findOne({ where: { email } });
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

module.exports = { login };
