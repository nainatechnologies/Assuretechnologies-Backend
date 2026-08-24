require('dotenv').config({ path: '../.env' });
const { sequelize } = require('../src/config/database');

async function cleanGhostIndexes() {
  try {
    console.log('⏳ Connecting to database...');
    await sequelize.authenticate();
    const dbName = sequelize.config.database;
    
    console.log(`🔍 Scanning database '${dbName}' for duplicate ghost indexes...`);

    // Fetch all indexes grouped by Table and Index Name, getting the exact columns they cover
    const [indexes] = await sequelize.query(`
      SELECT TABLE_NAME, INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as columns
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = '${dbName}' AND INDEX_NAME != 'PRIMARY'
      GROUP BY TABLE_NAME, INDEX_NAME
      ORDER BY INDEX_NAME ASC
    `);

    const seenSignatures = new Set();
    let droppedCount = 0;
    
    for (const idx of indexes) {
      // Signature example: "Admins:auto_id"
      const signature = `${idx.TABLE_NAME}:${idx.columns}`;
      
      if (seenSignatures.has(signature)) {
        // We already saw an index for these exact same columns on this table! 
        // This means this current index is a Sequelize "ghost" duplicate.
        console.log(`🧹 Dropping ghost index: [${idx.INDEX_NAME}] on table [${idx.TABLE_NAME}]`);
        try {
          await sequelize.query(`ALTER TABLE \`${idx.TABLE_NAME}\` DROP INDEX \`${idx.INDEX_NAME}\`;`);
          droppedCount++;
        } catch (e) {
          console.log(`⚠️ Failed to drop ${idx.INDEX_NAME}:`, e.message);
        }
      } else {
        // First time seeing an index for this specific column combination, keep it!
        seenSignatures.add(signature);
      }
    }
    
    console.log(`\n✅ Cleanup Complete! Successfully dropped ${droppedCount} ghost indexes.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to clean indexes:', error);
    process.exit(1);
  }
}

cleanGhostIndexes();
