const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const { validateRequest } = require('../../middleware/validate.middleware');
const orderSchemas = require('./order.validation');

router.get('/', authMiddleware(['admin', 'customer', 'vendor']), orderController.getOrders);
router.get('/:orderId', authMiddleware(['admin', 'vendor', 'customer']), orderController.getOrderById);
router.post('/', authMiddleware(['customer', 'admin', 'guest']), validateRequest(orderSchemas.createOrderSchema), orderController.createOrder);
router.post('/:orderId/items/:itemId/split', authMiddleware(['admin', 'vendor']), validateRequest(orderSchemas.splitOrderItemSchema), orderController.splitOrderItem);

module.exports = router;
