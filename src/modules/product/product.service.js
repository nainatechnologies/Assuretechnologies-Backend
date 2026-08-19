const { Product, Vendor } = require('../../models');
const { Op } = require('sequelize');
const AppError = require('../../utils/AppError');

const getProducts = async (filters, pagination, user) => {
  const { search, stockStatus, sort } = filters;
  const { page, limit } = pagination;

  const whereClause = {};

  if (user && user.role === 'vendor') {
    whereClause.vendor_id = user.id;
  } else if (user && user.role === 'admin') {
    whereClause.vendor_id = null;
  }

  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { category: { [Op.like]: `%${search}%` } }
    ];
  }

  if (stockStatus === 'In Stock') {
    whereClause.stock = { [Op.gt]: 0 };
  } else if (stockStatus === 'Out of Stock') {
    whereClause.stock = 0;
  } else if (stockStatus === 'Low Stock') {
    whereClause.stock = { [Op.between]: [1, 9] };
  }

  let orderClause = [['auto_id', 'DESC']];

  if (sort === 'price-low') {
    orderClause = [[Product.sequelize.literal('(base_price - (base_price * (COALESCE(discount, 0) / 100)))'), 'ASC']];
  } else if (sort === 'price-high') {
    orderClause = [[Product.sequelize.literal('(base_price - (base_price * (COALESCE(discount, 0) / 100)))'), 'DESC']];
  } else if (sort === 'discount') {
    orderClause = [['discount', 'DESC']];
  }

  const offset = (page - 1) * limit;

  const { count, rows: products } = await Product.findAndCountAll({
    where: whereClause,
    include: [
      { model: Vendor, as: 'vendor', attributes: ['id', 'business_name', 'full_name'] }
    ],
    order: orderClause,
    limit,
    offset
  });

  const formattedProducts = products.map(p => {
    const product = p.toJSON ? p.toJSON() : p;
    const base = parseFloat(product.base_price) || 0;
    const disc = parseFloat(product.discount) || 0;
    const finalPrice = base - (base * (disc / 100));

    return {
      ...product,
      originalPrice: base,
      price: finalPrice,
      service: product.category || 'General',
      image: product.banner ? (product.banner.startsWith('http') || product.banner.startsWith('blob:') ? product.banner : `http://localhost:5000${product.banner.startsWith('/') ? '' : '/'}${product.banner}`) : 'https://placehold.co/300x200?text=No+Image'
    };
  });

  return {
    data: formattedProducts,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1
    }
  };
};

const createProduct = async (productData, user, file) => {
  const { name, category, base_price, discount, stock, description, status, admin_commission } = productData;
  
  let banner = productData.banner || '';
  if (file) {
    banner = `/uploads/products/${file.filename}`;
  }

  let vendor_id = null;
  let final_admin_commission = 0;

  if (user && user.role === 'vendor') {
    vendor_id = user.id;
    final_admin_commission = admin_commission || 0;
  }
  
  const product = await Product.create({
    vendor_id,
    name,
    category,
    base_price,
    discount: discount || 0,
    admin_commission: final_admin_commission,
    stock,
    banner,
    description,
    status: status || 'In Stock'
  });
  
  return product;
};

const updateProduct = async (id, updateData, user, file) => {
  if (file) {
    updateData.banner = `/uploads/products/${file.filename}`;
  }

  const whereClause = { id };
  if (user && user.role === 'vendor') {
    whereClause.vendor_id = user.id;
  }

  const product = await Product.findOne({ where: whereClause });
  if (!product) {
    throw new AppError('Product not found or unauthorized', 404);
  }
  
  if (user && user.role === 'vendor') {
    delete updateData.vendor_id;
  }

  await product.update(updateData);
  return product;
};

const deleteProduct = async (id, user) => {
  const whereClause = { id };
  if (user && user.role === 'vendor') {
    whereClause.vendor_id = user.id;
  }

  const product = await Product.findOne({ where: whereClause });
  if (!product) {
    throw new AppError('Product not found or unauthorized', 404);
  }
  
  await product.destroy();
  return { message: 'Product deleted successfully' };
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
};
