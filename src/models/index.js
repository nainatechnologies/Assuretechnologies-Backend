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
};
