const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  invoice_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  order_id: {
    type: DataTypes.STRING, // Since orders use custom string IDs like ORD...
    allowNull: true
  },
  vendor_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  customer_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  additional_charges_desc: {
    type: DataTypes.STRING,
    allowNull: true
  },
  additional_charges: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  gst_percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 18
  },
  grand_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Paid'
  },
  type: {
    type: DataTypes.ENUM('VENDOR', 'SERVICE'),
    defaultValue: 'VENDOR'
  }
}, {
  timestamps: true,
  tableName: 'invoices'
});

module.exports = Invoice;
