const { z } = require('zod');

const createInvoiceSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      productName: z.string().optional(),
      modelNumber: z.string().optional(),
      hsnCode: z.string().optional(),
      serialNumbers: z.array(z.string()).optional(),
      warranty: z.string().optional()
    })
  ).min(1, 'At least one item is required')
});

module.exports = {
  createInvoiceSchema
};
