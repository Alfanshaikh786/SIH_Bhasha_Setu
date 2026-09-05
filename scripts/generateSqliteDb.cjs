/**
 * Build Script: Generate Local SQLite Database (translations.db)
 * from Santhali-Words.csv preserving 100% Unicode Ol Chiki, Devanagari, and English text.
 */

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

// Parse CSV line accurately handling quoted fields containing commas
function parseCsvLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

async function buildDatabase() {
  console.log('🚀 Initializing SQLite WASM Engine...');
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  console.log('📦 Creating table "translations" with optimized indexes...');
  db.run(`
    CREATE TABLE translations (
      id INTEGER PRIMARY KEY,
      english TEXT NOT NULL,
      hindi TEXT NOT NULL,
      santali TEXT NOT NULL,
      santali_roman TEXT,
      ho TEXT,
      mundari TEXT,
      category TEXT,
      verified TEXT
    );
  `);

  db.run(`CREATE INDEX idx_english ON translations (english);`);
  db.run(`CREATE INDEX idx_hindi ON translations (hindi);`);
  db.run(`CREATE INDEX idx_santali ON translations (santali);`);
  db.run(`CREATE INDEX idx_category ON translations (category);`);

  const csvPath = path.join(__dirname, '../Santhali-Words.csv');
  console.log(`📄 Reading dataset from ${csvPath}...`);
  const rawCsv = fs.readFileSync(csvPath, 'utf8');
  const lines = rawCsv.split(/\r?\n/).filter(l => l.trim().length > 0);

  console.log(`📊 Found ${lines.length - 1} data rows in CSV...`);

  // Prepare insert statement
  const insertStmt = db.prepare(`
    INSERT INTO translations (id, english, hindi, santali, santali_roman, ho, mundari, category, verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.run('BEGIN TRANSACTION;');

  let importedCount = 0;
  // Header: id,source_language,target_language,English_text,Hindi,Santhali,Santali_English_Pronounciation,category,verified
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 6) continue;

    const rowId = parseInt(cols[0], 10) || i;
    const english = (cols[3] || '').trim();
    const hindi = (cols[4] || '').trim();
    const santali = (cols[5] || '').trim();
    const santaliRoman = (cols[6] || '').trim();
    const category = (cols[7] || 'General').trim();
    const verified = (cols[8] || 'Yes').trim();

    // IMPORTANT: Ho and Mundari translations are NOT derived by copying Santali.
    // The source CSV (Santhali-Words.csv) contains Santali data only.
    // No authentic Ho (Warang Chiti) or Mundari dataset is available at build time.
    // Ho and Mundari columns are stored as empty strings.
    // Translation for these languages requires dedicated custom models (future: ONNX/LiteRT).
    const ho = '';
    const mundari = '';

    if (english || hindi || santali) {
      insertStmt.run([rowId, english, hindi, santali, santaliRoman, ho, mundari, category, verified]);
      importedCount++;
    }
  }

  db.run('COMMIT;');
  insertStmt.free();

  console.log(`✅ Successfully imported ${importedCount} verified rows into SQLite!`);

  // Verify by running a test query
  const testRes = db.exec("SELECT * FROM translations WHERE id = 1 OR english LIKE 'lock the door%' LIMIT 2;");
  console.log('🧪 Sample query verification:', JSON.stringify(testRes, null, 2));

  // Export binary database buffer
  const binaryArray = db.export();
  const buffer = Buffer.from(binaryArray);

  // 1. Write to root translations.db
  const rootDbPath = path.join(__dirname, '../translations.db');
  fs.writeFileSync(rootDbPath, buffer);
  console.log(`💾 Saved database to ${rootDbPath} (${(buffer.length / 1024).toFixed(1)} KB)`);

  // 2. Write to public/data/translations.db
  const publicDataDir = path.join(__dirname, '../public/data');
  if (!fs.existsSync(publicDataDir)) {
    fs.mkdirSync(publicDataDir, { recursive: true });
  }
  const publicDbPath = path.join(publicDataDir, 'translations.db');
  fs.writeFileSync(publicDbPath, buffer);
  console.log(`🌐 Bundled for client-side offline access at ${publicDbPath}`);

  // 3. Copy wasm binaries to public directory for zero-network WASM execution
  const wasmSrcPath = path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm');
  const wasmDestPath = path.join(__dirname, '../public/sql-wasm.wasm');
  if (fs.existsSync(wasmSrcPath)) {
    fs.copyFileSync(wasmSrcPath, wasmDestPath);
    console.log(`⚡ Copied sql-wasm.wasm to ${wasmDestPath} for 100% offline WebAssembly`);
  }

  const browserWasmSrc = path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm-browser.wasm');
  const browserWasmDest = path.join(__dirname, '../public/sql-wasm-browser.wasm');
  if (fs.existsSync(browserWasmSrc)) {
    fs.copyFileSync(browserWasmSrc, browserWasmDest);
    console.log(`⚡ Copied sql-wasm-browser.wasm to ${browserWasmDest}`);
  }

  console.log('🎉 SQLite Database generation completed successfully!');
}

buildDatabase().catch(err => {
  console.error('❌ Error generating SQLite database:', err);
  process.exit(1);
});
