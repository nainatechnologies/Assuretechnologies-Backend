const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Cart = sequelize.define('Cart', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  customer_id: { type: DataTypes.UUID, allowNull: false }
}, {
  tableName: 'carts',
  timestamps: true
});

module.exports = Cart;
