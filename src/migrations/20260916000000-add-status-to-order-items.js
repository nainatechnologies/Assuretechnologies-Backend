'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDefinition = await queryInterface.describeTable('OrderItems');
    if (!tableDefinition.status) {
      await queryInterface.addColumn('OrderItems', 'status', {
        type: Sequelize.ENUM('NEW', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'),
        defaultValue: 'NEW',
        allowNull: false
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDefinition = await queryInterface.describeTable('OrderItems');
    if (tableDefinition.status) {
      await queryInterface.removeColumn('OrderItems', 'status');
    }
  }
};
