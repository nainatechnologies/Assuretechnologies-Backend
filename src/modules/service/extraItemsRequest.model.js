const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const ServiceBooking = require('./serviceBooking.model');

const EXTRA_ITEM_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

const ExtraItemsRequest = sequelize.define('ExtraItemsRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  booking_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: ServiceBooking,
      key: 'id'
    }
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  qty: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  status: {
    type: DataTypes.ENUM(...EXTRA_ITEM_STATUSES),
    allowNull: false,
    defaultValue: 'PENDING',
  }
}, {
  timestamps: true,
  tableName: 'ExtraItemsRequests',
});

module.exports = ExtraItemsRequest;
