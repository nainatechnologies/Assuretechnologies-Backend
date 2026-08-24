const Admin = require('../modules/admin/admin.model');
const Customer = require('../modules/customer/customer.model');
const Vendor = require('../modules/vendor/vendor.model');
const Technician = require('../modules/technician/technician.model');
const Partner = require('../modules/partner/partner.model');
const Category = require('../modules/category/category.model');
const PartnerType = require('../modules/partner/partnerType.model');
const PricingType = require('../modules/partner/pricingType.model');
const Product = require('../modules/product/product.model');
const Order = require('../modules/order/order.model');
const OrderItem = require('../modules/order/orderItem.model');
const Cart = require('../modules/cart/cart.model');
const CartItem = require('../modules/cart/cartItem.model');
const Invoice = require('../modules/invoice/invoice.model');
const InvoiceItem = require('../modules/invoice/invoiceItem.model');

// Service Models
const Service = require('../modules/service/service.model');
const ServiceBooking = require('../modules/service/serviceBooking.model');
const JobProgress = require('../modules/service/jobProgress.model');
const ExtraItemsRequest = require('../modules/service/extraItemsRequest.model');

module.exports = {
  Admin,
  Customer,
  Vendor,
  Technician,
  Partner,
  Category,
  PartnerType,
  PricingType,
  Product,
  Order,
  OrderItem,
  Cart,
  CartItem,
  Invoice,
  InvoiceItem,
  Service,
  ServiceBooking,
  JobProgress,
  ExtraItemsRequest
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

// ==========================================
// Service Flow Relationships
// ==========================================

// ServiceBooking <-> Order
ServiceBooking.belongsTo(Order, { foreignKey: 'order_id' });
Order.hasMany(ServiceBooking, { foreignKey: 'order_id', as: 'service_bookings' });

// ServiceBooking <-> Service (Catalog)
ServiceBooking.belongsTo(Service, { foreignKey: 'service_id' });
Service.hasMany(ServiceBooking, { foreignKey: 'service_id' });

// ServiceBooking <-> Partner (Technician/Drone)
ServiceBooking.belongsTo(Partner, { foreignKey: 'assigned_partner_id', as: 'assigned_partner' });
Partner.hasMany(ServiceBooking, { foreignKey: 'assigned_partner_id', as: 'assigned_jobs' });

// Service (Unified Model) <-> PartnerType (Requirement)
Service.belongsTo(PartnerType, { foreignKey: 'required_partner_type_id', as: 'required_partner_type' });
PartnerType.hasMany(Service, { foreignKey: 'required_partner_type_id' });

// Service <-> PricingType
Service.belongsTo(PricingType, { foreignKey: 'pricing_type_id', as: 'pricing_type' });
PricingType.hasMany(Service, { foreignKey: 'pricing_type_id' });

// ServiceBooking <-> Internal Technician
ServiceBooking.belongsTo(Technician, { foreignKey: 'assigned_technician_id', as: 'assigned_technician' });
Technician.hasMany(ServiceBooking, { foreignKey: 'assigned_technician_id', as: 'technician_jobs' });

// ServiceBooking <-> JobProgress
JobProgress.belongsTo(ServiceBooking, { foreignKey: 'booking_id' });
ServiceBooking.hasMany(JobProgress, { foreignKey: 'booking_id', as: 'progress_updates' });

// ServiceBooking <-> ExtraItemsRequest
ExtraItemsRequest.belongsTo(ServiceBooking, { foreignKey: 'booking_id' });
ServiceBooking.hasMany(ExtraItemsRequest, { foreignKey: 'booking_id', as: 'extra_items' });
