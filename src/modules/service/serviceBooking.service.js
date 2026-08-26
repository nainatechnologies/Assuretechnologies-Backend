const ServiceBooking = require('./serviceBooking.model');
const Service = require('./service.model');
const Order = require('../order/order.model');
const AppError = require('../../utils/AppError');
const { BOOKING_STATUSES } = require('./serviceBooking.validation');

// Simulated Razorpay integration placeholder
const createRazorpayOrder = async (amount, receipt_id) => {
  // In real implementation:
  // const options = { amount: amount * 100, currency: "INR", receipt: receipt_id };
  // const order = await razorpay.orders.create(options);
  // return order.id;

  return `rzp_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

const createBooking = async (bookingData, user) => {
  const { service_id, scheduled_date, address, pincode, lat, lng, quantity = 1, metadata = {} } = bookingData;
  const customer_id = user.id;

  // 1. Fetch Service and validate
  const service = await Service.findByPk(service_id);
  if (!service) {
    throw new AppError('Service not found', 404);
  }
  if (!service.is_active) {
    throw new AppError('This service is currently inactive', 400);
  }

  // 2. Calculate Final Price
  let final_price = 0;

  if (service.service_owner_type === 'ADMIN') {
    final_price = parseFloat(service.prebooking_charge || 0);
  } else {
    const rate = parseFloat(service.price || 0);
    const parsedQty = parseFloat(quantity || 1);
    final_price = rate * parsedQty;
  }

  const now = new Date();
  const datePart = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
  const timePart = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0');
  const randomPart = String(Math.floor(Math.random() * 1000)).padStart(3, '0');

  const order_number = 'SBK' + datePart + timePart + randomPart;

  const order = await Order.create({
    order_number,
    customer_id,
    customer_name: user.full_name || 'Customer',
    customer_contact: user.mobile || '',
    customer_address: typeof address === 'object' ? JSON.stringify(address) : address,
    subtotal_amount: final_price,
    tax_amount: 0,
    total_amount: final_price,
    status: 'NEW',
    payment_status: 'PENDING'
  });

  const booking = await ServiceBooking.create({
    order_id: order.id,
    service_id,
    scheduled_date,
    address: typeof address === 'object' ? JSON.stringify(address) : address,
    pincode,
    lat,
    lng,
    quantity,
    metadata,
    status: 'NEW',
    prebooking_paid: false
  });

  let razorpay_order_id = null;
  if (final_price > 0) {
    razorpay_order_id = await createRazorpayOrder(final_price, order_number);
  }

  return {
    message: 'Booking created successfully',
    booking_id: booking.id,
    order_number: order.order_number,
    total_amount: final_price,
    razorpay_order_id,
    requires_payment: final_price > 0
  };
};

const getCustomerBookings = async (user) => {
  const bookings = await ServiceBooking.findAll({
    include: [
      {
        model: Order,
        as: 'order',
        where: { customer_id: user.id },
        attributes: ['order_number', 'total_amount', 'payment_status']
      },
      {
        model: Service,
        as: 'service',
        attributes: ['id', 'name', 'image']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  return bookings;
};

const getAdminBookings = async () => {
  const bookings = await ServiceBooking.findAll({
    include: [
      {
        model: Order,
        as: 'order',
        attributes: ['order_number', 'total_amount', 'payment_status', 'customer_name', 'customer_contact']
      },
      {
        model: Service,
        as: 'service',
        attributes: ['id', 'name', 'service_owner_type']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  return bookings;
};

const verifyPayment = async (booking_id, payment_data, user) => {
  const booking = await ServiceBooking.findByPk(booking_id, {
    include: [{ model: Order, as: 'order' }]
  });

  if (!booking) throw new AppError('Booking not found', 404);

  if (!booking.order || booking.order.customer_id !== user.id) {
    throw new AppError('You are not authorized to verify this booking', 403);
  }

  if (!payment_data || Object.keys(payment_data).length === 0) {
    throw new AppError('Payment verification details are required', 400);
  }

  booking.prebooking_paid = true;
  await booking.save();

  booking.order.payment_status = 'PAID';
  await booking.order.save();

  return { message: 'Payment verified and booking confirmed' };
};

const updateBookingStatus = async (booking_id, status) => {
  if (!BOOKING_STATUSES.includes(status)) {
    throw new AppError(`Invalid status. Allowed values: ${BOOKING_STATUSES.join(', ')}`, 400);
  }

  const booking = await ServiceBooking.findByPk(booking_id);
  if (!booking) throw new AppError('Booking not found', 404);

  booking.status = status;
  await booking.save();

  return { message: 'Booking status updated successfully', booking };
};

module.exports = {
  createBooking,
  getCustomerBookings,
  getAdminBookings,
  verifyPayment,
  updateBookingStatus
};
