require('dotenv').config();
const { sequelize } = require('./src/config/database');

async function fix() {
  try {
    await sequelize.query("ALTER TABLE Vendors ADD COLUMN pincode VARCHAR(10);");
    await sequelize.query("ALTER TABLE Vendors ADD COLUMN business_description TEXT;");
    await sequelize.query("ALTER TABLE Vendors ADD COLUMN bank_account_details TEXT;");
    console.log("Added pincode, business_description, bank_account_details to Vendors");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
fix();
