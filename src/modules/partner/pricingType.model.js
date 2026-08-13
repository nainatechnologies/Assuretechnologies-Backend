const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PricingType = sequelize.define('PricingType', {
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
  label: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  timestamps: true,
  tableName: 'PricingTypes',
});

module.exports = PricingType;
