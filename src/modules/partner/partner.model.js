const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const PartnerType = require('./partnerType.model');

const Partner = sequelize.define('Partner', {
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
      return autoId ? `PRT-${autoId + 1000}` : null;
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true,
    }
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isNumeric: true,
      len: [10, 10],
    }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  force_password_change: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
    }
  },
  coverage_areas: {
    type: DataTypes.JSON, // JSON array of regional coverage areas
    allowNull: false,
    defaultValue: [],
  },
  services_provided: {
    type: DataTypes.JSON, // JSON array of Service IDs
    allowNull: false,
    defaultValue: [],
  },
  partner_type_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: PartnerType,
      key: 'id'
    }
  },
  custom_field_values: {
    type: DataTypes.JSON, // Answers to custom fields
    allowNull: false,
    defaultValue: {},
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  timestamps: true,
  tableName: 'Partners',
});

// Associations
Partner.belongsTo(PartnerType, { foreignKey: 'partner_type_id', as: 'partnerType' });
PartnerType.hasMany(Partner, { foreignKey: 'partner_type_id', as: 'partners' });

module.exports = Partner;
