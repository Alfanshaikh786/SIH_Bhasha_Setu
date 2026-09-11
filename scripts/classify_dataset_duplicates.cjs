/**
 * scripts/classify_dataset_duplicates.cjs
 *
 * Bhasha Setu (भाषा | SETU) - Phase 3
 * Santali Dataset Duplicate & Linguistic Variant Classification Engine
 *
 * Distinguishes legitimate homophones, polysemous concepts, and dialectal/synonymic
 * variants from potential data entry duplicates across the 6,780 parallel entries.
 */

const fs = require('fs');
const path = require('path');

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

const csvPath = path.resolve(__dirname, '../Santhali-Words.csv');
const rawContent = fs.readFileSync(csvPath, 'utf8');
const lines = rawContent.split(/\r?\n/).filter(l => l.trim().length > 0);

const rows = [];
for (let i = 1; i < lines.length; i++) {
  const cols = parseCsvLine(lines[i]);
  if (cols.length < 7) continue;
  rows.push({
    lineNum: i + 1,
    id: cols[0],
    en: cols[3],
    hi: cols[4],
    sat: cols[5],
    roman: cols[6],
    category: cols[7] || 'Normally Used Words in Classroom'
  });
}

// Group by English key (case-insensitive)
const englishGroups = new Map();
rows.forEach(r => {
  const k = r.en.trim().toLowerCase();
  if (!englishGroups.has(k)) englishGroups.set(k, []);
  englishGroups.get(k).push(r);
});

const duplicateGroups = [];
for (const [key, group] of englishGroups.entries()) {
  if (group.length > 1) {
    duplicateGroups.push({ key, group });
  }
}

const classificationCounts = {
  'VALID VARIANT': 0,
  'POLYSEMY': 0,
  'HOMOPHONE': 0,
  'POSSIBLE DUPLICATE': 0,
  'NEEDS LINGUIST REVIEW': 0
};

const classifications = [];

duplicateGroups.forEach(({ key, group }) => {
  const satSet = new Set(group.map(g => g.sat.trim()));
  const hiSet = new Set(group.map(g => g.hi.trim()));
  const catSet = new Set(group.map(g => g.category.trim()));

  let categoryLabel = '';
  let reason = '';

  if (satSet.size === 1 && hiSet.size === 1) {
    if (catSet.size > 1) {
      categoryLabel = 'VALID VARIANT';
      reason = `Identical translation verified valid across multiple semantic domains (${Array.from(catSet).join(', ')})`;
    } else {
      categoryLabel = 'POSSIBLE DUPLICATE';
      reason = `Identical English, Hindi, and Santali within the same domain "${group[0].category}"`;
    }
  } else if (satSet.size > 1 && hiSet.size > 1) {
    categoryLabel = 'POLYSEMY';
    reason = `Polysemous English word with distinct Hindi and Santali meanings`;
  } else if (satSet.size > 1 && hiSet.size === 1) {
    categoryLabel = 'HOMOPHONE';
    reason = `Synonymic / gendered Santali variants for the same Hindi meaning`;
  } else {
    categoryLabel = 'NEEDS LINGUIST REVIEW';
    reason = `Context-dependent nuance between Hindi and Santali representations`;
  }

  classificationCounts[categoryLabel]++;
  classifications.push({
    key,
    categoryLabel,
    reason,
    count: group.length,
    entries: group.map(g => ({ line: g.lineNum, hi: g.hi, sat: g.sat, ro: g.roman, cat: g.category }))
  });
});

console.log('============================================================');
console.log('       BHASHA SETU — LINGUISTIC VARIANT AUDIT REPORT        ');
console.log('============================================================');
console.log(`Total Records Audited          : ${rows.length}`);
console.log(`Unique English Words/Phrases   : ${englishGroups.size}`);
console.log(`Multi-Entry English Keys       : ${duplicateGroups.length}`);
console.log('------------------------------------------------------------');
console.log('Linguistic Classification Breakdown:');
for (const [k, v] of Object.entries(classificationCounts)) {
  console.log(`  - ${k.padEnd(23)}: ${v} groups`);
}
console.log('============================================================\n');

module.exports = {
  totalRows: rows.length,
  uniqueEnglish: englishGroups.size,
  multiEntryCount: duplicateGroups.length,
  classificationCounts,
  classifications
};
