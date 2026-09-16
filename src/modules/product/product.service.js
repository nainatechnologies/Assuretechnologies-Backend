const { Product, Vendor } = require('../../models');
const { deleteFromCloudinary } = require('../../utils/cloudinary');
const { Op } = require('sequelize');
const AppError = require('../../utils/AppError');

const formatSingleProduct = (p) => {
  const product = p.toJSON ? p.toJSON() : p;
  const base = parseFloat(product.base_price) || 0;
  const disc = parseFloat(product.discount) || 0;
  const finalPrice = base - (base * (disc / 100));

  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const image = product.banner
    ? (product.banner.startsWith('http') || product.banner.startsWith('blob:')
        ? product.banner
        : `${backendUrl}${product.banner.startsWith('/') ? '' : '/'}${product.banner}`)
    : 'https://placehold.co/300x200?text=No+Image';

  return {
    ...product,
    originalPrice: base,
    price: finalPrice,
    service: product.category || 'General',
    image
  };
};

const getProducts = async (filters, pagination, user) => {
  const { search, category, stockStatus, sort } = filters;
  const { page, limit } = pagination;

  const whereClause = {};
  
  if (category) {
    whereClause.category = category;
  }

  if (user && user.role === 'vendor') {
    whereClause.vendor_id = user.id;
  } else if (user && user.role === 'admin') {
    whereClause.vendor_id = null;
  }

  if (search) {
    const tokens = search.trim().split(/\s+/).filter(Boolean).slice(0, 8);
    if (tokens.length > 0) {
      whereClause[Op.and] = tokens.map(token => ({
        [Op.or]: [
          { name: { [Op.like]: `%${token}%` } },
          { category: { [Op.like]: `%${token}%` } },
          { description: { [Op.like]: `%${token}%` } }
        ]
      }));
    }
  }

  if (stockStatus === 'In Stock') {
    whereClause.stock = { [Op.gt]: 0 };
  } else if (stockStatus === 'Out of Stock') {
    whereClause.stock = 0;
  } else if (stockStatus === 'Low Stock') {
    whereClause.stock = { [Op.between]: [1, 9] };
  }

  let orderClause = [['auto_id', 'DESC']];

  if (sort === 'price-low' || sort === 'price-asc') {
    orderClause = [[Product.sequelize.literal('(base_price - (base_price * (COALESCE(discount, 0) / 100)))'), 'ASC']];
  } else if (sort === 'price-high' || sort === 'price-desc') {
    orderClause = [[Product.sequelize.literal('(base_price - (base_price * (COALESCE(discount, 0) / 100)))'), 'DESC']];
  } else if (sort === 'discount') {
    orderClause = [['discount', 'DESC']];
  } else if (sort === 'name' || sort === 'name-asc') {
    orderClause = [['name', 'ASC']];
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

  const formattedProducts = products.map(formatSingleProduct);

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

const getProductById = async (id) => {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  
  let product;
  if (isUUID) {
    product = await Product.findByPk(id, {
      include: [{ model: Vendor, as: 'vendor', attributes: ['id', 'business_name', 'full_name'] }]
    });
  } else {
    // Check by display_id format (e.g. PROD-1001) or auto_id
    const numericPart = id.replace(/^PROD-/i, '');
    const autoId = parseInt(numericPart, 10) - (id.toUpperCase().startsWith('PROD-') ? 1000 : 0);
    
    product = await Product.findOne({
      where: {
        [Op.or]: [
          { id },
          ...(isNaN(autoId) ? [] : [{ auto_id: autoId }])
        ]
      },
      include: [{ model: Vendor, as: 'vendor', attributes: ['id', 'business_name', 'full_name'] }]
    });
  }

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return formatSingleProduct(product);
};

const createProduct = async (productData, user, file) => {
  const { name, category, discount, stock, description, admin_commission } = productData;
  const base_price = productData.base_price !== undefined ? productData.base_price : productData.price;
  
  let banner = productData.banner || '';
  if (file) {
    banner = file.path;
  }

  let vendor_id = null;
  let final_admin_commission = 0;

  if (user && user.role === 'vendor') {
    vendor_id = user.id;
    final_admin_commission = admin_commission || 0;
  }

  let finalStatus = productData.status || 'In Stock';
  if (finalStatus === 'Active') finalStatus = 'In Stock';
  if (finalStatus === 'Inactive') finalStatus = 'Out of Stock';
  
  const product = await Product.create({
    vendor_id,
    name,
    category,
    base_price,
    discount: discount || 0,
    admin_commission: final_admin_commission,
    stock: stock || 0,
    banner,
    description: description || '',
    status: finalStatus
  });
  
  return product;
};

const updateProduct = async (id, updateData, user, file) => {
  if (file) {
    updateData.banner = file.path;
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

  if (updateData.price !== undefined && updateData.base_price === undefined) {
    updateData.base_price = updateData.price;
  }
  if (updateData.status === 'Active') updateData.status = 'In Stock';
  if (updateData.status === 'Inactive') updateData.status = 'Out of Stock';

  const oldBanner = product.banner;
  await product.update(updateData);

  // Cleanup old image from Cloudinary if a new one was uploaded
  if (file && oldBanner && oldBanner.includes('cloudinary.com')) {
    await deleteFromCloudinary(oldBanner);
  }

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
  
  const oldBanner = product.banner;
  
  await product.destroy();

  // Cleanup image from Cloudinary
  if (oldBanner && oldBanner.includes('cloudinary.com')) {
    await deleteFromCloudinary(oldBanner);
  }

  return { message: 'Product deleted successfully' };
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
