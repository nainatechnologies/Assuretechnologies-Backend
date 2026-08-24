const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const ServiceBooking = require('./serviceBooking.model');

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
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  photos: {
    type: DataTypes.JSON, // Strict JSON array of image URLs
    allowNull: false,
    defaultValue: [],
  }
}, {
  timestamps: true,
  tableName: 'JobProgress',
});

module.exports = JobProgress;
