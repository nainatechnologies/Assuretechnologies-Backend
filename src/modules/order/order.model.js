const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Customer = require('../customer/customer.model');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  order_number: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  customer_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Null for now if customer is missing',
    references: {
      model: Customer,
      key: 'id'
    }
  },
  customer_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  customer_contact: {
    type: DataTypes.STRING,
    allowNull: true
  },
  customer_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  company_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gst_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  subtotal_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('NEW', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'),
    defaultValue: 'NEW'
  },
  payment_status: {
    type: DataTypes.ENUM('PENDING', 'PAID'),
    defaultValue: 'PENDING'
  }
}, {
  timestamps: true,
  tableName: 'Orders'
});

Order.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

module.exports = Order;
