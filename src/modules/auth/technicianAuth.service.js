const Technician = require('../technician/technician.model');
const { comparePassword, hashPassword } = require('../../utils/hash');
const { generateToken } = require('../../utils/jwt');
const AppError = require('../../utils/AppError');

const login = async (email, password) => {
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await Technician.findOne({ where: { email } });
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

  // Check if force_password_change is true
  if (user.force_password_change) {
    return { requiresPasswordChange: true };
  }

  const token = generateToken({ id: user.id, role: 'technician' });
  
  const userData = user.toJSON();
  delete userData.password_hash;

  return { user: userData, token, requiresPasswordChange: false };
};

const setPassword = async (email, old_password, new_password) => {
  const user = await Technician.findOne({ where: { email } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isMatch = await comparePassword(old_password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid old password', 401);
  }

  const newPasswordHash = await hashPassword(new_password);

  user.password_hash = newPasswordHash;
  user.force_password_change = false;
  await user.save();

  const token = generateToken({ id: user.id, role: 'technician' });
  
  const userData = user.toJSON();
  delete userData.password_hash;

  return { user: userData, token };
};

module.exports = { login, setPassword };
