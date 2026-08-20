const orderService = require('./order.service');
const asyncHandler = require('../../utils/asyncHandler');

exports.createOrder = asyncHandler(async (req, res) => {
  const result = await orderService.createOrder(req.body, req.user);
  res.status(201).json(result);
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
  const result = await orderService.cancelOrder(orderId, req.user.id);
  res.status(200).json(result);
});

exports.updateOrderTracking = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const result = await orderService.updateOrderTracking(orderId, req.body, req.user);
  res.status(200).json(result);
});
