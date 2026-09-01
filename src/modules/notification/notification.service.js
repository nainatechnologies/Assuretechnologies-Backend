const Notification = require('./notification.model');
const { Op } = require('sequelize');

// Array of active SSE connections: { res, role, userId }
let clients = [];

/**
 * Add a new SSE client connection
 */
const addClient = (user, res) => {
  const clientObj = {
    res,
    role: user?.role || 'admin',
    userId: user?.id || null
  };
  clients.push(clientObj);

  // Send keepalive comment every 4s to prevent idle connection reset
  const heartbeatId = setInterval(() => {
    try {
      res.write(":\n\n");
    } catch (e) {
      clearInterval(heartbeatId);
    }
  }, 4000);

  res.on('close', () => {
    clearInterval(heartbeatId);
    clients = clients.filter(c => c.res !== res);
  });
};

/**
 * Send SSE event to connected clients strictly matching targetRole / targetUserId
 */
const sendSSE = (targetRole, targetUserId, eventType, data) => {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try {
      if (targetUserId) {
        // Direct vendor/user targeting: only send to the exact recipient
        if (client.userId && String(client.userId) === String(targetUserId)) {
          client.res.write(payload);
        }
      } else {
        // Role-based targeting: strictly matching role
        if (targetRole === 'ALL' || client.role === targetRole) {
          client.res.write(payload);
        }
      }
    } catch (err) {
      console.error('Failed to push SSE to client:', err.message);
    }
  });
};

/**
 * Create a new notification in DB and push via SSE in real time
 */
const createNotification = async ({ 
  title, 
  message, 
  type = 'SYSTEM', 
  action_url = null, 
  target_role = 'admin', 
  target_user_id = null, 
  metadata = null 
}) => {
  try {
    const notification = await Notification.create({
      title,
      message,
      type,
      action_url,
      target_role,
      target_user_id,
      metadata,
      is_read: false
    });

    const json = notification.toJSON();
    sendSSE(target_role, target_user_id, 'NEW_NOTIFICATION', json);
    return json;
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
};

/**
 * Get paginated notifications strictly isolated for the requesting role & user
 */
const getNotifications = async ({ page = 1, limit = 20, is_read = undefined, role = 'admin', userId = null } = {}) => {
  const parsedPage = Math.max(1, parseInt(page, 10));
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const offset = (parsedPage - 1) * parsedLimit;

  let whereClause = {};

  if (role === 'admin') {
    whereClause.target_role = { [Op.in]: ['ALL', 'admin'] };
  } else if (role === 'vendor') {
    whereClause[Op.and] = [
      { target_role: { [Op.in]: ['ALL', 'vendor'] } },
      userId ? {
        [Op.or]: [
          { target_user_id: userId },
          { target_user_id: null }
        ]
      } : { target_user_id: null }
    ];
  } else {
    whereClause.target_role = 'ALL';
  }

  if (is_read !== undefined && is_read !== null) {
    whereClause.is_read = is_read === true || is_read === 'true';
  }

  const { count, rows } = await Notification.findAndCountAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit: parsedLimit,
    offset
  });

  const unreadWhereClause = { ...whereClause, is_read: false };
  const totalUnreadCount = await Notification.count({ where: unreadWhereClause });

  return {
    total: count,
    totalUnreadCount,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(count / parsedLimit) || 1,
    notifications: rows
  };
};

/**
 * Mark a notification as read
 */
const markAsRead = async (id, userId = null, role = 'admin') => {
  const notification = await Notification.findByPk(id);
  if (!notification) {
    return null;
  }
  notification.is_read = true;
  await notification.save();
  return notification;
};

/**
 * Mark all notifications as read for current user/role
 */
const markAllAsRead = async (role = 'admin', userId = null) => {
  let whereClause = { is_read: false };

  if (role === 'admin') {
    whereClause.target_role = { [Op.in]: ['ALL', 'admin'] };
  } else if (role === 'vendor') {
    whereClause[Op.and] = [
      { target_role: { [Op.in]: ['ALL', 'vendor'] } },
      userId ? {
        [Op.or]: [
          { target_user_id: userId },
          { target_user_id: null }
        ]
      } : { target_user_id: null }
    ];
  }

  const result = await Notification.update(
    { is_read: true },
    { where: whereClause }
  );
  return result;
};

module.exports = {
  addClient,
  sendSSE,
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead
};
