const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Customer = require('./customer.model');

const CustomerAddress = sequelize.define('CustomerAddress', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  customer_id: { type: DataTypes.UUID, allowNull: false, references: { model: Customer, key: 'id' } },
  full_name: { type: DataTypes.STRING, allowNull: false },
  mobile_number: { type: DataTypes.STRING, allowNull: false },
  pincode: { type: DataTypes.STRING(6), allowNull: false },
  address_line1: { type: DataTypes.STRING, allowNull: false },
  address_line2: { type: DataTypes.STRING, allowNull: true },
  landmark: { type: DataTypes.STRING, allowNull: true },
  city: { type: DataTypes.STRING, allowNull: false },
  state: { type: DataTypes.STRING, allowNull: false },
  is_default: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { timestamps: true, tableName: 'CustomerAddresses' });

Customer.hasMany(CustomerAddress, { foreignKey: 'customer_id', as: 'addresses' });
CustomerAddress.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

module.exports = CustomerAddress;
