const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PartnerType = sequelize.define('PartnerType', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  custom_fields: {
    type: DataTypes.JSON, // Array of field definitions
    allowNull: false,
    defaultValue: [],
  }
}, {
  timestamps: true,
  tableName: 'PartnerTypes',
});

module.exports = PartnerType;
