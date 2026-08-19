const express = require('express');
const router = express.Router();
const cartController = require('./cart.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const { validateRequest } = require('../../middleware/validate.middleware');
const cartSchemas = require('./cart.validation');

router.get('/', authMiddleware(['customer']), cartController.getCart);
router.post('/add', authMiddleware(['customer']), validateRequest(cartSchemas.addToCartSchema), cartController.addToCart);
router.put('/update', authMiddleware(['customer']), validateRequest(cartSchemas.updateCartItemSchema), cartController.updateCartItem);
router.delete('/remove/:productId', authMiddleware(['customer']), cartController.removeFromCart);

module.exports = router;
