const Admin = require('../modules/admin/admin.model');
const { hashPassword } = require('../utils/hash');
const { connectDB, sequelize } = require('../config/database');
require('dotenv').config({ path: '../../.env' }); // Adjust if needed to ensure DB credentials load

const seedAdmin = async () => {
  try {
    await connectDB();
    
    // Ensure tables exist before trying to seed
    await sequelize.sync();

    const existingAdmin = await Admin.findOne({ where: { email: 'admin@assuretech.com' } });
    if (existingAdmin) {
      console.log('Super Admin already exists. Seeding skipped.');
      process.exit(0);
    }

    const password_hash = await hashPassword('Admin@123');

    await Admin.create({
      email: 'admin@assuretech.com',
      mobile: '9999999999',
      full_name: 'Super Admin',
      password_hash,
      is_active: true
    });

    console.log('✅ Super Admin created successfully!');
    console.log('Email: admin@assuretech.com');
    console.log('Password: Admin@123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Admin:', error);
    process.exit(1);
  }
};

seedAdmin();
