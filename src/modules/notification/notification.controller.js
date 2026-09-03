const notificationService = require('./notification.service');
const asyncHandler = require('../../utils/asyncHandler');

const getEffectiveRole = (req) => {
  return req.user?.role || req.headers['x-client-type'] || req.query.clientType || req.query.role || 'admin';
};

/**
 * GET /api/notifications/stream
 * Establish real-time SSE stream
 */
exports.streamNotifications = (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  res.write('event: connected\ndata: true\n\n');

  const role = getEffectiveRole(req);
  const userObj = {
    role,
    id: req.user?.id || null
  };
  notificationService.addClient(userObj, res);
};

/**
 * GET /api/notifications
 * Fetch historical notifications & unread count
 */
exports.getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, is_read } = req.query;
  const role = getEffectiveRole(req);
  const userId = req.user?.id || null;
  const result = await notificationService.getNotifications({ page, limit, is_read, role, userId });
  res.status(200).json({ success: true, data: result });
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
exports.markAsRead = asyncHandler(async (req, res) => {
  const role = getEffectiveRole(req);
  const userId = req.user?.id || null;
  const notification = await notificationService.markAsRead(req.params.id, userId, role);
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }
  res.status(200).json({ success: true, message: 'Notification marked as read', data: notification });
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const role = getEffectiveRole(req);
  const userId = req.user?.id || null;
  await notificationService.markAllAsRead(role, userId);
  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});
