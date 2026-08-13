const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Vendor = require('../vendor/vendor.model');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  auto_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    unique: true
  },
  display_id: {
    type: DataTypes.VIRTUAL,
    get() {
      return `PROD-${this.getDataValue('auto_id') + 1000}`;
    }
  },
  vendor_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Null if this is an Admin product',
    references: {
      model: Vendor,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  base_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  discount: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Discount percentage (0 to 100)'
  },
  admin_commission: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Admin commission percentage (set by Vendor)'
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  banner: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL or filename of the single product image'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('In Stock', 'Out of Stock', 'Draft'),
    defaultValue: 'In Stock'
  }
}, {
  timestamps: true,
  tableName: 'Products'
});

Product.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });

module.exports = Product;
