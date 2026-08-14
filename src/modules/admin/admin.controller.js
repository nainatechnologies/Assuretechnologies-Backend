const Vendor = require('../vendor/vendor.model');
const Technician = require('../technician/technician.model');
const Partner = require('../partner/partner.model');
const PartnerType = require('../partner/partnerType.model');
const PricingType = require('../partner/pricingType.model');
const { hashPassword } = require('../../utils/hash');
const { Op, Sequelize } = require('sequelize');

const getVendors = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { business_name: { [Op.like]: `%${search}%` } },
        { full_name: { [Op.like]: `%${search}%` } },
        { mobile: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { pincode: { [Op.like]: `%${search}%` } },
        { gst_number: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Vendor.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password_hash'] },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    
    res.status(200).json({ 
      success: true, 
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getTechnicians = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { mobile: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        Sequelize.where(Sequelize.cast(Sequelize.col('service_pincodes'), 'CHAR'), { [Op.like]: `%${search}%` }),
        Sequelize.where(Sequelize.cast(Sequelize.col('services_provided'), 'CHAR'), { [Op.like]: `%${search}%` })
      ];
    }

    const { count, rows } = await Technician.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password_hash'] },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    
    res.status(200).json({ 
      success: true, 
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching technicians:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getPartners = async (req, res) => {
  try {
    const partners = await Partner.findAll({
      attributes: { exclude: ['password_hash'] },
      include: [{ model: PartnerType, as: 'partnerType' }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, data: partners });
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createVendor = async (req, res) => {
  try {
    const { email, mobile, password, full_name, business_name, address, gst_number, pincode, business_description, bank_account_details } = req.body;
    
    const existingVendor = await Vendor.findOne({ where: { email } });
    if (existingVendor) return res.status(400).json({ success: false, message: 'Email already registered' });
    
    const existingMobile = await Vendor.findOne({ where: { mobile } });
    if (existingMobile) return res.status(400).json({ success: false, message: 'Mobile already registered' });

    const password_hash = await hashPassword(password);
    
    const aadhar_proof = req.files && req.files.aadhar_proof ? '/uploads/vendors/' + req.files.aadhar_proof[0].filename : null;
    const pan_proof = req.files && req.files.pan_proof ? '/uploads/vendors/' + req.files.pan_proof[0].filename : null;
    const shop_photo = req.files && req.files.shop_photo ? '/uploads/vendors/' + req.files.shop_photo[0].filename : null;

    const vendor = await Vendor.create({
      email, mobile, password_hash, full_name, business_name, address, gst_number,
      pincode, business_description, bank_account_details,
      aadhar_proof, pan_proof, shop_photo,
      is_active: true
    });

    res.status(201).json({ success: true, message: 'Vendor created successfully', data: { vendorId: vendor.id } });
  } catch (error) {
    console.error('Admin create vendor error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createTechnician = async (req, res) => {
  try {
    const { email, mobile, password, full_name, address, service_pincodes, services_provided } = req.body;
    
    const existingTechnician = await Technician.findOne({ where: { email } });
    if (existingTechnician) return res.status(400).json({ success: false, message: 'Email already registered' });
    
    const existingMobile = await Technician.findOne({ where: { mobile } });
    if (existingMobile) return res.status(400).json({ success: false, message: 'Mobile already registered' });

    const password_hash = await hashPassword(password);
    
    let parsed_service_pincodes = service_pincodes || [];
    if (typeof parsed_service_pincodes === 'string') {
      try { parsed_service_pincodes = JSON.parse(parsed_service_pincodes); } catch (e) { parsed_service_pincodes = parsed_service_pincodes.split(','); }
    }
    let parsed_services_provided = services_provided || [];
    if (typeof parsed_services_provided === 'string') {
      try { parsed_services_provided = JSON.parse(parsed_services_provided); } catch (e) { parsed_services_provided = parsed_services_provided.split(','); }
    }

    const id_proof = req.files && req.files.id_proof ? '/uploads/technicians/' + req.files.id_proof[0].filename : null;
    const noc_document = req.files && req.files.noc_document ? '/uploads/technicians/' + req.files.noc_document[0].filename : null;

    const technician = await Technician.create({
      email, mobile, password_hash, full_name, address,
      service_pincodes: parsed_service_pincodes,
      services_provided: parsed_services_provided,
      id_proof, noc_document,
      is_active: true
    });

    res.status(201).json({ success: true, message: 'Technician created successfully', data: { technicianId: technician.id } });
  } catch (error) {
    console.error('Admin create technician error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createPartner = async (req, res) => {
  try {
    const { email, mobile, password, full_name, address, coverage_areas, services_provided, partner_type_id, custom_field_values } = req.body;
    
    const existingPartner = await Partner.findOne({ where: { email } });
    if (existingPartner) return res.status(400).json({ success: false, message: 'Email already registered' });
    
    const existingMobile = await Partner.findOne({ where: { mobile } });
    if (existingMobile) return res.status(400).json({ success: false, message: 'Mobile already registered' });

    const password_hash = await hashPassword(password);
    
    const partner = await Partner.create({
      email, mobile, password_hash, full_name, address,
      coverage_areas: coverage_areas || [],
      services_provided: services_provided || [],
      partner_type_id,
      custom_field_values: custom_field_values || {},
      is_active: true
    });

    res.status(201).json({ success: true, message: 'Partner created successfully', data: { partnerId: partner.id } });
  } catch (error) {
    console.error('Admin create partner error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// --- Partner Types ---
const getPartnerTypes = async (req, res) => {
  try {
    const types = await PartnerType.findAll({ order: [['createdAt', 'DESC']] });
    res.status(200).json({ success: true, data: types });
  } catch (error) {
    console.error('Error fetching partner types:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createPartnerType = async (req, res) => {
  try {
    const { name, custom_fields } = req.body;
    const type = await PartnerType.create({ name, custom_fields: custom_fields || [] });
    res.status(201).json({ success: true, data: type });
  } catch (error) {
    console.error('Error creating partner type:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// --- Pricing Types ---
const getPricingTypes = async (req, res) => {
  try {
    const types = await PricingType.findAll({ order: [['createdAt', 'DESC']] });
    res.status(200).json({ success: true, data: types });
  } catch (error) {
    console.error('Error fetching pricing types:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createPricingType = async (req, res) => {
  try {
    const { name, label } = req.body;
    const type = await PricingType.create({ name, label });
    res.status(201).json({ success: true, data: type });
  } catch (error) {
    console.error('Error creating pricing type:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getVendors,
  getTechnicians,
  getPartners,
  createVendor,
  createTechnician,
  createPartner,
  getPartnerTypes,
  createPartnerType,
  getPricingTypes,
  createPricingType
};
