require('dotenv').config();
const { sequelize } = require('./src/config/database');

async function fix() {
  try {
    await sequelize.query("ALTER TABLE Vendors DROP COLUMN admin_commission_percent;");
    console.log("Dropped admin_commission_percent from Vendors");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
fix();
