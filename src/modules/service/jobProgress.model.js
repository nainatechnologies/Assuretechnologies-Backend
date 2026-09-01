const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const ServiceBooking = require('./serviceBooking.model');

const UPDATE_TYPES = ['START', 'PROGRESS', 'COMPLETE'];

const JobProgress = sequelize.define('JobProgress', {
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
  technician_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Technicians', // Uses the table name as reference to avoid circular dependencies if any
      key: 'id'
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  photos: {
    type: DataTypes.JSON, // Strict JSON array of image URLs
    allowNull: false,
    defaultValue: [],
  },
  photo_public_ids: {
    type: DataTypes.JSON, // Strict JSON array of Cloudinary public IDs
    allowNull: true,
    defaultValue: [],
  },
  update_type: {
    type: DataTypes.ENUM(...UPDATE_TYPES),
    defaultValue: 'PROGRESS'
  }
}, {
  timestamps: true,
  tableName: 'JobProgress',
});

module.exports = JobProgress;
