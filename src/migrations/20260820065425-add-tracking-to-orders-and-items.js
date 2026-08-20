'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add columns to Orders table
    await queryInterface.addColumn('Orders', 'transport_name', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Orders', 'tracking_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Orders', 'tracking_url', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Add columns to OrderItems table
    await queryInterface.addColumn('OrderItems', 'transport_name', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('OrderItems', 'tracking_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('OrderItems', 'tracking_url', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns from Orders table
    await queryInterface.removeColumn('Orders', 'transport_name');
    await queryInterface.removeColumn('Orders', 'tracking_id');
    await queryInterface.removeColumn('Orders', 'tracking_url');

    // Remove columns from OrderItems table
    await queryInterface.removeColumn('OrderItems', 'transport_name');
    await queryInterface.removeColumn('OrderItems', 'tracking_id');
    await queryInterface.removeColumn('OrderItems', 'tracking_url');
  }
};
