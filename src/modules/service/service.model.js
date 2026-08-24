const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Partner = require('../partner/partner.model');
const PartnerType = require('../partner/partnerType.model');
const PricingType = require('../partner/pricingType.model');
const Category = require('../category/category.model');
const OWNER_TYPES = ['ADMIN', 'PARTNER'];

const Service = sequelize.define('Service', {
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
      return `SRV-${this.getDataValue('auto_id') + 1000}`;
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 150]
    }
  },
  category_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Category,
      key: 'id'
    }
  },
  pricing_type_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: PricingType,
      key: 'id'
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  service_owner_type: {
    type: DataTypes.ENUM(...OWNER_TYPES),
    allowNull: false,
    defaultValue: 'ADMIN',
  },
  required_partner_type_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'The type of partner qualified to perform this service (e.g., Drone Pilot)',
    references: {
      model: PartnerType,
      key: 'id'
    }
  },
  prebooking_charge: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  image_public_id: {
    type: DataTypes.STRING,
    allowNull: true, // Legacy rows might not have it initially
  },
  custom_fields: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  }
}, {
  timestamps: true,
  tableName: 'Services',
  indexes: [
    {
      unique: true,
      fields: ['name', 'category_id', 'service_owner_type']
    }
  ]
});

// Associations
Service.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(Service, { foreignKey: 'category_id', as: 'services' });

Service.belongsTo(PartnerType, { foreignKey: 'required_partner_type_id', as: 'requiredPartnerType' });
PartnerType.hasMany(Service, { foreignKey: 'required_partner_type_id', as: 'services' });

Service.belongsTo(PricingType, { foreignKey: 'pricing_type_id', as: 'pricingType' });
PricingType.hasMany(Service, { foreignKey: 'pricing_type_id', as: 'services' });

module.exports = Service;
