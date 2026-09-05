const fs = require('fs');
const initSqlJs = require('sql.js');

async function checkDb() {
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync('public/data/translations.db');
  const db = new SQL.Database(fileBuffer);

  console.log('Database opened successfully!');
  const count = db.exec('SELECT count(*) FROM translations;')[0].values[0][0];
  console.log('Total rows in translations:', count);

  // Check sample rows
  const samples = db.exec('SELECT id, english, hindi, santali, santali_roman, ho, mundari FROM translations LIMIT 10;');
  console.log('Columns:', samples[0].columns);
  samples[0].values.forEach(v => {
    console.log(`[${v[0]}] EN: "${v[1]}" | HI: "${v[2]}" | SAT: "${v[3]}" | HO: "${v[5]}" | UNR: "${v[6]}"`);
  });

  // Search for hello, school, education, hospital
  const queries = ['hello', 'how are you', 'school', 'free', 'education', 'hospital', 'ministry', 'doctor'];
  for (const q of queries) {
    const res = db.exec(`SELECT id, english, hindi, santali FROM translations WHERE english LIKE '%${q}%' LIMIT 3;`);
    if (res.length > 0 && res[0].values.length > 0) {
      console.log(`\nMatches for "${q}":`);
      res[0].values.forEach(v => console.log(`  - EN: "${v[1]}" -> HI: "${v[2]}" -> SAT: "${v[3]}"`));
    } else {
      console.log(`\nNo matches in translations.db for "${q}"`);
    }
  }
}

checkDb();
