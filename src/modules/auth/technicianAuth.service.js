const Technician = require('../technician/technician.model');
const { Op } = require('sequelize');
const crypto = require('crypto');
const OtpModel = require('./otp.model');
const { sendRegistrationOTP } = require('../../utils/smsGateway');
const { comparePassword, hashPassword } = require('../../utils/hash');
const { generateToken } = require('../../utils/jwt');
const AppError = require('../../utils/AppError');

const login = async (mobile, email, password) => {
  if ((!mobile && !email) || !password) {
    throw new AppError('Mobile/email and password are required', 400);
  }

  const whereClause = mobile ? { mobile } : { email };
  const user = await Technician.findOne({ where: whereClause });
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

const forgotPassword = async (mobile, email) => {
  if (!mobile && !email) throw new AppError('Mobile or email is required', 400);

  const whereClause = mobile ? { mobile } : { email };
  const user = await Technician.findOne({ where: whereClause });
  
  if (!user) throw new AppError('Technician not found', 404);

  const targetMobile = mobile || user.mobile;
  const generatedOtp = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  
  // Invalidate any existing unused OTPs
  await OtpModel.destroy({ where: { mobile: targetMobile } });
  
  await OtpModel.create({
    mobile: targetMobile,
    otp: generatedOtp,
    expires_at: expiresAt
  });
  
  await sendRegistrationOTP(targetMobile, generatedOtp);

  return true;
};

const resetPassword = async (mobile, email, otp, newPassword) => {
  if ((!mobile && !email) || !otp || !newPassword) throw new AppError('Missing required fields', 400);

  const whereClause = mobile ? { mobile } : { email };
  const user = await Technician.findOne({ where: whereClause });
  if (!user) throw new AppError('Technician not found', 404);

  const otpRecord = await OtpModel.findOne({
    where: {
      mobile: user.mobile,
      otp,
      expires_at: {
        [Op.gt]: new Date()
      }
    }
  });

  if (!otpRecord) throw new AppError('Invalid or expired OTP', 400);
  await otpRecord.destroy();

  const password_hash = await hashPassword(newPassword);
  user.password_hash = password_hash;
  user.force_password_change = false;
  await user.save();

  return true;
};

module.exports = { login, setPassword, forgotPassword, resetPassword };
