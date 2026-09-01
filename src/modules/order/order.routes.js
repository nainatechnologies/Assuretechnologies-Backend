const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const { validateRequest } = require('../../middleware/validate.middleware');
const orderSchemas = require('./order.validation');
const rateLimit = require('express-rate-limit');

const orderCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many order requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const paymentVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: { success: false, message: 'Too many payment verification attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

router.get('/', authMiddleware(['admin', 'customer', 'vendor']), orderController.getOrders);
router.get('/payment-callback', orderController.handlePaymentCallback);
router.get('/:orderId', authMiddleware(['admin', 'vendor', 'customer']), orderController.getOrderById);
router.post('/', orderCreateLimiter, authMiddleware(['customer', 'admin', 'guest']), validateRequest(orderSchemas.createOrderSchema), orderController.createOrder);
router.post('/verify-payment', paymentVerifyLimiter, authMiddleware(['customer', 'admin', 'guest']), validateRequest(orderSchemas.verifyPaymentSchema), orderController.verifyPayment);
router.post('/webhook', orderController.handleRazorpayWebhook);
router.post('/:orderId/items/:itemId/split', authMiddleware(['admin']), validateRequest(orderSchemas.splitOrderItemSchema), orderController.splitOrderItem);

router.put('/:orderId/status', authMiddleware(['admin', 'vendor']), validateRequest(orderSchemas.updateOrderStatusSchema), orderController.updateOrderStatus);

router.post('/:orderId/cancel', authMiddleware(['customer', 'admin']), orderController.cancelOrder);

router.put('/:orderId/tracking', authMiddleware(['admin', 'vendor']), validateRequest(orderSchemas.updateOrderTrackingSchema), orderController.updateOrderTracking);

module.exports = router;

