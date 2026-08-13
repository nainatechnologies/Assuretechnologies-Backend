const { Order, OrderItem, Product, Customer, Vendor } = require('../../models');

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

module.exports = {
  getOrders,
  splitOrderItem
};
