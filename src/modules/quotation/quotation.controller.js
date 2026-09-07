const quotationService = require('./quotation.service');
const { createQuotationSchema, updateStatusSchema } = require('./quotation.validation');
const AppError = require('../../utils/AppError');

const createQuotation = async (req, res, next) => {
  try {
    const parseResult = createQuotationSchema.safeParse(req.body);
    if (!parseResult.success) {
      const messages = parseResult.error.issues.map(i => i.message).join('; ');
      return next(new AppError(messages, 400));
    }

    const quotation = await quotationService.createQuotation(parseResult.data);
    res.status(201).json({
      success: true,
      message: 'Quotation created successfully',
      data: quotation
    });
  } catch (err) {
    next(err);
  }
};

const getQuotations = async (req, res, next) => {
  try {
    const result = await quotationService.getQuotations(req.query);
    res.status(200).json({
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    });
  } catch (err) {
    next(err);
  }
};

const getQuotationById = async (req, res, next) => {
  try {
    const quotation = await quotationService.getQuotationById(req.params.id);
    res.status(200).json({
      success: true,
      data: quotation
    });
  } catch (err) {
    next(err);
  }
};

const updateQuotationStatus = async (req, res, next) => {
  try {
    const parseResult = updateStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return next(new AppError(parseResult.error.issues[0].message, 400));
    }
    const quotation = await quotationService.updateQuotationStatus(req.params.id, parseResult.data.status);
    res.status(200).json({
      success: true,
      message: 'Quotation status updated successfully',
      data: quotation
    });
  } catch (err) {
    next(err);
  }
};

const deleteQuotation = async (req, res, next) => {
  try {
    const result = await quotationService.deleteQuotation(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotationStatus,
  deleteQuotation
};
