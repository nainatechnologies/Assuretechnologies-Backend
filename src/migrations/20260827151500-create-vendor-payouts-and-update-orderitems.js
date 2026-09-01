'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create VendorPayouts table
    await queryInterface.createTable('VendorPayouts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      payout_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      vendor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Vendors',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      payment_method: {
        type: Sequelize.STRING,
        defaultValue: 'Bank Transfer',
      },
      transaction_reference: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      proof_image: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('COMPLETED', 'PENDING', 'FAILED'),
        defaultValue: 'COMPLETED',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // 2. Add columns to OrderItems table
    await queryInterface.addColumn('OrderItems', 'is_vendor_paid', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    await queryInterface.addColumn('OrderItems', 'vendor_payout_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'VendorPayouts',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('OrderItems', 'vendor_paid_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('OrderItems', 'vendor_paid_at');
    await queryInterface.removeColumn('OrderItems', 'vendor_payout_id');
    await queryInterface.removeColumn('OrderItems', 'is_vendor_paid');
    await queryInterface.dropTable('VendorPayouts');
  }
};
