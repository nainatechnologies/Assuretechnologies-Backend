const { sequelize } = require('../config/database');
const Partner = require('../modules/partner/partner.model');
const PartnerType = require('../modules/partner/partnerType.model');
const Service = require('../modules/service/service.model');
const { hashPassword } = require('../utils/hash');

async function seedPartners() {
  try {
    // We will use a secure default password for all of them
    const defaultPassword = 'Password@123';
    const hashedPassword = await hashPassword(defaultPassword);

    console.log('Clearing existing dummy partners from the database...');
    // We remove truncate: true because MySQL blocks TRUNCATE when foreign keys (like ServiceBookings) exist.
    // Using a normal destroy deletes rows via standard DELETE command.
    const { Op } = require('sequelize');
    await Partner.destroy({ 
      where: { email: { [Op.like]: 'partner%@assure.com' } }
    });

    // Dynamically fetch all valid PartnerTypes
    const partnerTypes = await PartnerType.findAll();
    if (!partnerTypes || partnerTypes.length === 0) {
      console.error('❌ No PartnerTypes found in the DB! Please create at least one PartnerType first.');
      process.exit(1);
    }

    const partners = [];
    const baseNames = ['Rajesh Kumar', 'Anil Reddy', 'Priya Sharma', 'Venkat Rao', 'Sunita Verma'];
    const baseAreas = [
      ['500081', '500033', '507122'],
      ['500032', '500033', '507122'],
      ['500033', '500034', '507122'],
      ['500084', '500081', '507122'],
      ['500034', '500081', '507122']
    ];

    // Create 5 partners, distributing them evenly across the available partner types
    for (let i = 0; i < 5; i++) {
      // Select a partner type (round-robin if there are fewer partner types than partners)
      const pType = partnerTypes[i % partnerTypes.length];

      // Fetch services that strictly require this specific partner type
      const services = await Service.findAll({ 
        where: { required_partner_type_id: pType.id }
      });
      const serviceIds = services.map(s => s.id);

      partners.push({
        email: `partner${i+1}_${pType.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@assure.com`,
        mobile: `998877665${i+1}`,
        password_hash: hashedPassword,
        full_name: `${baseNames[i]} (${pType.name})`,
        address: `Address ${i+1}, Hyderabad, Telangana`,
        coverage_areas: baseAreas[i],
        services_provided: serviceIds,
        partner_type_id: pType.id,
        is_active: true,
        force_password_change: true,
        custom_field_values: {}
      });
    }

    console.log(`Inserting ${partners.length} partners distributed across ${partnerTypes.length} PartnerType(s)...`);
    await Partner.bulkCreate(partners);

    console.log('✅ Successfully inserted 5 partners!');
    console.log(`Default login password for all: ${defaultPassword}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error inserting partners:', error);
    process.exit(1);
  }
}

seedPartners();
