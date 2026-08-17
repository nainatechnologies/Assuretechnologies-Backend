const Cart = require('./cart.model');
const CartItem = require('./cartItem.model');
const Product = require('../product/product.model');

// Helper to format product data consistently
const formatProduct = (product) => {
  const p = product.toJSON ? product.toJSON() : product;
  const base = parseFloat(p.base_price) || 0;
  const disc = parseFloat(p.discount) || 0;
  const finalPrice = base - (base * (disc / 100));

  return {
    ...p,
    originalPrice: base,
    price: finalPrice,
    service: p.category || 'General',
    image: p.banner ? (p.banner.startsWith('http') || p.banner.startsWith('blob:') ? p.banner : `http://localhost:5000${p.banner.startsWith('/') ? '' : '/'}${p.banner}`) : 'https://placehold.co/300x200?text=No+Image'
  };
};

const getCart = async (req, res) => {
  try {
    const customerId = req.user.id;
    let cart = await Cart.findOne({ where: { customer_id: customerId } });
    if (!cart) {
      cart = await Cart.create({ customer_id: customerId });
    }

    // Fixed N+1 query issue by using include
    const items = await CartItem.findAll({ 
      where: { cart_id: cart.id },
      include: [{ model: Product }]
    });
    
    const cartItems = [];
    let total = 0;

    for (const item of items) {
      if (item.Product) {
        const formatted = formatProduct(item.Product);
        total += formatted.price * item.quantity;
        cartItems.push({
          id: item.id,
          product: formatted,
          quantity: item.quantity
        });
      }
    }

    res.status(200).json({ cartItems, total });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Server error while fetching cart' });
  }
};

const addToCart = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    let cart = await Cart.findOne({ where: { customer_id: customerId } });
    if (!cart) {
      cart = await Cart.create({ customer_id: customerId });
    }

    let item = await CartItem.findOne({ where: { cart_id: cart.id, product_id: productId } });
    if (item) {
      item.quantity += quantity;
      await item.save();
    } else {
      await CartItem.create({ cart_id: cart.id, product_id: productId, quantity });
    }

    res.status(200).json({ message: 'Added to cart' });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Server error while adding to cart' });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ where: { customer_id: customerId } });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = await CartItem.findOne({ where: { cart_id: cart.id, product_id: productId } });
    if (!item) return res.status(404).json({ message: 'Item not found in cart' });

    if (quantity <= 0) {
      await item.destroy();
    } else {
      item.quantity = quantity;
      await item.save();
    }

    res.status(200).json({ message: 'Cart updated' });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ message: 'Server error while updating cart' });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ where: { customer_id: customerId } });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    await CartItem.destroy({ where: { cart_id: cart.id, product_id: productId } });

    res.status(200).json({ message: 'Removed from cart' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Server error while removing from cart' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart
};
