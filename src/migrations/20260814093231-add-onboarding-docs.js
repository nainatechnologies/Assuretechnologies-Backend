'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add Technician columns
    await queryInterface.addColumn('Technicians', 'id_proof', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('Technicians', 'noc_document', { type: Sequelize.STRING, allowNull: true });

    // Add Vendor columns
    await queryInterface.addColumn('Vendors', 'aadhar_proof', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('Vendors', 'pan_proof', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('Vendors', 'shop_photo', { type: Sequelize.STRING, allowNull: true });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Technicians', 'id_proof');
    await queryInterface.removeColumn('Technicians', 'noc_document');
    await queryInterface.removeColumn('Vendors', 'aadhar_proof');
    await queryInterface.removeColumn('Vendors', 'pan_proof');
    await queryInterface.removeColumn('Vendors', 'shop_photo');
  }
};
