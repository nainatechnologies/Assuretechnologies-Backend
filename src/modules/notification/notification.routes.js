const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const authMiddleware = require('../../middleware/authMiddleware');

// Support admin, vendor, and guest fallback
router.get('/stream', authMiddleware(['admin', 'vendor', 'guest']), notificationController.streamNotifications);
router.get('/', authMiddleware(['admin', 'vendor', 'guest']), notificationController.getNotifications);
router.patch('/read-all', authMiddleware(['admin', 'vendor', 'guest']), notificationController.markAllAsRead);
router.patch('/:id/read', authMiddleware(['admin', 'vendor', 'guest']), notificationController.markAsRead);

module.exports = router;
