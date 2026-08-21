const express = require('express');
const router = express.Router();
const customerController = require('./customer.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const { validateRequest } = require('../../middleware/validate.middleware');
const { updateProfileSchema } = require('./customer.validation');

router.get('/profile', authMiddleware(['customer']), customerController.getProfile);
router.put('/profile', authMiddleware(['customer']), validateRequest(updateProfileSchema), customerController.updateProfile);

module.exports = router;
