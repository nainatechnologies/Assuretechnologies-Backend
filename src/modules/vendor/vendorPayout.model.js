const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Vendor = require('./vendor.model');

const VendorPayout = sequelize.define('VendorPayout', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  payout_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  vendor_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Vendor,
      key: 'id',
    },
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  payment_method: {
    type: DataTypes.STRING,
    defaultValue: 'Bank Transfer',
  },
  transaction_reference: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  proof_image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('COMPLETED', 'PENDING', 'FAILED'),
    defaultValue: 'COMPLETED',
  }
}, {
  timestamps: true,
  tableName: 'VendorPayouts',
});

VendorPayout.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
Vendor.hasMany(VendorPayout, { foreignKey: 'vendor_id', as: 'payouts' });

module.exports = VendorPayout;
