const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Otp = sequelize.define('Otp', {
    mobile: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    otp: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
    }
}, {
    timestamps: true,
    tableName: 'otps'
});

module.exports = Otp;
