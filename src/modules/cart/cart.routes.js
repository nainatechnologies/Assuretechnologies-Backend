const express = require('express');
const router = express.Router();
const cartController = require('./cart.controller');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/', authMiddleware(['customer']), cartController.getCart);
router.post('/add', authMiddleware(['customer']), cartController.addToCart);
router.put('/update', authMiddleware(['customer']), cartController.updateCartItem);
router.delete('/remove/:productId', authMiddleware(['customer']), cartController.removeFromCart);

module.exports = router;
