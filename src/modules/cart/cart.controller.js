const cartService = require('./cart.service');
const asyncHandler = require('../../utils/asyncHandler');

exports.getCart = asyncHandler(async (req, res) => {
  const result = await cartService.getCart(req.user.id);
  res.status(200).json(result);
});

exports.addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const result = await cartService.addToCart(req.user.id, productId, quantity);
  res.status(200).json(result);
});

exports.updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const result = await cartService.updateCartItem(req.user.id, productId, quantity);
  res.status(200).json(result);
});

exports.removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const result = await cartService.removeFromCart(req.user.id, productId);
  res.status(200).json(result);
});
