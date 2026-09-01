const { Order, OrderItem, Product, Customer, Vendor, Cart, CartItem } = require('../../models');
const { sequelize } = require('../../config/database');
const AppError = require('../../utils/AppError');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const deductOrderStock = async (orderId, transaction = null) => {
  const items = await OrderItem.findAll({ where: { order_id: orderId }, transaction });
  const lowStockProducts = [];
  for (const item of items) {
    if (item.product_id) {
      const product = await Product.findByPk(item.product_id, { transaction });
      if (product) {
        product.stock = Math.max(0, (product.stock || 0) - item.qty);
        if (product.stock <= 0 && product.status === 'In Stock') {
          product.status = 'Out of Stock';
        }
        await product.save({ transaction });

        if (product.stock <= 10) {
          lowStockProducts.push({
            product_id: product.id,
            name: product.name,
            vendor_id: product.vendor_id,
            stock: product.stock
          });
        }
      }
    }
  }
  return { items, lowStockProducts };
};

const restoreOrderStock = async (orderId, transaction = null) => {
  const items = await OrderItem.findAll({ where: { order_id: orderId }, transaction });
  for (const item of items) {
    if (item.product_id) {
      const product = await Product.findByPk(item.product_id, { transaction });
      if (product) {
        product.stock = (product.stock || 0) + item.qty;
        if (product.stock > 0 && product.status === 'Out of Stock') {
          product.status = 'In Stock';
        }
        await product.save({ transaction });
      }
    }
  }
};

const finalizePaidOrder = async (order, { razorpay_order_id, razorpay_payment_id, razorpay_signature } = {}, transaction = null) => {
  const wasAlreadyPaid = order.payment_status === 'PAID';
  order.payment_status = 'PAID';
  if (razorpay_order_id) order.razorpay_order_id = razorpay_order_id;
  if (razorpay_payment_id) order.razorpay_payment_id = razorpay_payment_id;
  if (razorpay_signature) order.razorpay_signature = razorpay_signature;
  await order.save({ transaction });

  let lowStockProducts = [];
  // Deduct inventory stock if not already deducted
  if (!wasAlreadyPaid) {
    const res = await deductOrderStock(order.id, transaction);
    if (res && res.lowStockProducts) {
      lowStockProducts = res.lowStockProducts;
    }
  }

  // Clear customer cart only after payment is verified
  if (order.customer_id) {
    const cart = await Cart.findOne({ where: { customer_id: order.customer_id }, transaction });
    if (cart) {
      await CartItem.destroy({ where: { cart_id: cart.id }, transaction });
    }
  }

  // If newly marked as PAID, trigger real-time notifications for Admin & Vendors
  if (!wasAlreadyPaid) {
    try {
      const notificationService = require('../notification/notification.service');
      const orderItems = await OrderItem.findAll({ where: { order_id: order.id }, transaction });

      // 1. Alert Admin
      notificationService.createNotification({
        title: 'New Order Received',
        message: `Order #${order.order_number} placed by ${order.customer_name || 'Customer'} (₹${parseFloat(order.total_amount || 0).toFixed(2)})`,
        type: 'ORDER',
        action_url: '/admin/orders',
        target_role: 'admin',
        metadata: { order_id: order.id, order_number: order.order_number, total_amount: order.total_amount }
      });

      // 2. Alert each Vendor whose items are in this order
      const vendorMap = {};
      orderItems.forEach(item => {
        if (item.vendor_id) {
          if (!vendorMap[item.vendor_id]) vendorMap[item.vendor_id] = [];
          vendorMap[item.vendor_id].push(item);
        }
      });

      for (const [vId, vItems] of Object.entries(vendorMap)) {
        const vTotal = vItems.reduce((s, it) => s + (parseFloat(it.subtotal) || 0), 0);
        notificationService.createNotification({
          title: 'New Order Received',
          message: `You received a new order #${order.order_number} (${vItems.length} item${vItems.length > 1 ? 's' : ''}, ₹${vTotal.toFixed(2)})`,
          type: 'ORDER',
          action_url: '/orders',
          target_role: 'vendor',
          target_user_id: vId,
          metadata: { order_id: order.id, order_number: order.order_number, total_amount: vTotal }
        });
      }

      // 3. Alert Vendors & Admin for low stock items (<= 10 units)
      for (const lsp of lowStockProducts) {
        if (lsp.vendor_id) {
          notificationService.createNotification({
            title: 'Low Stock Alert',
            message: `Product "${lsp.name}" is low on stock (${lsp.stock} unit${lsp.stock === 1 ? '' : 's'} remaining).`,
            type: 'STOCK',
            action_url: '/products',
            target_role: 'vendor',
            target_user_id: lsp.vendor_id,
            metadata: { product_id: lsp.product_id, stock: lsp.stock }
          });
        }

        notificationService.createNotification({
          title: 'Low Stock Alert',
          message: `Product "${lsp.name}" is low on stock (${lsp.stock} unit${lsp.stock === 1 ? '' : 's'} remaining).`,
          type: 'STOCK',
          action_url: '/admin/stock',
          target_role: 'admin',
          metadata: { product_id: lsp.product_id, stock: lsp.stock, vendor_id: lsp.vendor_id }
        });
      }
    } catch (notifErr) {
      console.error('Failed to trigger order/stock notifications on payment finalization:', notifErr);
    }
  }

  return order;
};

const createOrder = async (orderData, user) => {
  const { items, customer_name, customer_contact, customer_address, company_name, gst_number } = orderData;
  let customer_id = null;

  if (user && user.role === 'customer') {
    customer_id = user.id;
  }

  if (!items || items.length === 0) {
    throw new AppError('No items in order', 400);
  }

  let total_amount = 0;
  const orderItemsData = [];

  const now = new Date();
  const datePart = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
  const timePart = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0');
  const randomPart = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  const order_number = 'ORD' + datePart + timePart + randomPart;

  const t = await sequelize.transaction();
  let order;

  try {
    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { transaction: t });
      if (!product) {
        throw new AppError(`Product not found: ${item.product_id}`, 404);
      }

      if ((product.stock || 0) < item.qty) {
        throw new AppError(`Insufficient stock for product "${product.name}". Available: ${product.stock || 0}`, 400);
      }

      const price = parseFloat(product.base_price);
      const discountAmount = price * ((parseFloat(product.discount) || 0) / 100);
      const finalPrice = price - discountAmount;
      const subtotal = finalPrice * item.qty;

      total_amount += subtotal;

      orderItemsData.push({
        product_id: product.id,
        vendor_id: product.vendor_id,
        qty: item.qty,
        price: finalPrice,
        admin_commission: product.admin_commission,
        subtotal
      });
    }

    const subtotal_amount = total_amount;
    const tax_amount = parseFloat((subtotal_amount * 0.18).toFixed(2));
    const final_total = subtotal_amount + tax_amount;

    order = await Order.create({
      order_number,
      customer_id,
      customer_name,
      customer_contact,
      customer_address,
      company_name,
      gst_number,
      subtotal_amount,
      tax_amount,
      total_amount: final_total,
      status: 'NEW',
      payment_status: 'PENDING'
    }, { transaction: t });

    const itemsWithOrderId = orderItemsData.map(item => ({ ...item, order_id: order.id }));
    await OrderItem.bulkCreate(itemsWithOrderId, { transaction: t });
    await t.commit();
  } catch (dbErr) {
    await t.rollback();
    throw dbErr;
  }

  // Create Razorpay standard order for Modal Checkout
  let razorpayOrderId = null;
  try {
    const razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: Math.round(order.total_amount * 100), // in paise
      currency: 'INR',
      receipt: order_number,
      notes: {
        order_number
      }
    });

    razorpayOrderId = razorpayOrder.id;
    order.razorpay_order_id = razorpayOrder.id;
    await order.save();
  } catch (rzpErr) {
    console.error('Razorpay order creation failed:', rzpErr.message || rzpErr);
  }

  return { message: 'Order created successfully', order, razorpayOrderId };
};

const getOrders = async (user) => {
  const whereClause = {};
  if (user && user.role === 'customer') {
    whereClause.customer_id = user.id;
  } else if (user && (user.role === 'admin' || user.role === 'vendor')) {
    whereClause.payment_status = 'PAID';
  }

  let itemWhereClause = undefined;
  let requiredVendor = false;
  if (user && user.role === 'vendor') {
    itemWhereClause = { vendor_id: user.id };
    requiredVendor = true;
  }

  const orders = await Order.findAll({
    where: whereClause,
    include: [
      {
        model: OrderItem,
        as: 'items',
        where: itemWhereClause,
        required: requiredVendor,
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'banner', 'base_price', 'discount']
          },
          {
            model: Vendor,
            as: 'vendor',
            attributes: ['id', 'business_name', 'email', 'mobile']
          }
        ]
      },
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'full_name', 'email', 'mobile']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  return orders;
};

const getOrderById = async (orderId) => {
  const order = await Order.findOne({
    where: { order_number: orderId },
    include: [
      {
        model: OrderItem,
        as: 'items',
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'banner', 'base_price', 'discount']
          },
          {
            model: Vendor,
            as: 'vendor',
            attributes: ['id', 'business_name', 'email', 'mobile']
          }
        ]
      },
      {
        model: Customer,
        as: 'customer',
        attributes: ['id', 'full_name', 'email', 'mobile']
      }
    ]
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  return order;
};

const splitOrderItem = async (orderId, itemId, splitData) => {
  const { newVendorId, qtyToTransfer } = splitData;

  const order = await Order.findOne({ where: { order_number: orderId } });
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const item = await OrderItem.findOne({
    where: { id: itemId, order_id: order.id }
  });

  if (!item) {
    throw new AppError('Order item not found', 404);
  }

  if (qtyToTransfer >= item.qty) {
    throw new AppError('Quantity to transfer must be less than current item quantity', 400);
  }

  if (newVendorId) {
    const vendor = await Vendor.findByPk(newVendorId);
    if (!vendor) {
      throw new AppError('New vendor not found', 404);
    }
  }

  const remainingQty = item.qty - qtyToTransfer;
  item.qty = remainingQty;
  item.subtotal = item.price * remainingQty;
  await item.save();

  const newItem = await OrderItem.create({
    order_id: order.id,
    product_id: item.product_id,
    vendor_id: newVendorId || null,
    qty: qtyToTransfer,
    price: item.price,
    admin_commission: item.admin_commission,
    subtotal: item.price * qtyToTransfer
  });

  return { message: 'Order item split successfully', originalItem: item, newItem };
};

const updateOrderStatus = async (orderId, updateData) => {
  const order = await Order.findOne({ where: { order_number: orderId } });
  if (!order) { throw new AppError('Order not found', 404); }

  if (['ACCEPTED', 'OUT_FOR_DELIVERY', 'COMPLETED'].includes(updateData.status) && order.payment_status !== 'PAID') {
    throw new AppError('Cannot accept or dispatch an order with unpaid payment status', 400);
  }

  if (updateData.status) { order.status = updateData.status; }
  await order.save();
  return { message: 'Order status updated successfully', order };
};

const cancelOrder = async (orderId, user) => {
  const order = await Order.findOne({ where: { order_number: orderId } });
  if (!order) { throw new AppError('Order not found', 404); }
  if (user.role !== 'admin' && order.customer_id !== user.id) { throw new AppError('Not authorized to cancel this order', 403); }
  if (order.status !== 'NEW' && order.status !== 'ACCEPTED') { throw new AppError('Order cannot be cancelled at this stage', 400); }
  
  const wasPaid = order.payment_status === 'PAID';
  order.status = 'CANCELLED';
  await order.save();

  // Restore inventory stock if this order was paid
  if (wasPaid) {
    await restoreOrderStock(order.id);
  }

  return { message: 'Order cancelled successfully', order };
};

const updateOrderTracking = async (orderId, trackingData, user) => {
  const order = await Order.findOne({ where: { order_number: orderId } });
  if (!order) { throw new AppError('Order not found', 404); }

  if (user.role === 'vendor') {
    const items = await OrderItem.findAll({ where: { order_id: order.id, vendor_id: user.id } });
    if (!items.length) { throw new AppError('Not authorized to update tracking for this order', 403); }
    await Promise.all(items.map(item => {
      item.transport_name = trackingData.transportName;
      item.tracking_id = trackingData.trackingId;
      item.tracking_url = trackingData.trackUrl;
      return item.save();
    }));
  } else if (user.role === 'admin') {
    if (trackingData.vendorId) {
      const items = await OrderItem.findAll({ where: { order_id: order.id, vendor_id: trackingData.vendorId } });
      if (!items.length) { throw new AppError('No items found for this vendor in this order', 404); }
      await Promise.all(items.map(item => {
        item.transport_name = trackingData.transportName;
        item.tracking_id = trackingData.trackingId;
        item.tracking_url = trackingData.trackUrl;
        return item.save();
      }));
    } else {
      const adminItems = await OrderItem.findAll({ where: { order_id: order.id, vendor_id: null } });
      if (adminItems.length) {
        await Promise.all(adminItems.map(item => {
          item.transport_name = trackingData.transportName;
          item.tracking_id = trackingData.trackingId;
          item.tracking_url = trackingData.trackUrl;
          return item.save();
        }));
      }
      order.transport_name = trackingData.transportName;
      order.tracking_id = trackingData.trackingId;
      order.tracking_url = trackingData.trackUrl;
      await order.save();
    }
  } else {
    throw new AppError('Not authorized to update tracking', 403);
  }

  return { message: 'Tracking info updated successfully', order };
};

const verifyPayment = async (paymentData, user) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, receipt_order_number } = paymentData;

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new AppError('Razorpay secret key not configured', 500);
  }

  const generated_signature = crypto
    .createHmac('sha256', secret)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest('hex');

  const isSignatureValid =
    generated_signature.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(generated_signature), Buffer.from(razorpay_signature));

  if (!isSignatureValid) {
    throw new AppError('Payment verification failed. Invalid signature.', 400);
  }

  // Find the order using the order_number passed in receipt_order_number
  const order = await Order.findOne({ where: { order_number: receipt_order_number } });
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Cross-order IDOR check: Verify that razorpay_order_id matches the order's generated Razorpay order ID
  if (order.razorpay_order_id && order.razorpay_order_id !== razorpay_order_id) {
    throw new AppError('Razorpay order ID mismatch. Payment rejected.', 400);
  }

  // Authorization check: Customer can only verify their own orders
  if (user && user.role === 'customer' && order.customer_id && order.customer_id !== user.id) {
    throw new AppError('Not authorized to verify payment for this order', 403);
  }

  const t = await sequelize.transaction();
  try {
    await finalizePaidOrder(order, { razorpay_order_id, razorpay_payment_id, razorpay_signature }, t);
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  return { success: true, message: 'Payment verified successfully', order };
};

const handlePaymentCallback = async (queryData) => {
  const {
    razorpay_payment_id,
    razorpay_payment_link_id,
    razorpay_payment_link_reference_id,
    razorpay_payment_link_status,
    razorpay_signature
  } = queryData;

  const orderNumber = razorpay_payment_link_reference_id;
  if (!orderNumber || !razorpay_payment_link_id || !razorpay_payment_id || !razorpay_signature) {
    return { success: false, orderNumber };
  }

  if (razorpay_payment_link_status !== 'paid') {
    return { success: false, orderNumber };
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return { success: false, orderNumber };
  }

  const payload = `${razorpay_payment_link_id}|${razorpay_payment_link_reference_id}|${razorpay_payment_link_status}|${razorpay_payment_id}`;
  const generated_signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const isSignatureValid =
    generated_signature.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(generated_signature), Buffer.from(razorpay_signature));

  if (!isSignatureValid) {
    return { success: false, orderNumber };
  }

  const order = await Order.findOne({ where: { order_number: orderNumber } });
  if (order) {
    const t = await sequelize.transaction();
    try {
      await finalizePaidOrder(order, { razorpay_payment_id, razorpay_signature }, t);
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  return { success: true, orderNumber };
};

const handleRazorpayWebhook = async (rawBody, signature) => {
  if (!signature) {
    throw new AppError('Missing x-razorpay-signature header', 400);
  }

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new AppError('Razorpay webhook secret not configured', 500);
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const isSignatureValid =
    generatedSignature.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(signature));

  if (!isSignatureValid) {
    throw new AppError('Invalid webhook signature', 400);
  }

  let event;
  try {
    event = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
  } catch (parseErr) {
    throw new AppError('Invalid webhook JSON body', 400);
  }

  // Process payment.captured or order.paid events
  if (event.event === 'payment.captured' || event.event === 'order.paid') {
    const paymentEntity = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;

    const orderNumber =
      orderEntity?.receipt ||
      paymentEntity?.notes?.order_number ||
      (paymentEntity?.description && paymentEntity.description.startsWith('Order #')
        ? paymentEntity.description.replace('Order #', '').trim()
        : null);

    if (orderNumber) {
      const order = await Order.findOne({ where: { order_number: orderNumber } });
      if (order) {
        // Idempotency: if already PAID, return smoothly without duplicate side effects
        if (order.payment_status === 'PAID') {
          return { success: true, message: `Order ${orderNumber} is already marked as PAID (Idempotent)` };
        }

        const t = await sequelize.transaction();
        try {
          await finalizePaidOrder(order, {
            razorpay_order_id: orderEntity?.id || paymentEntity?.order_id || order.razorpay_order_id,
            razorpay_payment_id: paymentEntity?.id || order.razorpay_payment_id
          }, t);
          await t.commit();
        } catch (err) {
          await t.rollback();
          throw err;
        }

        return { success: true, message: `Order ${orderNumber} successfully marked as PAID via Webhook` };
      }
    }
  }

  return { success: true, message: `Webhook event '${event.event}' processed` };
};

module.exports = {
  updateOrderTracking,
  cancelOrder,
  updateOrderStatus,
  createOrder,
  getOrders,
  splitOrderItem,
  getOrderById,
  verifyPayment,
  handlePaymentCallback,
  handleRazorpayWebhook
};
