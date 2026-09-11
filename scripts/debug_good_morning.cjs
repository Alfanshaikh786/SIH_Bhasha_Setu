const fs = require('fs');
const path = require('path');

// Let's test what happens when translating "Good Morning Students"
// Let's inspect translationService.ts execution path
console.log('--- Inspecting Santali Dataset for "Good Morning Students" ---');
const csvPath = 'Santhali-Words.csv';
const lines = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/).filter(l => l.trim().length > 0);

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

const records = [];
for (let i = 1; i < lines.length; i++) {
  const cols = parseCsvLine(lines[i]);
  if (cols.length < 7) continue;
  records.push({
    id: cols[0],
    en: cols[3].trim(),
    hi: cols[4].trim(),
    sat: cols[5].trim(),
    roman: cols[6].trim(),
    category: cols[7]?.trim() || 'Classroom'
  });
}

const target = "Good Morning Students".toLowerCase().replace(/[.,!?;:"'()|]/g, '').trim();
console.log('Target clean input:', target);

const exactMatch = records.find(r => r.en.toLowerCase().replace(/[.,!?;:"'()|]/g, '').trim() === target);
console.log('Exact dataset match found?:', exactMatch ? `YES: Row ${exactMatch.id}` : 'NO');

// Check partial matches or matches containing "good morning" or "students"
const partials = records.filter(r => r.en.toLowerCase().includes('good morning') || r.en.toLowerCase().includes('students') || r.en.toLowerCase().includes('student'));
console.log(`Found ${partials.length} partial matches:`);
partials.slice(0, 10).forEach(p => {
  console.log(`  Row ${p.id}: EN="${p.en}" | SAT="${p.sat}" | ROMAN="${p.roman}"`);
});
