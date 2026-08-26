const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const PricingType = sequelize.define('PricingType', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
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
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  }
}, {
  timestamps: true,
  tableName: 'PricingTypes',
});

module.exports = PricingType;
