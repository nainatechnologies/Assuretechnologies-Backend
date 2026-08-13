const Vendor = require('../vendor/vendor.model');
const Technician = require('../technician/technician.model');
const Partner = require('../partner/partner.model');
const PartnerType = require('../partner/partnerType.model');
const PricingType = require('../partner/pricingType.model');
const { hashPassword } = require('../../utils/hash');

const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.findAll({
      attributes: { exclude: ['password_hash'] },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, data: vendors });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getTechnicians = async (req, res) => {
  try {
    const technicians = await Technician.findAll({
      attributes: { exclude: ['password_hash'] },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, data: technicians });
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
    
    const vendor = await Vendor.create({
      email, mobile, password_hash, full_name, business_name, address, gst_number,
      pincode, business_description, bank_account_details,
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
    
    const technician = await Technician.create({
      email, mobile, password_hash, full_name, address,
      service_pincodes: service_pincodes || [],
      services_provided: services_provided || [],
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
