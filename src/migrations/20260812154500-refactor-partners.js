'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create PartnerTypes
    await queryInterface.createTable('PartnerTypes', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false, unique: true },
      custom_fields: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 2. Create PricingTypes
    await queryInterface.createTable('PricingTypes', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false, unique: true },
      label: { type: Sequelize.STRING, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 3. Drop DronePartners table
    await queryInterface.dropTable('DronePartners');

    // 4. Create Partners table
    await queryInterface.createTable('Partners', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      auto_id: { type: Sequelize.INTEGER, autoIncrement: true, unique: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      mobile: { type: Sequelize.STRING, allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING, allowNull: false },
      full_name: { type: Sequelize.STRING, allowNull: false },
      address: { type: Sequelize.TEXT, allowNull: false },
      coverage_areas: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
      services_provided: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
      partner_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'PartnerTypes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      custom_field_values: { type: Sequelize.JSON, allowNull: false, defaultValue: {} },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Partners');
    await queryInterface.dropTable('PricingTypes');
    await queryInterface.dropTable('PartnerTypes');

    // Recreate DronePartners
    await queryInterface.createTable('DronePartners', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      mobile: { type: Sequelize.STRING, allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING, allowNull: false },
      full_name: { type: Sequelize.STRING, allowNull: false },
      address: { type: Sequelize.TEXT, allowNull: false },
      coverage_areas: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
      services_provided: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  }
};
