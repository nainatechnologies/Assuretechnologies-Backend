'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('Orders');
    if (!table.payment_method) {
      await queryInterface.addColumn('Orders', 'payment_method', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'ONLINE'
      });
    }
    if (!table.payment_details) {
      await queryInterface.addColumn('Orders', 'payment_details', {
        type: Sequelize.JSON,
        allowNull: true
      });
    }
    if (!table.paid_at) {
      await queryInterface.addColumn('Orders', 'paid_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('Orders');
    if (table.payment_method) await queryInterface.removeColumn('Orders', 'payment_method');
    if (table.payment_details) await queryInterface.removeColumn('Orders', 'payment_details');
    if (table.paid_at) await queryInterface.removeColumn('Orders', 'paid_at');
  }
};
