const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const ServiceBooking = require('./serviceBooking.model');

const ACTOR_TYPES = ['TECHNICIAN', 'PARTNER'];
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
  actor_type: {
    type: DataTypes.ENUM(...ACTOR_TYPES),
    allowNull: false,
    defaultValue: 'TECHNICIAN'
  },
  technician_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Technicians',
      key: 'id'
    }
  },
  partner_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Partners',
      key: 'id'
    }
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Flexible storage for extra fields like item_name, estimated_cost, etc.'
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
