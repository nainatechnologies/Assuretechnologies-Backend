const { Order, OrderItem, Product, Customer, Vendor } = require('../../models');


const createOrder = async (req, res) => {
  try {
    const { items, customer_name, customer_contact, customer_address, payment_status } = req.body;
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

    const order_number = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);

    const order = await Order.create({
      order_number,
      customer_id,
      customer_name,
      customer_contact,
      customer_address,
      total_amount,
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
    const orders = await Order.findAll({
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'full_name', 'email', 'mobile'] },
        { 
          model: OrderItem, 
          as: 'items',
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
