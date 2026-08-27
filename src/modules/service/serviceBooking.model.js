const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Order = require('../order/order.model');
const Service = require('./service.model');
const Partner = require('../partner/partner.model');
const Technician = require('../technician/technician.model');

const BOOKING_STATUSES = ['NEW', 'ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_APPROVAL', 'COMPLETED', 'CANCELLED'];

const ServiceBooking = sequelize.define('ServiceBooking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  auto_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    unique: true,
  },
  display_id: {
    type: DataTypes.VIRTUAL,
    get() {
      return `BKG-${this.getDataValue('auto_id') + 1000}`;
    }
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Order,
      key: 'id'
    }
  },
  service_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Service,
      key: 'id'
    }
  },
  assigned_partner_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: Partner,
      key: 'id'
    }
  },
  assigned_technician_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: Technician,
      key: 'id'
    }
  },
  scheduled_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  pincode: {
    type: DataTypes.STRING(6),
    allowNull: false,
  },
  lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Quantity of the service booked (e.g., number of acres, hours, or units)'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Flexible JSON storage for survey numbers, drone types, and custom field responses'
  },
  prebooking_paid: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM(...BOOKING_STATUSES),
    allowNull: false,
    defaultValue: 'NEW',
  }
}, {
  timestamps: true,
  tableName: 'ServiceBookings',
});

module.exports = ServiceBooking;
