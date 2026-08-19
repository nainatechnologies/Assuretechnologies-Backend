const express = require('express');
const router = express.Router();
const productController = require('./product.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const createUpload = require('../../middleware/upload');
const upload = createUpload('products');
const { validateRequest } = require('../../middleware/validate.middleware');
const productSchemas = require('./product.validation');

// Get all products (public/customer)
router.get('/', productController.getProducts);

// Get a single product


// Create a product (admin or vendor)
router.post('/', authMiddleware(['admin', 'vendor']), upload.single('banner'), validateRequest(productSchemas.createProductSchema), productController.createProduct);

// Update a product
router.put('/:id', authMiddleware(['admin', 'vendor']), upload.single('banner'), validateRequest(productSchemas.updateProductSchema), productController.updateProduct);

// Delete a product
router.delete('/:id', authMiddleware(['admin', 'vendor']), productController.deleteProduct);

module.exports = router;
