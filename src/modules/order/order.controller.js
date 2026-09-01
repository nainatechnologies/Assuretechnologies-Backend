const orderService = require('./order.service');
const asyncHandler = require('../../utils/asyncHandler');

exports.createOrder = asyncHandler(async (req, res) => {
  const result = await orderService.createOrder(req.body, req.user);
  res.status(201).json({
    success: true,
    message: result.message,
    order: result.order,
    paymentUrl: result.paymentUrl,
    razorpayOrderId: result.razorpayOrderId,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TUJt0fwUv206Vf'
  });
});

exports.handlePaymentCallback = asyncHandler(async (req, res) => {
  const result = await orderService.handlePaymentCallback(req.query);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  if (result.success) {
    return res.redirect(`${frontendUrl}/orders?payment=success&orderNumber=${result.orderNumber}`);
  } else {
    return res.redirect(`${frontendUrl}/orders?payment=failed&orderNumber=${result.orderNumber || ''}`);
  }
});

exports.getOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getOrders(req.user);
  res.status(200).json(orders);
});

exports.splitOrderItem = asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;
  const result = await orderService.splitOrderItem(orderId, itemId, req.body);
  res.status(200).json(result);
});

exports.getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await orderService.getOrderById(orderId);
  res.status(200).json(order);
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const result = await orderService.updateOrderStatus(orderId, req.body);
  res.status(200).json(result);
});

exports.cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const result = await orderService.cancelOrder(orderId, req.user);
  res.status(200).json(result);
});

exports.updateOrderTracking = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const result = await orderService.updateOrderTracking(orderId, req.body, req.user);
  res.status(200).json(result);
});

exports.verifyPayment = asyncHandler(async (req, res) => {
  const result = await orderService.verifyPayment(req.body, req.user);
  res.status(200).json(result);
});

exports.handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.rawBody || JSON.stringify(req.body);
  const result = await orderService.handleRazorpayWebhook(rawBody, signature);
  res.status(200).json(result);
});

