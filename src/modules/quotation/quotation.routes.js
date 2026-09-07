const express = require('express');
const router = express.Router();
const quotationController = require('./quotation.controller');
const authMiddleware = require('../../middleware/authMiddleware');

router.use(authMiddleware(['admin']));

router.route('/')
  .get(quotationController.getQuotations)
  .post(quotationController.createQuotation);

router.route('/:id')
  .get(quotationController.getQuotationById)
  .delete(quotationController.deleteQuotation);

router.patch('/:id/status', quotationController.updateQuotationStatus);

module.exports = router;
