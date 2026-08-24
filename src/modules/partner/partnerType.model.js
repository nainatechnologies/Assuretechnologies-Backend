const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Category = require('../category/category.model');

const PartnerType = sequelize.define('PartnerType', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  category_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Category,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  custom_fields: {
    type: DataTypes.JSON, // Array of field definitions
    allowNull: false,
    defaultValue: [],
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  }
}, {
  timestamps: true,
  tableName: 'PartnerTypes',
});

// Associations
PartnerType.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(PartnerType, { foreignKey: 'category_id', as: 'partnerTypes' });

module.exports = PartnerType;
