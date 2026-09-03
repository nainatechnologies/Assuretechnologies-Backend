const { sequelize } = require('../src/config/database');

async function cleanupGhostIndexes(dryRun = false) {
  try {
    console.log(`\n🧹 --- Starting Ghost Duplicate Index Cleanup ${dryRun ? '(DRY RUN)' : ''} ---`);
    const [tables] = await sequelize.query('SHOW TABLES');
    const dbNameKey = Object.keys(tables[0])[0];

    let totalDropped = 0;

    for (const row of tables) {
      const tableName = row[dbNameKey];
      const [indexes] = await sequelize.query(`SHOW INDEX FROM \`${tableName}\``);
      
      const indexNames = [...new Set(indexes.map(i => i.Key_name))];
      const duplicatesToDrop = [];

      // Match ghost indexes created by Sequelize sync({ alter: true }):
      // Pattern: ends with _2, _3, _4, ..., _64 (e.g., auto_id_2, email_3, mobile_4)
      const duplicatePattern = /_\d+$/;

      for (const idx of indexNames) {
        if (idx === 'PRIMARY') continue; // Never drop primary key
        if (duplicatePattern.test(idx)) {
          duplicatesToDrop.push(idx);
        }
      }

      if (duplicatesToDrop.length > 0) {
        console.log(`\n📋 Table [${tableName}]: Found ${duplicatesToDrop.length} ghost duplicate indexes.`);
        
        for (const dropIdx of duplicatesToDrop) {
          const dropQuery = `ALTER TABLE \`${tableName}\` DROP INDEX \`${dropIdx}\``;
          if (dryRun) {
            console.log(`   [DRY RUN] Would execute: ${dropQuery}`);
          } else {
            try {
              await sequelize.query(dropQuery);
              console.log(`   ✓ Dropped index: ${dropIdx}`);
              totalDropped++;
            } catch (err) {
              console.error(`   ✗ Failed to drop index ${dropIdx}:`, err.message);
            }
          }
        }
      }
    }

    console.log(`\n✨ Done! Total duplicate indexes ${dryRun ? 'found' : 'removed'}: ${totalDropped}`);
  } catch (error) {
    console.error('Error during index cleanup:', error);
  } finally {
    process.exit(0);
  }
}

// Check command line arg for dry run (e.g. node cleanup_ghost_indexes.js --dry-run)
const isDryRun = process.argv.includes('--dry-run');
cleanupGhostIndexes(isDryRun);
