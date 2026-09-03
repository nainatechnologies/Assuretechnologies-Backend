const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const QuotationItem = sequelize.define('QuotationItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  quotation_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  service_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  qty: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  }
}, {
  timestamps: true,
  tableName: 'quotation_items'
});

module.exports = QuotationItem;
