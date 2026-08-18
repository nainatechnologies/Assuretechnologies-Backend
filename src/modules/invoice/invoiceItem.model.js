const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const InvoiceItem = sequelize.define('InvoiceItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  invoice_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  qty: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  warranty: {
    type: DataTypes.STRING,
    allowNull: true
  },
  model_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  hsn_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  serial_numbers: {
    type: DataTypes.JSON, // Array of strings
    allowNull: true,
    defaultValue: []
  }
}, {
  timestamps: true,
  tableName: 'invoice_items'
});

module.exports = InvoiceItem;
