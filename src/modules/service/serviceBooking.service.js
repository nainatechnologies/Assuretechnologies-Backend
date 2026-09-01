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

  // Fetch actual customer to get name and mobile
  const Customer = require('../customer/customer.model');
  const customer = await Customer.findByPk(customer_id);

  const order = await Order.create({
    order_number,
    customer_id,
    customer_name: customer ? customer.full_name : 'Customer',
    customer_contact: customer ? customer.mobile : '',
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

const getCustomerBookings = async (user, booking_id = null) => {
  const Technician = require('../technician/technician.model');
  const JobProgress = require('./jobProgress.model');
  const ExtraItemsRequest = require('./extraItemsRequest.model');

  const whereClause = {};
  if (booking_id) {
    whereClause.id = booking_id;
  }

  const bookings = await ServiceBooking.findAll({
    where: whereClause,
    include: [
      {
        model: Order,
        as: 'Order',
        where: { customer_id: user.id },
        attributes: ['order_number', 'total_amount', 'payment_status', 'customer_name', 'customer_contact']
      },
      {
        model: Service,
        as: 'Service',
        attributes: ['id', 'name', 'image', 'service_owner_type', 'prebooking_charge']
      },
      {
        model: Technician,
        as: 'assigned_technician',
        attributes: ['id', 'full_name', 'mobile', 'email']
      },
      {
        model: JobProgress,
        as: 'progress_updates',
        attributes: ['id', 'description', 'photos', 'update_type', 'createdAt']
      },
      {
        model: ExtraItemsRequest,
        as: 'extra_items',
        attributes: ['id', 'description', 'qty', 'status', 'metadata', 'createdAt']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  return booking_id ? (bookings[0] || null) : bookings;
};

const handleCustomerAction = async (booking_id, user_id, actionData) => {
  const { action } = actionData;
  const JobProgress = require('./jobProgress.model');
  const ExtraItemsRequest = require('./extraItemsRequest.model');

  const booking = await ServiceBooking.findOne({
    where: { id: booking_id },
    include: [
      {
        model: Order,
        as: 'Order',
        attributes: ['customer_id']
      }
    ]
  });

  if (!booking) {
    throw new AppError('Service booking not found', 404);
  }

  if (!booking.Order || booking.Order.customer_id !== user_id) {
    throw new AppError('Unauthorized: This booking does not belong to you', 403);
  }

  if (action === 'ACCEPT_WORK') {
    if (booking.status !== 'AWAITING_APPROVAL') {
      throw new AppError(`Cannot accept work when booking is in '${booking.status}' status`, 400);
    }

    booking.status = 'COMPLETED';
    await booking.save();

    await JobProgress.create({
      booking_id: booking.id,
      technician_id: booking.assigned_technician_id,
      description: 'Customer approved and accepted the completed work',
      photos: [],
      update_type: 'COMPLETE'
    });

    return {
      message: 'Work accepted and service marked as COMPLETED successfully',
      status: 'COMPLETED'
    };
  }

  if (action === 'CANCEL') {
    const uncancelableStatuses = ['IN_PROGRESS', 'AWAITING_APPROVAL', 'COMPLETED', 'CANCELLED'];
    if (uncancelableStatuses.includes(booking.status)) {
      throw new AppError(`Cannot cancel booking when it is in '${booking.status}' status`, 400);
    }
    
    booking.status = 'CANCELLED';
    booking.cancelled_by = 'CUSTOMER';
    booking.cancellation_reason = actionData.reason || 'No reason provided';
    await booking.save();
    
    // Optionally record JobProgress for cancellation history
    await JobProgress.create({
      booking_id: booking.id,
      technician_id: booking.assigned_technician_id || null,
      description: 'Customer cancelled the service booking' + (actionData.reason ? `: ${actionData.reason}` : ''),
      photos: [],
      update_type: 'COMPLETE'
    });

    return {
      message: 'Service booking cancelled successfully',
      status: 'CANCELLED'
    };
  }

  if (action === 'UPDATE_EXTRA_ITEM') {
    const { item_id, status } = actionData;

    const extraItem = await ExtraItemsRequest.findOne({
      where: { id: item_id, booking_id: booking.id }
    });

    if (!extraItem) {
      throw new AppError('Extra item request not found for this booking', 404);
    }

    if (extraItem.status !== 'PENDING') {
      throw new AppError(`Extra item has already been ${extraItem.status.toLowerCase()}`, 400);
    }

    extraItem.status = status;
    await extraItem.save();

    return {
      message: `Extra item request ${status} successfully`,
      extra_item: extraItem
    };
  }

  throw new AppError('Invalid action', 400);
};

const getAdminBookings = async (status, owner_type, page = 1, limit = 10) => {
  const whereClause = {};
  if (status && BOOKING_STATUSES.includes(status)) {
    whereClause.status = status;
  }

  const serviceWhere = {};
  if (owner_type) {
    serviceWhere.service_owner_type = owner_type;
  }

  const offset = (page - 1) * limit;

  const Customer = require('../customer/customer.model');
  const Technician = require('../technician/technician.model');
  const JobProgress = require('./jobProgress.model');

  const { count, rows } = await ServiceBooking.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Order,
        as: 'Order',
        attributes: ['order_number', 'total_amount', 'payment_status', 'customer_name', 'customer_contact'],
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['email']
          }
        ]
      },
      {
        model: Service,
        as: 'Service',
        attributes: ['id', 'name', 'service_owner_type', 'prebooking_charge'],
        where: Object.keys(serviceWhere).length > 0 ? serviceWhere : undefined
      },
      {
        model: Technician,
        as: 'assigned_technician',
        attributes: ['id', 'full_name', 'mobile', 'email']
      },
      {
        model: JobProgress,
        as: 'progress_updates',
        attributes: ['id', 'description', 'photos', 'update_type', 'createdAt']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    subQuery: false,
    distinct: true
  });

  return {
    available_statuses: BOOKING_STATUSES,
    data: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit)
  };
};

const verifyPayment = async (booking_id, payment_data, user) => {
  const booking = await ServiceBooking.findByPk(booking_id, {
    include: [{ model: Order, as: 'Order' }]
  });

  if (!booking) throw new AppError('Booking not found', 404);

  if (!booking.Order || booking.Order.customer_id !== user.id) {
    throw new AppError('You are not authorized to verify this booking', 403);
  }

  if (!payment_data || Object.keys(payment_data).length === 0) {
    throw new AppError('Payment verification details are required', 400);
  }

  booking.prebooking_paid = true;
  await booking.save();

  booking.Order.payment_status = 'PAID';
  await booking.Order.save();

  return { message: 'Payment verified and booking confirmed' };
};

const updateBookingStatus = async (booking_id, status, reason) => {
  if (!BOOKING_STATUSES.includes(status)) {
    throw new AppError(`Invalid status. Allowed values: ${BOOKING_STATUSES.join(', ')}`, 400);
  }
  
  if (status === 'COMPLETED') {
    throw new AppError('Strict Policy: Only the customer can approve and complete this service.', 403);
  }

  const booking = await ServiceBooking.findByPk(booking_id);
  if (!booking) throw new AppError('Booking not found', 404);

  booking.status = status;
  
  if (status === 'CANCELLED') {
    booking.cancelled_by = 'ADMIN';
    booking.cancellation_reason = reason || 'Cancelled by Admin';
  }

  await booking.save();

  return { message: 'Booking status updated successfully', booking };
};

const assignBooking = async (booking_id, assignmentData) => {
  const { technician_id, partner_id } = assignmentData;
  const booking = await ServiceBooking.findByPk(booking_id);
  if (!booking) throw new AppError('Booking not found', 404);

  if (technician_id) {
    booking.assigned_technician_id = technician_id;
  }
  if (partner_id) {
    booking.assigned_partner_id = partner_id;
  }

  if (['NEW', 'ACCEPTED', 'IN_PROGRESS', 'AWAITING_APPROVAL'].includes(booking.status)) {
    booking.status = 'ASSIGNED';
  }

  await booking.save();

  return { message: 'Booking assigned successfully', booking };
};

const JobProgress = require('./jobProgress.model');
const ExtraItemsRequest = require('./extraItemsRequest.model');

const getTechnicianBookings = async (technician_id) => {
  const bookings = await ServiceBooking.findAll({
    where: { assigned_technician_id: technician_id },
    include: [
      {
        model: Order,
        as: 'Order',
        attributes: ['order_number', 'customer_name', 'customer_contact', 'customer_address']
      },
      {
        model: Service,
        as: 'Service',
        attributes: ['id', 'name', 'image']
      },
      {
        model: JobProgress,
        as: 'progress_updates',
        attributes: ['id', 'technician_id', 'description', 'photos', 'update_type', 'createdAt']
      },
      {
        model: ExtraItemsRequest,
        as: 'extra_items',
        attributes: ['id', 'description', 'qty', 'status', 'metadata', 'createdAt']
      }
    ],
    order: [['scheduled_date', 'ASC'], ['createdAt', 'DESC']]
  });

  return bookings;
};

const getTechnicianBookingDetails = async (booking_id, technician_id) => {
  const booking = await ServiceBooking.findOne({
    where: { id: booking_id, assigned_technician_id: technician_id },
    include: [
      {
        model: Order,
        as: 'Order',
        attributes: ['order_number', 'customer_name', 'customer_contact', 'customer_address']
      },
      {
        model: Service,
        as: 'Service',
        attributes: ['id', 'name', 'image']
      }
    ]
  });

  if (!booking) throw new AppError('Booking not found or not assigned to you', 404);

  // Fetch history of progress independently so it doesn't limit to just this technician
  const history = await JobProgress.findAll({
    where: { booking_id },
    order: [['createdAt', 'ASC']]
  });
  
  const extraItems = await ExtraItemsRequest.findAll({
    where: { booking_id },
    order: [['createdAt', 'ASC']]
  });

  return {
    ...booking.toJSON(),
    progress_history: history,
    extra_items: extraItems
  };
};

const handleTechnicianAction = async (booking_id, technician_id, actionData) => {
  const { action, description, photos = [], extraItems = [] } = actionData;

  const booking = await ServiceBooking.findOne({
    where: { id: booking_id, assigned_technician_id: technician_id }
  });

  if (!booking) throw new AppError('Booking not found or not assigned to you', 404);

  let newStatus = booking.status;
  
  if (action === 'START_WORK') {
    if (booking.status !== 'ASSIGNED' && booking.status !== 'ACCEPTED') {
      throw new AppError(`Cannot start work from status: ${booking.status}`, 400);
    }
    newStatus = 'IN_PROGRESS';
  } else if (action === 'COMPLETE_WORK') {
    if (booking.status !== 'IN_PROGRESS') {
      throw new AppError(`Cannot complete work from status: ${booking.status}`, 400);
    }
    newStatus = 'AWAITING_APPROVAL';
  } else if (action === 'ADD_PROGRESS' || action === 'REQUEST_EXTRA_ITEMS') {
    if (booking.status !== 'IN_PROGRESS') {
      throw new AppError(`Job must be IN_PROGRESS to perform this action`, 400);
    }
  }

  // Update status if it changed
  if (newStatus !== booking.status) {
    booking.status = newStatus;
    await booking.save();
  }

  // Record Job Progress
  let progressDescription = description || `Action: ${action}`;
  if (action === 'REQUEST_EXTRA_ITEMS') {
    progressDescription = description ? `Requested Extra Items: ${description}` : `Requested Extra Items`;
  }
  
  const progressRecord = await JobProgress.create({
    booking_id,
    technician_id,
    description: progressDescription,
    photos,
    photo_public_ids: actionData.photo_public_ids || [],
    update_type: action === 'START_WORK' ? 'START' : (action === 'COMPLETE_WORK' ? 'COMPLETE' : 'PROGRESS')
  });

  // Handle Extra Items logic
  if (action === 'REQUEST_EXTRA_ITEMS' && extraItems.length > 0) {
    const extraItemsData = extraItems.map(item => ({
      booking_id,
      technician_id,
      description: item.description,
      qty: item.qty,
      metadata: item.metadata || null,
      status: 'PENDING'
    }));
    await ExtraItemsRequest.bulkCreate(extraItemsData);
  }

  return { 
    message: `Action ${action} recorded successfully`,
    status: booking.status,
    progressRecord 
  };
};

module.exports = {
  createBooking,
  getCustomerBookings,
  handleCustomerAction,
  getAdminBookings,
  verifyPayment,
  updateBookingStatus,
  assignBooking,
  getTechnicianBookings,
  getTechnicianBookingDetails,
  handleTechnicianAction
};
