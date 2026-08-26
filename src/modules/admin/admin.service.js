const Vendor = require('../vendor/vendor.model');
const Technician = require('../technician/technician.model');
const Category = require('../category/category.model');
const { hashPassword } = require('../../utils/hash');
const { Op, Sequelize } = require('sequelize');
const AppError = require('../../utils/AppError');

const getVendors = async (page = 1, limit = 10, search = '') => {
  const offset = (page - 1) * limit;
  const whereClause = {};
  if (search) {
    whereClause[Op.or] = [
      { business_name: { [Op.like]: '%' + search + '%' } },
      { full_name: { [Op.like]: '%' + search + '%' } },
      { mobile: { [Op.like]: '%' + search + '%' } },
      { email: { [Op.like]: '%' + search + '%' } },
      { pincode: { [Op.like]: '%' + search + '%' } },
      { gst_number: { [Op.like]: '%' + search + '%' } }
    ];
  }

  const { count, rows } = await Vendor.findAndCountAll({
    where: whereClause,
    attributes: { exclude: ['password_hash'] },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return {
    data: rows,
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      limit
    }
  };
};

const getTechnicians = async (page = 1, limit = 10, search = '') => {
  const offset = (page - 1) * limit;
  const whereClause = {};
  if (search) {
    whereClause[Op.or] = [
      { full_name: { [Op.like]: '%' + search + '%' } },
      { mobile: { [Op.like]: '%' + search + '%' } },
      { email: { [Op.like]: '%' + search + '%' } },
      Sequelize.where(Sequelize.cast(Sequelize.col('service_pincodes'), 'CHAR'), { [Op.like]: '%' + search + '%' }),
      Sequelize.where(Sequelize.cast(Sequelize.col('services_provided'), 'CHAR'), { [Op.like]: '%' + search + '%' })
    ];
  }

  const { count, rows } = await Technician.findAndCountAll({
    where: whereClause,
    attributes: { exclude: ['password_hash'] },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return {
    data: rows,
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      limit
    }
  };
};

const createVendor = async (data, files) => {
  const { email, mobile, password, full_name, business_name, address, gst_number, pincode, business_description, bank_account_details } = data;

  const existingVendor = await Vendor.findOne({ where: { email } });
  if (existingVendor) throw new AppError('Email already registered', 400);

  const existingMobile = await Vendor.findOne({ where: { mobile } });
  if (existingMobile) throw new AppError('Mobile already registered', 400);

  const password_hash = await hashPassword(password);

  const aadhar_proof = files && files.aadhar_proof ? '/uploads/vendors/' + files.aadhar_proof[0].filename : null;
  const pan_proof = files && files.pan_proof ? '/uploads/vendors/' + files.pan_proof[0].filename : null;
  const shop_photo = files && files.shop_photo ? '/uploads/vendors/' + files.shop_photo[0].filename : null;

  const vendor = await Vendor.create({
    email, mobile, password_hash, full_name, business_name, address, gst_number,
    pincode, business_description, bank_account_details,
    aadhar_proof, pan_proof, shop_photo,
    is_active: true
  });

  return vendor;
};

const createTechnician = async (data, files) => {
  const { email, mobile, password, full_name, address, service_pincodes, services_provided } = data;

  const existingTechnician = await Technician.findOne({ where: { email } });
  if (existingTechnician) throw new AppError('Email already registered', 400);

  const existingMobile = await Technician.findOne({ where: { mobile } });
  if (existingMobile) throw new AppError('Mobile already registered', 400);

  const password_hash = await hashPassword(password);

  let parsed_service_pincodes = service_pincodes || [];
  if (typeof parsed_service_pincodes === 'string') {
    try { parsed_service_pincodes = JSON.parse(parsed_service_pincodes); } catch (e) { parsed_service_pincodes = parsed_service_pincodes.split(','); }
  }
  let parsed_services_provided = services_provided || [];
  if (typeof parsed_services_provided === 'string') {
    try { parsed_services_provided = JSON.parse(parsed_services_provided); } catch (e) { parsed_services_provided = parsed_services_provided.split(','); }
  }

  const id_proof = files && files.id_proof ? '/uploads/technicians/' + files.id_proof[0].filename : null;
  const noc_document = files && files.noc_document ? '/uploads/technicians/' + files.noc_document[0].filename : null;

  const technician = await Technician.create({
    email, mobile, password_hash, full_name, address,
    service_pincodes: parsed_service_pincodes,
    services_provided: parsed_services_provided,
    id_proof, noc_document,
    is_active: true
  });

  return technician;
};

const getCategories = async () => {
  return await Category.findAll({ order: [['name', 'ASC']] });
};

const createCategory = async (data) => {
  const { name, is_active } = data;
  return await Category.create({ name, is_active });
};

module.exports = {
  getVendors,
  getTechnicians,
  createVendor,
  createTechnician,
  getCategories,
  createCategory
};
