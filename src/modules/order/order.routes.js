const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');

router.get('/', orderController.getOrders);
router.post('/:orderId/items/:itemId/split', orderController.splitOrderItem);

module.exports = router;
