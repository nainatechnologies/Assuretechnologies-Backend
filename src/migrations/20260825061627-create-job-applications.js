'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableExists = await queryInterface.showAllTables().then(tables => tables.includes('job_applications'));
    if (tableExists) {
      console.log('Table job_applications already exists, skipping creation.');
      return;
    }

    await queryInterface.createTable('job_applications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      jobId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'job_postings',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      applicantName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      gender: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      dob: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      experience: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      currentSalary: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      expectedSalary: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      availableToJoin: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      preferredLocation: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      currentLocation: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      skills: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      resumeUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('Pending', 'Reviewed', 'Accepted', 'Rejected'),
        defaultValue: 'Pending',
        allowNull: false,
      },
      appliedDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('job_applications');
  },
};
