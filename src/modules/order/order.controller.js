const { Order, OrderItem, Product, Customer, Vendor } = require('../../models');


const createOrder = async (req, res) => {
  try {
    const { items, customer_name, customer_contact, customer_address, payment_status, company_name, gst_number } = req.body;
    let customer_id = null;

    if (req.user && req.user.role === 'customer') {
      customer_id = req.user.id;
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    let total_amount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await Product.findByPk(item.product_id);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.product_id}` });
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

    const now = new Date();
    const datePart = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
    const timePart = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0');
    const randomPart = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const order_number = 'ORD' + datePart + timePart + randomPart;

    const subtotal_amount = total_amount;
    const tax_amount = parseFloat((subtotal_amount * 0.18).toFixed(2));
    const final_total = subtotal_amount + tax_amount;

    const order = await Order.create({
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
      payment_status: payment_status || 'PENDING'
    });

    for (const orderItem of orderItemsData) {
      orderItem.order_id = order.id;
      await OrderItem.create(orderItem);
    }

    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error while creating order' });
  }
};


const getOrders = async (req, res) => {
  try {
    const whereClause = {};
    if (req.user && req.user.role === 'customer') {
      whereClause.customer_id = req.user.id;
    }
    
    let itemWhereClause = undefined;
    let requiredVendor = false;
    if (req.user && req.user.role === 'vendor') {
      itemWhereClause = { vendor_id: req.user.id };
      requiredVendor = true;
    }
    
    const orders = await Order.findAll({
      where: whereClause,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'full_name', 'email', 'mobile'] },
        { 
          model: OrderItem, 
          as: 'items',
          where: itemWhereClause,
          required: requiredVendor,
          include: [
            { model: Product, as: 'product', attributes: ['id', 'name', 'category'] },
            { model: Vendor, as: 'vendor', attributes: ['id', 'business_name', 'full_name'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error while fetching orders' });
  }
};
const splitOrderItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { newVendorId, qtyToTransfer } = req.body;
    
    // Find original order item
    const originalItem = await OrderItem.findOne({
      where: { id: itemId, order_id: orderId }
    });
    
    if (!originalItem) {
      return res.status(404).json({ message: 'Order item not found' });
    }
    
    if (qtyToTransfer <= 0 || qtyToTransfer > originalItem.qty) {
      return res.status(400).json({ message: 'Invalid quantity to transfer' });
    }
    
    if (qtyToTransfer === originalItem.qty) {
      // Just reassign the whole item
      originalItem.vendor_id = newVendorId;
      await originalItem.save();
    } else {
      // Create new split item
      const unitPrice = originalItem.price;
      const unitCommission = originalItem.admin_commission;
      
      const newSubtotal = parseFloat((unitPrice * qtyToTransfer).toFixed(2));
      
      await OrderItem.create({
        order_id: orderId,
        product_id: originalItem.product_id,
        vendor_id: newVendorId,
        qty: qtyToTransfer,
        price: unitPrice,
        admin_commission: unitCommission,
        subtotal: newSubtotal
      });
      
      // Update original item
      originalItem.qty -= qtyToTransfer;
      originalItem.subtotal = parseFloat((unitPrice * originalItem.qty).toFixed(2));
      await originalItem.save();
    }
    
    res.status(200).json({ message: 'Order split successfully' });
  } catch (error) {
    console.error('Error splitting order item:', error);
    res.status(500).json({ message: 'Server error while splitting order item' });
  }
};


const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({
      where: { order_number: orderId },
      include: [
        { model: OrderItem, as: 'items', include: ['product', 'vendor'] }
      ]
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getOrderById,
  createOrder,
  getOrders,
  splitOrderItem
};


