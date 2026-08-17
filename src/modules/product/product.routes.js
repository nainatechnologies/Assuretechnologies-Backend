const express = require('express');
const router = express.Router();
const productController = require('./product.controller');
const createUpload = require('../../middleware/upload');
const authMiddleware = require('../../middleware/authMiddleware');
const upload = createUpload('products');

router.get('/', productController.getProducts);
router.post('/', authMiddleware(['admin', 'vendor']), upload.single('banner'), productController.createProduct);
router.put('/:id', authMiddleware(['admin', 'vendor']), upload.single('banner'), productController.updateProduct);
router.delete('/:id', authMiddleware(['admin', 'vendor']), productController.deleteProduct);

module.exports = router;
