const Admin = require('../modules/admin/admin.model');
const Customer = require('../modules/customer/customer.model');
const Vendor = require('../modules/vendor/vendor.model');
const Technician = require('../modules/technician/technician.model');
const Partner = require('../modules/partner/partner.model');
const PartnerType = require('../modules/partner/partnerType.model');
const PricingType = require('../modules/partner/pricingType.model');
const Product = require('../modules/product/product.model');
const Order = require('../modules/order/order.model');
const OrderItem = require('../modules/order/orderItem.model');
const Cart = require('../modules/cart/cart.model');
const CartItem = require('../modules/cart/cartItem.model');
const Invoice = require('../modules/invoice/invoice.model');
const InvoiceItem = require('../modules/invoice/invoiceItem.model');
const { JobPosting, JobApplication } = require('../modules/career/career.model');

module.exports = {
  Admin,
  Customer,
  Vendor,
  Technician,
  Partner,
  PartnerType,
  PricingType,
  Product,
  Order,
  OrderItem,
  Cart,
  CartItem,
  Invoice,
  InvoiceItem,
  JobPosting,
  JobApplication,
};

Customer.hasOne(Cart, { foreignKey: 'customer_id' });
Cart.belongsTo(Customer, { foreignKey: 'customer_id' });

Cart.hasMany(CartItem, { foreignKey: 'cart_id', as: 'items' });
CartItem.belongsTo(Cart, { foreignKey: 'cart_id' });

Product.hasMany(CartItem, { foreignKey: 'product_id' });
CartItem.belongsTo(Product, { foreignKey: 'product_id' });

Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id', as: 'items' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id' });

Invoice.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
Vendor.hasMany(Invoice, { foreignKey: 'vendor_id' });
