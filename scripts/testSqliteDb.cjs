const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function testDatabase() {
  const SQL = await initSqlJs();
  const dbBuffer = fs.readFileSync(path.join(__dirname, '../translations.db'));
  const db = new SQL.Database(dbBuffer);

  const testQueries = [
    'this is a cow',
    "I couldn't solve it.",
    'lock the door.',
    'The tea is very hot.',
    'I will study after dinner.'
  ];

  console.log('🧪 Starting SQLite Database Verification with sample rows...\n');

  for (const q of testQueries) {
    const cleanQ = q.toLowerCase().replace(/[?!.,;]/g, '').trim();
    const stmt = db.prepare(`
      SELECT id, english, hindi, santali, santali_roman, category, verified 
      FROM translations 
      WHERE LOWER(english) LIKE ? 
      LIMIT 1;
    `);
    stmt.bind([`%${cleanQ}%`]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      console.log(`✅ [Query]: "${q}"`);
      console.log(`   - ID: ${row.id}`);
      console.log(`   - English: ${row.english}`);
      console.log(`   - Hindi: ${row.hindi}`);
      console.log(`   - Santali (Ol Chiki): ${row.santali}`);
      console.log(`   - Santali Pronunciation: ${row.santali_roman}`);
      console.log(`   - Category: ${row.category}`);
      console.log(`   - Verified: ${row.verified}\n`);
    } else {
      console.log(`❌ [Query Failed]: "${q}"\n`);
    }
    stmt.free();
  }

  // Count check
  const countRes = db.exec("SELECT COUNT(*) as total FROM translations;");
  console.log(`📊 Total rows in translations.db: ${countRes[0].values[0][0]}`);
}

testDatabase().catch(console.error);
