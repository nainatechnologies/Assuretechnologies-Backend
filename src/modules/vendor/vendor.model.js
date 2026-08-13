const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Vendor = sequelize.define('Vendor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  auto_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    unique: true,
  },
  display_id: {
    type: DataTypes.VIRTUAL,
    get() {
      return `VND-${this.getDataValue('auto_id') + 1000}`;
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  business_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  gst_number: {
    type: DataTypes.STRING(15),
    allowNull: false,
  },
  pincode: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  business_description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  bank_account_details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  timestamps: true,
  tableName: 'Vendors',
});

module.exports = Vendor;
