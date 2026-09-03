const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Quotation = sequelize.define('Quotation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  quotation_number: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true
  },
  customer_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  mobile: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  company_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  gst_number: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pincode: {
    type: DataTypes.STRING(6),
    allowNull: true
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  additional_charges_desc: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  additional_charges: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  gst_percent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 18.00
  },
  grand_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'quotations'
});

module.exports = Quotation;
