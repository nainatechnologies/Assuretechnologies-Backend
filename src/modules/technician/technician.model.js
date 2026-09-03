const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Technician = sequelize.define('Technician', {
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
      const autoId = this.getDataValue('auto_id');
      return autoId ? `TECH-${autoId + 1000}` : null;
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
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  service_pincodes: {
    type: DataTypes.JSON, // JSON array of pincode strings
    allowNull: false,
    defaultValue: [],
  },
  services_provided: {
    type: DataTypes.JSON, // JSON array of Service IDs
    allowNull: false,
    defaultValue: [],
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  force_password_change: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  timestamps: true,
  tableName: 'Technicians',
});

module.exports = Technician;
