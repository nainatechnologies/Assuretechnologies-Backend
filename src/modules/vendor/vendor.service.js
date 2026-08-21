const Vendor = require('./vendor.model');
const AppError = require('../../utils/AppError');

const getProfile = async (vendorId) => {
  const vendor = await Vendor.findByPk(vendorId, {
    attributes: [
      'id', 'display_id', 'full_name', 'business_name', 'email', 'mobile',
      'address', 'gst_number', 'pincode', 'business_description', 'status'
    ]
  });

  if (!vendor) {
    throw new AppError('Vendor not found', 404);
  }

  return vendor;
};

const updateProfile = async (vendorId, updateData) => {
  const vendor = await Vendor.findByPk(vendorId);

  if (!vendor) {
    throw new AppError('Vendor not found', 404);
  }

  // Explicitly prevent email, mobile, gst_number, or business_name from being updated
  const safeData = {
    ...(updateData.full_name && { full_name: updateData.full_name }),
    ...(updateData.address && { address: updateData.address }),
    ...(updateData.pincode && { pincode: updateData.pincode }),
    ...(updateData.business_description && { business_description: updateData.business_description })
  };

  await vendor.update(safeData);

  return {
    message: 'Profile updated successfully',
    vendor: {
      id: vendor.id,
      display_id: vendor.display_id,
      full_name: vendor.full_name,
      business_name: vendor.business_name,
      email: vendor.email,
      mobile: vendor.mobile,
      address: vendor.address,
      gst_number: vendor.gst_number,
      pincode: vendor.pincode,
      business_description: vendor.business_description,
      status: vendor.status
    }
  };
};

module.exports = {
  getProfile,
  updateProfile
};
