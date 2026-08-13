'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Admins
    await queryInterface.createTable('Admins', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      auto_id: { type: Sequelize.INTEGER, autoIncrement: true, unique: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      mobile: { type: Sequelize.STRING, allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING, allowNull: false },
      full_name: { type: Sequelize.STRING, allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 2. Customers
    await queryInterface.createTable('Customers', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      auto_id: { type: Sequelize.INTEGER, autoIncrement: true, unique: true },
      email: { type: Sequelize.STRING, allowNull: true, unique: true },
      mobile: { type: Sequelize.STRING, allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING, allowNull: false },
      full_name: { type: Sequelize.STRING, allowNull: false },
      full_address: { type: Sequelize.TEXT, allowNull: false },
      pincode: { type: Sequelize.STRING(6), allowNull: false },
      state_name: { type: Sequelize.STRING, allowNull: false },
      is_mobile_verified: { type: Sequelize.BOOLEAN, defaultValue: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 3. Vendors
    await queryInterface.createTable('Vendors', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      auto_id: { type: Sequelize.INTEGER, autoIncrement: true, unique: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      mobile: { type: Sequelize.STRING, allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING, allowNull: false },
      full_name: { type: Sequelize.STRING, allowNull: false },
      business_name: { type: Sequelize.STRING, allowNull: false },
      address: { type: Sequelize.TEXT, allowNull: false },
      gst_number: { type: Sequelize.STRING(15), allowNull: false },
      pincode: { type: Sequelize.STRING(10), allowNull: true },
      business_description: { type: Sequelize.TEXT, allowNull: true },
      bank_account_details: { type: Sequelize.TEXT, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 4. Technicians
    await queryInterface.createTable('Technicians', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      auto_id: { type: Sequelize.INTEGER, autoIncrement: true, unique: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      mobile: { type: Sequelize.STRING, allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING, allowNull: false },
      full_name: { type: Sequelize.STRING, allowNull: false },
      address: { type: Sequelize.TEXT, allowNull: false },
      service_pincodes: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
      services_provided: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 5. DronePartners
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('DronePartners');
    await queryInterface.dropTable('Technicians');
    await queryInterface.dropTable('Vendors');
    await queryInterface.dropTable('Customers');
    await queryInterface.dropTable('Admins');
  }
};
