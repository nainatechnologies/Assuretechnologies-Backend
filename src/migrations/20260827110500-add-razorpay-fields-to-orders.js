'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Orders', 'razorpay_order_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Orders', 'razorpay_payment_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Orders', 'razorpay_signature', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Orders', 'razorpay_order_id');
    await queryInterface.removeColumn('Orders', 'razorpay_payment_id');
    await queryInterface.removeColumn('Orders', 'razorpay_signature');
  }
};
