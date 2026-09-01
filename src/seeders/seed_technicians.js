const { sequelize } = require('../config/database');
const Technician = require('../modules/technician/technician.model');
const { hashPassword } = require('../utils/hash');

async function seedTechnicians() {
  try {
    // We will use a secure default password for all of them
    const defaultPassword = 'Password@123';
    const hashedPassword = await hashPassword(defaultPassword);

    // Valid Service IDs fetched from your DB
    const farmInspectionId = '07087da4-a8c4-4b8b-a8e4-3eab670a8da9';
    const networkingServiceId = '7572335a-3d57-4d15-9a9e-ab23be10a4ca';
    const farmInspectionTypoId = 'dfa403e9-5a01-4f66-a68e-7d1b8e83051b';

    const technicians = [
      {
        email: 'tech1@assure.com',
        mobile: '9876543211',
        password_hash: hashedPassword,
        full_name: 'Rahul Sharma',
        address: 'H.No 12, Madhapur, Hyderabad, Telangana',
        service_pincodes: ['500081', '500033', '507122'],
        services_provided: [farmInspectionId],
        is_active: true,
        force_password_change: true
      },
      {
        email: 'tech2@assure.com',
        mobile: '9876543212',
        password_hash: hashedPassword,
        full_name: 'Suresh Kumar',
        address: 'Flat 302, Gachibowli, Hyderabad, Telangana',
        service_pincodes: ['500032', '500033', '507122'],
        services_provided: [networkingServiceId],
        is_active: true,
        force_password_change: true
      },
      {
        email: 'tech3@assure.com',
        mobile: '9876543213',
        password_hash: hashedPassword,
        full_name: 'Amit Patel',
        address: 'Plot 45, Jubilee Hills, Hyderabad, Telangana',
        service_pincodes: ['500033', '500034', '507122'],
        services_provided: [farmInspectionId, networkingServiceId],
        is_active: true,
        force_password_change: true
      },
      {
        email: 'tech4@assure.com',
        mobile: '9876543214',
        password_hash: hashedPassword,
        full_name: 'Vikram Singh',
        address: 'Apt 101, Kondapur, Hyderabad, Telangana',
        service_pincodes: ['500084', '500081', '507122'],
        services_provided: [farmInspectionId, farmInspectionTypoId],
        is_active: true,
        force_password_change: true
      },
      {
        email: 'tech5@assure.com',
        mobile: '9876543215',
        password_hash: hashedPassword,
        full_name: 'Manoj Reddy',
        address: 'Villa 5, Banjara Hills, Hyderabad, Telangana',
        service_pincodes: ['500034', '500081', '507122'],
        services_provided: [networkingServiceId],
        is_active: true,
        force_password_change: true
      }
    ];

    console.log('Inserting 5 technicians...');
    await Technician.bulkCreate(technicians);

    console.log('✅ Successfully inserted 5 technicians!');
    console.log(`Default login password for all: ${defaultPassword}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error inserting technicians:', error);
    process.exit(1);
  }
}

seedTechnicians();


