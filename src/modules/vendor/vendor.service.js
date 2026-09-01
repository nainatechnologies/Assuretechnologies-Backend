const Vendor = require('./vendor.model');
const Product = require('../product/product.model');
const Order = require('../order/order.model');
const OrderItem = require('../order/orderItem.model');
const Customer = require('../customer/customer.model');
const VendorPayout = require('./vendorPayout.model');
const AppError = require('../../utils/AppError');
const { Op } = require('sequelize');

const getProfile = async (vendorId) => {
  const vendor = await Vendor.findByPk(vendorId, {
    attributes: [
      'id', 'display_id', 'full_name', 'business_name', 'email', 'mobile',
      'address', 'gst_number', 'pincode', 'business_description', 'is_active'
    ]
  });

  if (!vendor) {
    throw new AppError('Vendor not found', 404);
  }

  return vendor;
};

const updateProfile = async (vendorId, updateData) => {
  const vendor = await Vendor.findByPk(vendorId);

  if (!vendor) {
    throw new AppError('Vendor not found', 404);
  }

  const safeData = {
    ...(updateData.full_name && { full_name: updateData.full_name }),
    ...(updateData.business_name && { business_name: updateData.business_name }),
    ...(updateData.gst_number && { gst_number: updateData.gst_number }),
    ...(updateData.address && { address: updateData.address }),
    ...(updateData.pincode && { pincode: updateData.pincode }),
    ...(updateData.business_description && { business_description: updateData.business_description })
  };

  await vendor.update(safeData);

  return {
    message: 'Profile updated successfully',
    vendor: {
      id: vendor.id,
      display_id: vendor.display_id,
      full_name: vendor.full_name,
      business_name: vendor.business_name,
      email: vendor.email,
      mobile: vendor.mobile,
      address: vendor.address,
      gst_number: vendor.gst_number,
      pincode: vendor.pincode,
      business_description: vendor.business_description,
      is_active: vendor.is_active
    }
  };
};

const getDashboardStats = async (vendorId) => {
  const totalProducts = await Product.count({ where: { vendor_id: vendorId } });

  const lowStockAlerts = await Product.count({
    where: {
      vendor_id: vendorId,
      stock: { [Op.lt]: 10 }
    }
  });

  const pendingOrders = await OrderItem.count({
    where: { vendor_id: vendorId },
    include: [{
      model: Order,
      as: 'order',
      where: { status: 'NEW', payment_status: 'PAID' }
    }],
    distinct: true,
    col: 'order_id'
  });

  const deliveredOrders = await OrderItem.count({
    where: { vendor_id: vendorId },
    include: [{
      model: Order,
      as: 'order',
      where: { status: 'COMPLETED', payment_status: 'PAID' }
    }],
    distinct: true,
    col: 'order_id'
  });

  return {
    totalProducts,
    pendingOrders,
    deliveredOrders,
    lowStockAlerts
  };
};

const getRecentOrders = async (vendorId) => {
  const orders = await Order.findAll({
    where: { payment_status: 'PAID' },
    include: [
      {
        model: OrderItem,
        as: 'items',
        where: { vendor_id: vendorId },
        required: true,
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name']
          }
        ]
      },
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'full_name', 'email', 'mobile']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: 5
  });

  return orders;
};

const getPayoutsOverview = async (vendorId) => {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const completedPayouts = await VendorPayout.findAll({
    where: {
      vendor_id: vendorId,
      status: 'COMPLETED'
    },
    attributes: ['amount', 'createdAt']
  });

  let receivedThisWeek = 0;
  let receivedThisMonth = 0;
  let receivedThisYear = 0;

  completedPayouts.forEach(p => {
    const amt = parseFloat(p.amount || 0);
    const pDate = new Date(p.createdAt);

    if (pDate >= sevenDaysAgo) receivedThisWeek += amt;
    if (pDate >= startOfMonth) receivedThisMonth += amt;
    if (pDate >= startOfYear) receivedThisYear += amt;
  });

  const unpaidItems = await OrderItem.findAll({
    where: {
      vendor_id: vendorId,
      is_vendor_paid: false
    },
    include: [{
      model: Order,
      as: 'order',
      where: { payment_status: 'PAID' }
    }]
  });

  const totalPendingAmount = unpaidItems.reduce((sum, it) => {
    const sub = parseFloat(it.subtotal || 0);
    const comm = parseFloat(it.admin_commission || 0);
    return sum + (sub - comm > 0 ? sub - comm : sub);
  }, 0);

  return {
    receivedThisWeek: Math.round(receivedThisWeek * 100) / 100,
    receivedThisMonth: Math.round(receivedThisMonth * 100) / 100,
    receivedThisYear: Math.round(receivedThisYear * 100) / 100,
    totalPendingAmount: Math.round(totalPendingAmount * 100) / 100
  };
};

const getPayoutOrders = async (vendorId) => {
  const items = await OrderItem.findAll({
    where: { vendor_id: vendorId },
    include: [
      {
        model: Order,
        as: 'order',
        where: { payment_status: 'PAID' },
        attributes: ['id', 'order_number', 'createdAt', 'customer_name', 'customer_contact', 'status', 'payment_status', 'updatedAt']
      },
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name']
      },
      {
        model: VendorPayout,
        as: 'payout',
        attributes: ['id', 'payout_number', 'amount', 'payment_method', 'transaction_reference', 'proof_image', 'status', 'createdAt']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  return items.map(item => {
    const subtotal = parseFloat(item.subtotal || 0);
    const comm = parseFloat(item.admin_commission || 0);
    const netAmount = subtotal - comm > 0 ? subtotal - comm : subtotal;

    return {
      id: item.id,
      orderNumber: item.order?.order_number || item.id,
      orderDate: item.order?.createdAt ? item.order.createdAt.toISOString().split('T')[0] : '',
      rawOrderDate: item.order?.createdAt,
      product: item.product?.name || 'Product',
      quantity: item.qty,
      customer: item.order?.customer_name || 'Store Customer',
      customerNumber: item.order?.customer_contact || '—',
      deliveryDate: item.order?.status === 'COMPLETED' 
        ? (item.order.updatedAt ? item.order.updatedAt.toISOString().split('T')[0] : 'Delivered') 
        : 'In Progress',
      amount: netAmount,
      grossAmount: subtotal,
      adminCommission: comm,
      status: item.is_vendor_paid ? 'Completed' : 'Pending Admin Payout',
      adminReceived: item.order?.payment_status === 'PAID',
      vendorReceived: item.is_vendor_paid,
      proofFileName: item.payout?.proof_image || null,
      proofUrl: item.payout?.proof_image ? ('/uploads/payment_proofs/' + item.payout.proof_image) : null,
      referenceNote: item.payout?.transaction_reference || (item.is_vendor_paid ? 'Settled by Admin' : 'Pending Admin Payout'),
      paymentDate: item.vendor_paid_at ? item.vendor_paid_at.toISOString().split('T')[0] : (item.payout?.createdAt ? item.payout.createdAt.toISOString().split('T')[0] : null)
    };
  });
};

module.exports = {
  getProfile,
  updateProfile,
  getDashboardStats,
  getRecentOrders,
  getPayoutsOverview,
  getPayoutOrders
};
