const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/', authMiddleware(['admin']), orderController.getOrders);
router.get('/:orderId', authMiddleware(['admin', 'vendor', 'customer']), orderController.getOrderById);
router.post('/', authMiddleware(['customer', 'admin']), orderController.createOrder);
router.post('/:orderId/items/:itemId/split', authMiddleware(['admin', 'vendor']), orderController.splitOrderItem);

module.exports = router;
