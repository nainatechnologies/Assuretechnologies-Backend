const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('ORDER', 'SERVICE', 'STOCK', 'PARTNER', 'CAREER', 'SYSTEM'),
    defaultValue: 'SYSTEM',
  },
  action_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  target_role: {
    type: DataTypes.STRING,
    defaultValue: 'admin',
  },
  target_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Specific vendor or user ID when targeted'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  }
}, {
  timestamps: true,
  tableName: 'Notifications',
});

module.exports = Notification;
