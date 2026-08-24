const Category = require('../modules/category/category.model');
const { connectDB, sequelize } = require('../config/database');
require('dotenv').config({ path: '../../.env' }); 

const categoriesToSeed = [
  'Networking',
  'Automation',
  'AgriTech',
  'Surveillance',
  'Telephony',
  'Intercom',
  'Biometrics',
  'Communication',
  'Infrastructure',
  'IT Support',
  'Solar',
  'IIoT',
  'Security',
  'Sensors',
  'Agriculture',
  'Fiber Optics'
];

const seedCategories = async () => {
  try {
    await connectDB();
    await sequelize.sync();

    console.log('Starting category seeding...');
    
    let insertedCount = 0;
    
    for (const catName of categoriesToSeed) {
      const [category, created] = await Category.findOrCreate({
        where: { name: catName },
        defaults: { 
          name: catName,
          status: 'ACTIVE',
          description: `Category for ${catName}`
        }
      });
      
      if (created) {
        insertedCount++;
        console.log(`✅ Inserted: ${catName}`);
      } else {
        console.log(`⚡ Already exists: ${catName}`);
      }
    }

    console.log(`\n🎉 Seeding complete! ${insertedCount} new categories added.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();
