const PricingType = require('../modules/partner/pricingType.model');
const PartnerType = require('../modules/partner/partnerType.model');
const Category = require('../modules/category/category.model');
const { connectDB, sequelize } = require('../config/database');
require('dotenv').config({ path: '../../.env' }); 

const pricingTypesToSeed = [
  { name: 'Per Acre', label: 'Number of Acres' },
  { name: 'Per Hour', label: 'Number of Hours' },
  { name: 'Per Liter', label: 'Number of Liters' }
];

const seedPricingAndPartnerTypes = async () => {
  try {
    await connectDB();
    await sequelize.sync();

    console.log('Starting PricingType and PartnerType seeding...\n');
    
    // 1. Seed Pricing Types
    let pricingCount = 0;
    for (const pt of pricingTypesToSeed) {
      const [pricingType, created] = await PricingType.findOrCreate({
        where: { name: pt.name },
        defaults: pt
      });
      if (created) {
        pricingCount++;
        console.log(`✅ Inserted PricingType: ${pt.name}`);
      } else {
        console.log(`⚡ PricingType already exists: ${pt.name}`);
      }
    }
    console.log(`🎉 Finished Pricing Types! (${pricingCount} new added)\n`);

    // 2. Seed Partner Types
    // First, we need to find the AgriTech category that you already seeded
    const agritechCategory = await Category.findOne({ where: { name: 'AgriTech' } });

    if (!agritechCategory) {
      console.log('❌ Could not find "AgriTech" category! Did you run categorySeeder.js?');
      process.exit(1);
    }

    const [partnerType, ptCreated] = await PartnerType.findOrCreate({
      where: { name: 'Drone Operator' },
      defaults: {
        name: 'Drone Operator',
        category_id: agritechCategory.id,
        custom_fields: []
      }
    });

    if (ptCreated) {
      console.log(`✅ Inserted PartnerType: Drone Operator (Linked to AgriTech)`);
    } else {
      console.log(`⚡ PartnerType already exists: Drone Operator`);
    }

    console.log(`\n🎉 All required test data is now seeded!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding:', error);
    process.exit(1);
  }
};

seedPricingAndPartnerTypes();
