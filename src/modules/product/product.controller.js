const productService = require('./product.service');
const asyncHandler = require('../../utils/asyncHandler');

exports.getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  if (limit > 100) limit = 100; // Cap to prevent DoS

  const filters = {
    search: req.query.search || '',
    stockStatus: req.query.stockStatus || 'All',
    sort: req.query.sort || 'popular'
  };

  const pagination = { page, limit };

  const result = await productService.getProducts(filters, pagination, req.user);
  res.status(200).json(result);
});

exports.createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body, req.user, req.file);
  res.status(201).json(product);
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body, req.user, req.file);
  res.status(200).json(product);
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const result = await productService.deleteProduct(req.params.id, req.user);
  res.status(200).json(result);
});
