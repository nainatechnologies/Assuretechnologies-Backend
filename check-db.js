require('dotenv').config();
const { sequelize } = require('./src/config/database');

async function check() {
  try {
    const [results, metadata] = await sequelize.query("DESCRIBE Technicians;");
    console.log("Technicians table:");
    console.log(results);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
check();
