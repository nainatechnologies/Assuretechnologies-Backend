const partnerService = require('./partner.service');
const asyncHandler = require('../../utils/asyncHandler');

const getPartners = asyncHandler(async (req, res) => {
  const partners = await partnerService.getPartners();
  res.status(200).json({ success: true, data: partners });
});

const createPartner = asyncHandler(async (req, res) => {
  const partner = await partnerService.createPartner(req.body);
  res.status(201).json({ success: true, data: partner });
});

const getPartnerTypes = asyncHandler(async (req, res) => {
  const types = await partnerService.getPartnerTypes();
  res.status(200).json({ success: true, data: types });
});

const createPartnerType = asyncHandler(async (req, res) => {
  const type = await partnerService.createPartnerType(req.body);
  res.status(201).json({ success: true, data: type });
});

const updatePartnerType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const type = await partnerService.updatePartnerType(id, req.body);
  res.status(200).json({ success: true, message: 'Partner type updated successfully', data: type });
});

const togglePartnerTypeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  const result = await partnerService.togglePartnerTypeStatus(id, is_active);
  res.status(200).json({ success: true, message: 'Status updated successfully', data: result });
});

const getPricingTypes = asyncHandler(async (req, res) => {
  const types = await partnerService.getPricingTypes();
  res.status(200).json({ success: true, data: types });
});

const createPricingType = asyncHandler(async (req, res) => {
  const type = await partnerService.createPricingType(req.body);
  res.status(201).json({ success: true, data: type });
});

const updatePricingType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const type = await partnerService.updatePricingType(id, req.body);
  res.status(200).json({ success: true, message: 'Pricing type updated successfully', data: type });
});

const togglePricingTypeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  const result = await partnerService.togglePricingTypeStatus(id, is_active);
  res.status(200).json({ success: true, message: 'Status updated successfully', data: result });
});

module.exports = {
  getPartners,
  createPartner,
  getPartnerTypes,
  createPartnerType,
  updatePartnerType,
  togglePartnerTypeStatus,
  getPricingTypes,
  createPricingType,
  updatePricingType,
  togglePricingTypeStatus
};
