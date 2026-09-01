const Customer = require('../customer/customer.model');
const CustomerAddress = require('../customer/customerAddress.model');
const Order = require('../order/order.model');
const Vendor = require('../vendor/vendor.model');
const Technician = require('../technician/technician.model');
const Category = require('../category/category.model');
const VendorPayout = require('../vendor/vendorPayout.model');
const OrderItem = require('../order/orderItem.model');
const Product = require('../product/product.model');
const { hashPassword } = require('../../utils/hash');
const { Op, Sequelize } = require('sequelize');
const { sequelize } = require('../../config/database');
const AppError = require('../../utils/AppError');

const getVendors = async (page = 1, limit = 10, search = '') => {
  const offset = (page - 1) * limit;
  const whereClause = {};
  if (search) {
    whereClause[Op.or] = [
      { business_name: { [Op.like]: '%' + search + '%' } },
      { full_name: { [Op.like]: '%' + search + '%' } },
      { mobile: { [Op.like]: '%' + search + '%' } },
      { email: { [Op.like]: '%' + search + '%' } },
      { pincode: { [Op.like]: '%' + search + '%' } },
      { gst_number: { [Op.like]: '%' + search + '%' } }
    ];
  }

  const { count, rows } = await Vendor.findAndCountAll({
    where: whereClause,
    attributes: { exclude: ['password_hash'] },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return {
    data: rows,
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      limit
    }
  };
};

const getTechnicians = async (page = 1, limit = 10, search = '') => {
  const offset = (page - 1) * limit;
  const whereClause = {};
  if (search) {
    whereClause[Op.or] = [
      { full_name: { [Op.like]: '%' + search + '%' } },
      { mobile: { [Op.like]: '%' + search + '%' } },
      { email: { [Op.like]: '%' + search + '%' } },
      Sequelize.where(Sequelize.cast(Sequelize.col('service_pincodes'), 'CHAR'), { [Op.like]: '%' + search + '%' }),
      Sequelize.where(Sequelize.cast(Sequelize.col('services_provided'), 'CHAR'), { [Op.like]: '%' + search + '%' })
    ];
  }

  const { count, rows } = await Technician.findAndCountAll({
    where: whereClause,
    attributes: { exclude: ['password_hash'] },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return {
    data: rows,
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      limit
    }
  };
};

const createVendor = async (data, files) => {
  const { email, mobile, password, full_name, business_name, address, gst_number, pincode, business_description, bank_account_details } = data;

  const existingVendor = await Vendor.findOne({ where: { email } });
  if (existingVendor) throw new AppError('Email already registered', 400);

  const existingMobile = await Vendor.findOne({ where: { mobile } });
  if (existingMobile) throw new AppError('Mobile already registered', 400);

  const password_hash = await hashPassword(password);

  const aadhar_proof = files && files.aadhar_proof ? '/uploads/vendors/' + files.aadhar_proof[0].filename : null;
  const pan_proof = files && files.pan_proof ? '/uploads/vendors/' + files.pan_proof[0].filename : null;
  const shop_photo = files && files.shop_photo ? '/uploads/vendors/' + files.shop_photo[0].filename : null;

  const vendor = await Vendor.create({
    email, mobile, password_hash, full_name, business_name, address, gst_number,
    pincode, business_description, bank_account_details,
    aadhar_proof, pan_proof, shop_photo,
    is_active: true
  });

  return vendor;
};

const createTechnician = async (data, files) => {
  const { email, mobile, password, full_name, address, service_pincodes, services_provided } = data;

  const existingTechnician = await Technician.findOne({ where: { email } });
  if (existingTechnician) throw new AppError('Email already registered', 400);

  const existingMobile = await Technician.findOne({ where: { mobile } });
  if (existingMobile) throw new AppError('Mobile already registered', 400);

  const password_hash = await hashPassword(password);

  let parsed_service_pincodes = service_pincodes || [];
  if (typeof parsed_service_pincodes === 'string') {
    try { parsed_service_pincodes = JSON.parse(parsed_service_pincodes); } catch (e) { parsed_service_pincodes = parsed_service_pincodes.split(','); }
  }
  let parsed_services_provided = services_provided || [];
  if (typeof parsed_services_provided === 'string') {
    try { parsed_services_provided = JSON.parse(parsed_services_provided); } catch (e) { parsed_services_provided = parsed_services_provided.split(','); }
  }

  const id_proof = files && files.id_proof ? '/uploads/technicians/' + files.id_proof[0].filename : null;
  const noc_document = files && files.noc_document ? '/uploads/technicians/' + files.noc_document[0].filename : null;

  const technician = await Technician.create({
    email, mobile, password_hash, full_name, address,
    service_pincodes: parsed_service_pincodes,
    services_provided: parsed_services_provided,
    id_proof, noc_document,
    is_active: true
  });

  return technician;
};

const getCategories = async () => {
  return await Category.findAll({ order: [['name', 'ASC']] });
};

const createCategory = async (data) => {
  const { name, is_active } = data;
  return await Category.create({ name, is_active });
};

const getCustomers = async (page = 1, limit = 10, search = '') => {
  const offset = (page - 1) * limit;
  const whereClause = {};
  if (search) {
    const cleanSearch = search.trim();
    const cusMatch = cleanSearch.match(/^CUS-(\d+)$/i);
    const orConditions = [
      { full_name: { [Op.like]: '%' + cleanSearch + '%' } },
      { mobile: { [Op.like]: '%' + cleanSearch + '%' } },
      { email: { [Op.like]: '%' + cleanSearch + '%' } },
      { pincode: { [Op.like]: '%' + cleanSearch + '%' } },
      { state_name: { [Op.like]: '%' + cleanSearch + '%' } }
    ];
    if (cusMatch) {
      const autoId = parseInt(cusMatch[1], 10) - 1000;
      orConditions.push({ auto_id: autoId });
    } else if (!isNaN(cleanSearch)) {
      orConditions.push({ auto_id: parseInt(cleanSearch, 10) });
    }
    whereClause[Op.or] = orConditions;
  }

  const { count, rows } = await Customer.findAndCountAll({
    where: whereClause,
    attributes: { exclude: ['password_hash'] },
    include: [
      {
        model: Order,
        as: 'orders',
        attributes: ['id', 'order_number', 'total_amount', 'status', 'createdAt']
      },
      {
        model: CustomerAddress,
        as: 'addresses',
        attributes: ['id', 'full_name', 'mobile_number', 'pincode', 'address_line1', 'address_line2', 'city', 'state']
      }
    ],
    order: [['createdAt', 'DESC']],
    distinct: true,
    limit: Number(limit),
    offset: Number(offset)
  });

  const formattedCustomers = rows.map(c => {
    const json = c.toJSON();
    const orders = json.orders || [];
    const totalSpent = orders
      .filter(o => o.status !== 'CANCELLED' && o.status !== 'REJECTED')
      .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

    return {
      id: json.id,
      display_id: json.display_id || `CUS-${1000 + (json.auto_id || 1)}`,
      full_name: json.full_name,
      email: json.email,
      mobile: json.mobile,
      company_name: json.company_name || 'N/A',
      gst_number: json.gst_number || 'N/A',
      pincode: json.pincode,
      state_name: json.state_name,
      is_active: json.is_active,
      createdAt: json.createdAt,
      order_count: orders.length,
      ordersCount: orders.length,
      total_spent: Math.round(totalSpent * 100) / 100,
      totalSpent: Math.round(totalSpent * 100) / 100,
      addresses: json.addresses || [],
      orders: orders
    };
  });

  const [totalOrdersCount, totalCustomersCount, activeCustomersCount, inactiveCustomersCount] = await Promise.all([
    Order.count(),
    Customer.count(),
    Customer.count({ where: { is_active: true } }),
    Customer.count({ where: { is_active: false } })
  ]);

  return {
    data: formattedCustomers,
    summary: {
      totalCustomers: totalCustomersCount,
      activeUsers: activeCustomersCount,
      inactiveUsers: inactiveCustomersCount,
      totalOrders: totalOrdersCount
    },
    pagination: {
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      limit: Number(limit)
    }
  };
};

const getCustomerById = async (id) => {
  const customer = await Customer.findByPk(id, {
    attributes: { exclude: ['password_hash'] },
    include: [
      {
        model: Order,
        as: 'orders',
        include: [{ model: OrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }]
      },
      {
        model: CustomerAddress,
        as: 'addresses'
      }
    ]
  });

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  const json = customer.toJSON();
  const orders = json.orders || [];
  const totalSpent = orders
    .filter(o => o.status !== 'CANCELLED' && o.status !== 'REJECTED')
    .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

  return {
    ...json,
    ordersCount: orders.length,
    order_count: orders.length,
    totalSpent: Math.round(totalSpent * 100) / 100,
    total_spent: Math.round(totalSpent * 100) / 100
  };
};

const updateCustomerStatus = async (id, is_active) => {
  const customer = await Customer.findByPk(id);
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  await customer.update({ is_active: Boolean(is_active) });
  return customer;
};

const updateCustomer = async (id, updateData) => {
  const customer = await Customer.findByPk(id);
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  const { full_name, company_name, gst_number, pincode, state_name, is_active } = updateData;
  await customer.update({
    ...(full_name !== undefined && { full_name }),
    ...(company_name !== undefined && { company_name }),
    ...(gst_number !== undefined && { gst_number }),
    ...(pincode !== undefined && { pincode }),
    ...(state_name !== undefined && { state_name }),
    ...(is_active !== undefined && { is_active })
  });

  return customer;
};

// ==================== PAYMENTS & SETTLEMENTS ====================

const getPaymentSummary = async () => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Total Customer Inflow (Paid orders)
  const paidOrders = await Order.findAll({
    where: { payment_status: 'PAID' },
    attributes: ['total_amount', 'subtotal_amount', 'tax_amount', 'createdAt']
  });

  let totalCustomerPaid = 0;
  let todayCollection = 0;
  let thisWeekCollection = 0;
  let thisMonthCollection = 0;

  paidOrders.forEach(o => {
    const amt = parseFloat(o.total_amount || 0);
    const oDate = new Date(o.createdAt);
    totalCustomerPaid += amt;
    if (oDate >= startOfDay) todayCollection += amt;
    if (oDate >= startOfWeek) thisWeekCollection += amt;
    if (oDate >= startOfMonth) thisMonthCollection += amt;
  });

  // 2. Vendor Payouts Outflow
  const completedPayouts = await VendorPayout.findAll({
    where: { status: 'COMPLETED' },
    attributes: ['amount', 'createdAt']
  });

  let totalVendorSettled = 0;
  let thisMonthSettled = 0;

  completedPayouts.forEach(p => {
    const amt = parseFloat(p.amount || 0);
    const pDate = new Date(p.createdAt);
    totalVendorSettled += amt;
    if (pDate >= startOfMonth) thisMonthSettled += amt;
  });

  // 3. Pending Vendor Payouts
  const unpaidItems = await OrderItem.findAll({
    where: { is_vendor_paid: false },
    include: [{
      model: Order,
      as: 'order',
      where: { payment_status: 'PAID' },
      attributes: ['id', 'payment_status']
    }]
  });

  let totalPendingVendorPayout = 0;
  let totalAdminCommissionPending = 0;

  unpaidItems.forEach(item => {
    const subtotal = parseFloat(item.subtotal || 0);
    const commission = parseFloat(item.admin_commission || 0);
    totalPendingVendorPayout += (subtotal - commission > 0 ? subtotal - commission : subtotal);
    totalAdminCommissionPending += commission;
  });

  return {
    inflow: {
      totalCustomerPaid: Math.round(totalCustomerPaid * 100) / 100,
      todayCollection: Math.round(todayCollection * 100) / 100,
      thisWeekCollection: Math.round(thisWeekCollection * 100) / 100,
      thisMonthCollection: Math.round(thisMonthCollection * 100) / 100,
      paidOrdersCount: paidOrders.length
    },
    outflow: {
      totalVendorSettled: Math.round(totalVendorSettled * 100) / 100,
      thisMonthSettled: Math.round(thisMonthSettled * 100) / 100,
      settledPayoutsCount: completedPayouts.length
    },
    pending: {
      totalPendingVendorPayout: Math.round(totalPendingVendorPayout * 100) / 100,
      pendingItemsCount: unpaidItems.length,
      totalAdminCommissionPending: Math.round(totalAdminCommissionPending * 100) / 100
    }
  };
};

const getPaymentTransactions = async ({ page = 1, limit = 10, search = '', type = 'all' }) => {
  const offset = (page - 1) * limit;

  // 1. Incoming transactions (Customer Orders)
  const orderWhere = {};
  if (search) {
    orderWhere[Op.or] = [
      { order_number: { [Op.like]: '%' + search + '%' } },
      { customer_name: { [Op.like]: '%' + search + '%' } },
      { customer_contact: { [Op.like]: '%' + search + '%' } },
      { razorpay_payment_id: { [Op.like]: '%' + search + '%' } }
    ];
  }

  const orders = await Order.findAll({
    where: orderWhere,
    attributes: ['id', 'order_number', 'total_amount', 'payment_status', 'razorpay_payment_id', 'customer_name', 'customer_contact', 'createdAt'],
    order: [['createdAt', 'DESC']],
    limit: 200
  });

  const incoming = orders.map(o => ({
    id: o.order_number,
    date: o.createdAt ? o.createdAt.toISOString().split('T')[0] : '',
    rawDate: o.createdAt,
    type: 'incoming',
    referenceId: o.razorpay_payment_id || o.order_number,
    party: o.customer_name || 'Customer',
    contact: o.customer_contact || '',
    amount: parseFloat(o.total_amount || 0),
    method: o.razorpay_payment_id ? 'Razorpay (Online)' : 'Cash / Direct',
    status: o.payment_status ? o.payment_status.toLowerCase() : 'pending',
    proof_image: null,
    notes: `Customer Order #${o.order_number}`
  }));

  // 2. Outgoing transactions (Vendor Payouts)
  const payoutWhere = {};
  const payoutInclude = [{
    model: Vendor,
    as: 'vendor',
    attributes: ['id', 'business_name', 'full_name', 'mobile']
  }];

  if (search) {
    payoutWhere[Op.or] = [
      { payout_number: { [Op.like]: '%' + search + '%' } },
      { transaction_reference: { [Op.like]: '%' + search + '%' } }
    ];
  }

  const payouts = await VendorPayout.findAll({
    where: payoutWhere,
    include: payoutInclude,
    order: [['createdAt', 'DESC']],
    limit: 200
  });

  const outgoing = payouts.map(p => ({
    id: p.payout_number,
    date: p.createdAt ? p.createdAt.toISOString().split('T')[0] : '',
    rawDate: p.createdAt,
    type: 'outgoing',
    referenceId: p.transaction_reference || p.payout_number,
    party: p.vendor?.business_name || p.vendor?.full_name || 'Vendor',
    amount: parseFloat(p.amount || 0),
    method: p.payment_method || 'Bank Transfer',
    status: (p.status || 'COMPLETED').toLowerCase(),
    proof_image: p.proof_image ? `/uploads/payment_proofs/${p.proof_image}` : null,
    notes: p.transaction_reference || 'Vendor Settlement'
  }));

  let allTxns = [];
  if (type === 'incoming') {
    allTxns = incoming;
  } else if (type === 'outgoing') {
    allTxns = outgoing;
  } else {
    allTxns = [...incoming, ...outgoing];
  }

  allTxns.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

  const totalItems = allTxns.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginated = allTxns.slice(offset, offset + limit);

  return {
    data: paginated,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      limit
    }
  };
};

const getPendingPayouts = async (search = '') => {
  const items = await OrderItem.findAll({
    where: {
      vendor_id: { [Op.ne]: null },
      is_vendor_paid: false
    },
    include: [
      {
        model: Order,
        as: 'order',
        where: { payment_status: 'PAID' },
        attributes: ['id', 'order_number', 'payment_status', 'createdAt', 'razorpay_payment_id']
      },
      {
        model: Vendor,
        as: 'vendor',
        attributes: ['id', 'business_name', 'full_name', 'mobile', 'bank_account_details']
      },
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  let mapped = items.map(it => {
    const subtotal = parseFloat(it.subtotal || 0);
    const comm = parseFloat(it.admin_commission || 0);
    const owedAmount = subtotal - comm;
    return {
      id: it.id,
      orderId: it.order?.id,
      orderNumber: it.order?.order_number,
      vendorId: it.vendor_id,
      vendorName: it.vendor?.business_name || it.vendor?.full_name || 'Unknown Vendor',
      vendorMobile: it.vendor?.mobile,
      bankDetails: it.vendor?.bank_account_details,
      productName: it.product?.name,
      qty: it.qty,
      date: it.createdAt ? it.createdAt.toISOString().split('T')[0] : '',
      amount: subtotal,
      adminCommission: comm,
      netPayable: owedAmount > 0 ? owedAmount : subtotal,
      customerPaid: it.order?.payment_status === 'PAID',
      vendorPaid: it.is_vendor_paid,
      paymentMethod: it.order?.razorpay_payment_id ? 'online' : 'cod'
    };
  });

  if (search) {
    const q = search.toLowerCase();
    mapped = mapped.filter(m => 
      m.orderNumber?.toLowerCase().includes(q) ||
      m.vendorName?.toLowerCase().includes(q) ||
      m.productName?.toLowerCase().includes(q)
    );
  }

  return mapped;
};

const getVendorLedger = async (search = '') => {
  const vendors = await Vendor.findAll({
    where: { is_active: true },
    attributes: ['id', 'business_name', 'full_name', 'mobile', 'bank_account_details'],
    order: [['business_name', 'ASC']]
  });

  const unpaidItems = await OrderItem.findAll({
    where: {
      vendor_id: { [Op.ne]: null },
      is_vendor_paid: false
    },
    include: [
      {
        model: Order,
        as: 'order',
        attributes: ['id', 'order_number', 'payment_status', 'createdAt']
      },
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  let ledger = vendors.map(v => {
    const vItems = unpaidItems.filter(it => it.vendor_id === v.id);
    const paidByCustomerItems = vItems.filter(it => it.order?.payment_status === 'PAID');
    const unpaidByCustomerItems = vItems.filter(it => it.order?.payment_status !== 'PAID');

    const totalPendingCustomerPaid = paidByCustomerItems.reduce((sum, it) => {
      const sub = parseFloat(it.subtotal || 0);
      const comm = parseFloat(it.admin_commission || 0);
      return sum + (sub - comm > 0 ? sub - comm : sub);
    }, 0);

    const totalPendingCustomerUnpaid = unpaidByCustomerItems.reduce((sum, it) => {
      const sub = parseFloat(it.subtotal || 0);
      const comm = parseFloat(it.admin_commission || 0);
      return sum + (sub - comm > 0 ? sub - comm : sub);
    }, 0);

    return {
      vendorId: v.id,
      vendorName: v.business_name || v.full_name,
      mobile: v.mobile,
      bankDetails: v.bank_account_details,
      unpaidCount: vItems.length,
      pendingPayoutCount: paidByCustomerItems.length,
      totalPendingCustomerPaid: Math.round(totalPendingCustomerPaid * 100) / 100,
      totalPendingCustomerUnpaid: Math.round(totalPendingCustomerUnpaid * 100) / 100,
      orders: vItems.map(it => ({
        id: it.id,
        orderNumber: it.order?.order_number,
        productName: it.product?.name,
        qty: it.qty,
        date: it.createdAt ? it.createdAt.toISOString().split('T')[0] : '',
        amount: parseFloat(it.subtotal || 0),
        adminCommission: parseFloat(it.admin_commission || 0),
        customerPaid: it.order?.payment_status === 'PAID'
      }))
    };
  });

  if (search) {
    const q = search.toLowerCase();
    ledger = ledger.filter(l => l.vendorName.toLowerCase().includes(q) || (l.mobile && l.mobile.includes(q)));
  }

  return ledger;
};

const processVendorPayout = async ({ vendor_id, order_item_ids, amount, payment_method, transaction_reference, file }) => {
  if (!vendor_id) {
    throw new AppError('vendor_id is required', 400);
  }

  let itemIds = order_item_ids;
  if (typeof itemIds === 'string') {
    try {
      itemIds = JSON.parse(itemIds);
    } catch {
      itemIds = itemIds.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    throw new AppError('At least one order item ID is required for payout', 400);
  }

  const vendor = await Vendor.findByPk(vendor_id);
  if (!vendor) {
    throw new AppError('Vendor not found', 404);
  }

  const payout_number = `PAY-${Date.now().toString().slice(-6)}`;
  const proof_image = file ? file.filename : null;

  const t = await sequelize.transaction();
  try {
    const payout = await VendorPayout.create({
      payout_number,
      vendor_id,
      amount: parseFloat(amount || 0),
      payment_method: payment_method || 'Bank Transfer',
      transaction_reference: transaction_reference || null,
      proof_image,
      status: 'COMPLETED'
    }, { transaction: t });

    await OrderItem.update({
      is_vendor_paid: true,
      vendor_payout_id: payout.id,
      vendor_paid_at: new Date()
    }, {
      where: {
        id: { [Op.in]: itemIds },
        vendor_id
      },
      transaction: t
    });

    await t.commit();
    return payout;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

// ==================== DASHBOARD OVERVIEW STATS & ACTIVITY ====================

const getDashboardStats = async () => {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // 1. Total Revenue (Paid orders)
  const paidOrders = await Order.findAll({
    where: { payment_status: 'PAID' },
    attributes: ['total_amount', 'createdAt']
  });

  let totalRevenue = 0;
  let thisMonthRevenue = 0;
  let lastMonthRevenue = 0;

  paidOrders.forEach(o => {
    const amt = parseFloat(o.total_amount || 0);
    const date = new Date(o.createdAt);
    totalRevenue += amt;
    if (date >= startOfThisMonth) {
      thisMonthRevenue += amt;
    } else if (date >= startOfLastMonth && date <= endOfLastMonth) {
      lastMonthRevenue += amt;
    }
  });

  const calcTrend = (current, previous) => {
    if (previous === 0) {
      if (current === 0) return { trend: '0% from last month', isPositive: true };
      return { trend: '+100% from last month', isPositive: true };
    }
    const diff = ((current - previous) / previous) * 100;
    const sign = diff >= 0 ? '+' : '';
    return {
      trend: `${sign}${diff.toFixed(1)}% from last month`,
      isPositive: diff >= 0
    };
  };

  const revenueTrendObj = calcTrend(thisMonthRevenue, lastMonthRevenue);

  // 2. Active Users (Customers)
  const activeUsersCount = await Customer.count({
    where: { is_active: true }
  });

  const totalUsers = await Customer.findAll({
    attributes: ['createdAt']
  });

  let thisMonthUsers = 0;
  let lastMonthUsers = 0;
  totalUsers.forEach(u => {
    const date = new Date(u.createdAt);
    if (date >= startOfThisMonth) {
      thisMonthUsers++;
    } else if (date >= startOfLastMonth && date <= endOfLastMonth) {
      lastMonthUsers++;
    }
  });

  const usersTrendObj = calcTrend(thisMonthUsers, lastMonthUsers);

  // 3. Total Sales (Count of non-cancelled orders)
  const allOrders = await Order.findAll({
    where: { status: { [Op.ne]: 'CANCELLED' } },
    attributes: ['createdAt']
  });

  const totalSales = allOrders.length;
  let thisMonthSales = 0;
  let lastMonthSales = 0;
  allOrders.forEach(o => {
    const date = new Date(o.createdAt);
    if (date >= startOfThisMonth) {
      thisMonthSales++;
    } else if (date >= startOfLastMonth && date <= endOfLastMonth) {
      lastMonthSales++;
    }
  });

  const salesTrendObj = calcTrend(thisMonthSales, lastMonthSales);

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    revenueTrend: revenueTrendObj.trend,
    revenueGrowthPositive: revenueTrendObj.isPositive,
    activeUsers: activeUsersCount,
    usersTrend: usersTrendObj.trend,
    usersGrowthPositive: usersTrendObj.isPositive,
    totalSales,
    salesTrend: salesTrendObj.trend,
    salesGrowthPositive: salesTrendObj.isPositive
  };
};

const getRecentActivity = async (limit = 10) => {
  const orders = await Order.findAll({
    attributes: ['id', 'order_number', 'customer_name', 'total_amount', 'status', 'payment_status', 'createdAt'],
    include: [
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'full_name', 'email', 'mobile']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: Number(limit)
  });

  return orders.map(o => {
    const json = o.toJSON();
    return {
      id: json.id,
      order_number: json.order_number,
      customer_name: json.customer_name || json.customer?.full_name || 'Guest Customer',
      customer_email: json.customer?.email || '',
      customer_mobile: json.customer?.mobile || '',
      total_amount: parseFloat(json.total_amount || 0),
      status: json.status,
      payment_status: json.payment_status,
      createdAt: json.createdAt
    };
  });
};

module.exports = {
  getVendors,
  getTechnicians,
  createVendor,
  createTechnician,
  getCategories,
  createCategory,
  getCustomers,
  getCustomerById,
  updateCustomerStatus,
  updateCustomer,
  getPaymentSummary,
  getPaymentTransactions,
  getPendingPayouts,
  getVendorLedger,
  processVendorPayout,
  getDashboardStats,
  getRecentActivity
};
