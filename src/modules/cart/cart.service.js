const Cart = require('./cart.model');
const CartItem = require('./cartItem.model');
const Product = require('../product/product.model');
const AppError = require('../../utils/AppError');

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

const getCart = async (customerId) => {
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

  return { cartItems, total };
};

const addToCart = async (customerId, productId, quantity = 1) => {
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

  return { message: 'Added to cart' };
};

const updateCartItem = async (customerId, productId, quantity) => {
  const cart = await Cart.findOne({ where: { customer_id: customerId } });
  if (!cart) throw new AppError('Cart not found', 404);

  const item = await CartItem.findOne({ where: { cart_id: cart.id, product_id: productId } });
  if (!item) throw new AppError('Item not found in cart', 404);

  if (quantity <= 0) {
    await item.destroy();
  } else {
    item.quantity = quantity;
    await item.save();
  }

  return { message: 'Cart updated' };
};

const removeFromCart = async (customerId, productId) => {
  const cart = await Cart.findOne({ where: { customer_id: customerId } });
  if (!cart) throw new AppError('Cart not found', 404);

  await CartItem.destroy({ where: { cart_id: cart.id, product_id: productId } });

  return { message: 'Removed from cart' };
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart
};
