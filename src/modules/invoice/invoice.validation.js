const { z } = require('zod');

const createInvoiceSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0').optional(),
  particulars: z.string().optional()
});

module.exports = {
  createInvoiceSchema
};
