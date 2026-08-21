const Customer = require('./customer.model');
const AppError = require('../../utils/AppError');

const getProfile = async (customerId) => {
  const customer = await Customer.findByPk(customerId, {
    attributes: ['id', 'display_id', 'full_name', 'email', 'mobile', 'full_address', 'pincode', 'state_name']
  });

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  return customer;
};

const updateProfile = async (customerId, updateData) => {
  const customer = await Customer.findByPk(customerId);

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Explicitly prevent email or mobile from being updated through this service
  const safeData = {
    ...(updateData.full_name && { full_name: updateData.full_name }),
    ...(updateData.full_address && { full_address: updateData.full_address }),
    ...(updateData.pincode && { pincode: updateData.pincode }),
    ...(updateData.state_name && { state_name: updateData.state_name })
  };

  await customer.update(safeData);

  return {
    message: 'Profile updated successfully',
    customer: {
      id: customer.id,
      display_id: customer.display_id,
      full_name: customer.full_name,
      email: customer.email,
      mobile: customer.mobile,
      full_address: customer.full_address,
      pincode: customer.pincode,
      state_name: customer.state_name
    }
  };
};

module.exports = {
  getProfile,
  updateProfile
};
