const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

async function testSqlite() {
  const SQL = await initSqlJs();
  const dbPath = path.join(__dirname, '../public/data/translations.db');
  const dbBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(dbBuffer);

  const clean = "Good Morning Students";
  const cleanWithoutPunct = clean.toLowerCase().replace(/[?!.,;:()|]/g, '').trim();
  const cleanWithPunct = clean.toLowerCase().trim();

  // Test exact query
  const exactQuery = `
    SELECT id, english, hindi, santali, santali_roman, ho, mundari, category, verified 
    FROM translations 
    WHERE LOWER(TRIM(english)) = ? 
       OR LOWER(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(english), '.', ''), '?', ''), '!', ''), ',', '')) = ?
    LIMIT 1;
  `;
  const exactStmt = db.prepare(exactQuery);
  exactStmt.bind([cleanWithPunct, cleanWithoutPunct]);
  const exactMatched = exactStmt.step();
  console.log('Exact query matched?', exactMatched);
  if (exactMatched) {
    console.log('Exact row:', exactStmt.getAsObject());
  }
  exactStmt.free();

  // Test fuzzy query
  const fuzzyQuery = `
    SELECT id, english, hindi, santali, santali_roman, ho, mundari, category, verified 
    FROM translations 
    WHERE english LIKE ? 
    LIMIT 5;
  `;
  const fuzzyPattern = `%${cleanWithoutPunct}%`;
  const fuzzyStmt = db.prepare(fuzzyQuery);
  fuzzyStmt.bind([fuzzyPattern]);

  const qWords = cleanWithoutPunct.split(/\s+/).filter(Boolean);
  console.log('Query words count:', qWords.length, qWords);

  while (fuzzyStmt.step()) {
    const row = fuzzyStmt.getAsObject();
    const rowMatchedText = (row.english || '').toLowerCase().replace(/[?!.,;:()|]/g, '').trim();
    const rWords = rowMatchedText.split(/\s+/).filter(Boolean);
    const lengthRatio = Math.min(qWords.length, rWords.length) / Math.max(qWords.length, rWords.length);
    console.log(`Found candidate row #${row.id}: "${row.english}" (words: ${rWords.length}, ratio: ${lengthRatio.toFixed(2)})`);
  }
  fuzzyStmt.free();
}

testSqlite();
