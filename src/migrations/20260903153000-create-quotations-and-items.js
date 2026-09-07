'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('quotations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      quotation_number: {
        type: Sequelize.STRING(32),
        allowNull: false,
        unique: true
      },
      customer_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      mobile: {
        type: Sequelize.STRING(15),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      company_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      gst_number: {
        type: Sequelize.STRING(15), // Exactly 15 chars for Indian GSTIN
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      pincode: {
        type: Sequelize.STRING(6), // Exactly 6 digits for Indian Postal Code
        allowNull: true
      },
      state: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'Telangana'
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      additional_charges_desc: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      additional_charges: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      gst_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 18.00
      },
      cgst_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      sgst_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      igst_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      grand_total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'),
        allowNull: false,
        defaultValue: 'Sent'
      },
      valid_until: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.createTable('quotation_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      quotation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'quotations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      service_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      sac_code: {
        type: Sequelize.STRING(10),
        allowNull: true,
        defaultValue: '9987'
      },
      qty: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('quotation_items');
    await queryInterface.dropTable('quotations');
  }
};
