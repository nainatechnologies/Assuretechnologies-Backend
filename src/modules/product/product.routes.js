const express = require('express');
const router = express.Router();
const productController = require('./product.controller');
const createUpload = require('../../middleware/upload');
const upload = createUpload('products');

router.get('/', productController.getProducts);
router.post('/', upload.single('banner'), productController.createProduct);
router.put('/:id', upload.single('banner'), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
