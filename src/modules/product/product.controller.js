const { Product, Vendor } = require('../../models');

const getProducts = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const stockStatus = req.query.stockStatus || 'All'; // 'All', 'In Stock', 'Out of Stock', 'Low Stock'

    const whereClause = {};

    // Role filtering
    if (req.user && req.user.role === 'vendor') {
      whereClause.vendor_id = req.user.id;
    } else if (req.user && req.user.role === 'admin') {
      whereClause.vendor_id = null;
    }

    // Search filtering
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } }
      ];
    }

    // Stock filtering
    if (stockStatus === 'In Stock') {
      whereClause.stock = { [Op.gt]: 0 };
    } else if (stockStatus === 'Out of Stock') {
      whereClause.stock = 0;
    } else if (stockStatus === 'Low Stock') {
      whereClause.stock = { [Op.between]: [1, 9] };
    }

    const offset = (page - 1) * limit;

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      include: [
        { model: Vendor, as: 'vendor', attributes: ['id', 'business_name', 'full_name'] }
      ],
      order: [['auto_id', 'DESC']],
      limit,
      offset
    });

    res.status(200).json({
      data: products,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit) || 1
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, category, base_price, discount, stock, description, status, admin_commission } = req.body;
    
    let banner = req.body.banner || '';
    if (req.file) {
      banner = `/uploads/products/${req.file.filename}`;
    }

    let vendor_id = null;
    let final_admin_commission = 0;

    if (req.user && req.user.role === 'vendor') {
      vendor_id = req.user.id;
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
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error while creating product' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    if (req.file) {
      updateData.banner = `/uploads/products/${req.file.filename}`;
    }

    const whereClause = { id };
    if (req.user && req.user.role === 'vendor') {
      whereClause.vendor_id = req.user.id;
    }

    const product = await Product.findOne({ where: whereClause });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }
    
    // Prevent vendor from updating vendor_id
    if (req.user && req.user.role === 'vendor') {
      delete updateData.vendor_id;
    }

    await product.update(updateData);
    res.status(200).json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error while updating product' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const whereClause = { id };
    if (req.user && req.user.role === 'vendor') {
      whereClause.vendor_id = req.user.id;
    }

    const product = await Product.findOne({ where: whereClause });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }
    
    await product.destroy();
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error while deleting product' });
  }
};


const getVendorProducts = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const products = await Product.findAll({
      where: { vendor_id: { [Op.ne]: null } },
      include: [
        { model: Vendor, as: 'vendor', attributes: ['id', 'business_name', 'full_name'] }
      ],
      order: [['auto_id', 'DESC']]
    });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching vendor products:', error);
    res.status(500).json({ message: 'Server error while fetching vendor products' });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct
};


