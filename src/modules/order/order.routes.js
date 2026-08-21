const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const { validateRequest } = require('../../middleware/validate.middleware');
const orderSchemas = require('./order.validation');

router.get('/', authMiddleware(['admin', 'customer', 'vendor']), orderController.getOrders);
router.get('/:orderId', authMiddleware(['admin', 'vendor', 'customer']), orderController.getOrderById);
router.post('/', authMiddleware(['customer', 'admin', 'guest']), validateRequest(orderSchemas.createOrderSchema), orderController.createOrder);
router.post('/:orderId/items/:itemId/split', authMiddleware(['admin']), validateRequest(orderSchemas.splitOrderItemSchema), orderController.splitOrderItem);

router.put('/:orderId/status', authMiddleware(['admin', 'vendor']), validateRequest(orderSchemas.updateOrderStatusSchema), orderController.updateOrderStatus);

router.post('/:orderId/cancel', authMiddleware(['customer', 'admin']), orderController.cancelOrder);

router.put('/:orderId/tracking', authMiddleware(['admin', 'vendor']), validateRequest(orderSchemas.updateOrderTrackingSchema), orderController.updateOrderTracking);

module.exports = router;

