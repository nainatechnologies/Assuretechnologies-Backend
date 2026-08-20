const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Order = require('./order.model');
const Product = require('../product/product.model');
const Vendor = require('../vendor/vendor.model');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Order,
      key: 'id'
    }
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Product,
      key: 'id'
    }
  },
  vendor_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'The vendor assigned to fulfill this specific item quantity',
    references: {
      model: Vendor,
      key: 'id'
    }
  },
  qty: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Snapshot of product price (after discount) at time of order'
  },
  admin_commission: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Snapshot of the admin commission for this product at time of order'
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  transport_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tracking_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tracking_url: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'OrderItems'
});

OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });

OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
OrderItem.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });

module.exports = OrderItem;
