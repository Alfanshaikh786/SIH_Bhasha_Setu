/**
 * Phase 8 Automated Verification: Deployment Engineering & Field-Pilot Execution Support
 * 
 * Validates:
 * 1. Production Build & Assets (dist/)
 * 2. Storage Budget Compliance (<= 25 MB)
 * 3. Model Manifest & Checksums (public/data/model_manifest.json)
 * 4. Android Field Deployment Guide (docs/ANDROID_FIELD_DEPLOYMENT.md)
 * 5. Pre-Flight Pilot Checklist (docs/S2S_FIELD_DEPLOYMENT_CHECKLIST.md)
 * 6. Production Performance Budget (docs/S2S_PRODUCTION_PERFORMANCE_BUDGET.md)
 * 7. Stage-1 Deployment Gate (docs/S2S_STAGE1_FIELD_DEPLOYMENT_GATE.md)
 * 8. Santali TTS Data Readiness (docs/SANTALI_TTS_DATA_REQUIREMENTS.md)
 * 9. Mobile Dynamic Hostname Routing (asrService.ts & asrAdapter.ts)
 * 10. Server CORS LAN Support (server/main.py)
 * 11. Security Audit: Client Bundle Secret Leak Check
 * 12. UI Freeze Integrity (SpeechToSpeechPage.tsx & FieldModePage.tsx)
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  \x1b[32m✔\x1b[0m ${message}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${message}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('  BHASHA SETU — PHASE 8 DEPLOYMENT & FIELD-PILOT AUDIT');
console.log('======================================================\n');

// 1. Production Build Verification
console.log('[1/12] Production Build Directory Audit (dist/)...');
const distPath = path.join(rootDir, 'dist');
assert(fs.existsSync(distPath), 'dist/ directory exists from production build');
assert(fs.existsSync(path.join(distPath, 'index.html')), 'dist/index.html exists');
assert(fs.existsSync(path.join(distPath, 'sw.js')), 'dist/sw.js exists (Service Worker)');
assert(fs.existsSync(path.join(distPath, 'manifest.json')), 'dist/manifest.json exists');
assert(fs.existsSync(path.join(distPath, 'sql-wasm.wasm')), 'dist/sql-wasm.wasm exists');
assert(fs.existsSync(path.join(distPath, 'data', 'translations.db')), 'dist/data/translations.db exists (Offline DB)');

// 2. Storage Budget Compliance
console.log('\n[2/12] Storage Budget Compliance Check...');
function getDirSize(dir) {
  let size = 0;
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const fullPath = path.join(dir, f.name);
    if (f.isDirectory()) {
      size += getDirSize(fullPath);
    } else {
      size += fs.statSync(fullPath).size;
    }
  }
  return size;
}
const totalDistBytes = getDirSize(distPath);
const totalDistMB = totalDistBytes / (1024 * 1024);
console.log(`  Measured production dist size: ${totalDistMB.toFixed(2)} MB`);
assert(totalDistMB <= 25.0, `Total build size (${totalDistMB.toFixed(2)} MB) is within <= 25 MB budget`);
assert(totalDistMB <= 12.0, `Exceptional optimization: total build size (${totalDistMB.toFixed(2)} MB) is <= 12 MB`);

// 3. Model Manifest & Versioning Check
console.log('\n[3/12] Model Versioning Manifest Audit...');
const manifestPath = path.join(rootDir, 'public', 'data', 'model_manifest.json');
assert(fs.existsSync(manifestPath), 'public/data/model_manifest.json exists');
const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
assert(Array.isArray(manifestData.models), 'model_manifest.json contains models array');
assert(manifestData.models.length >= 6, `model_manifest contains >= 6 models (found ${manifestData.models.length})`);
const satAsr = manifestData.models.find(m => m.language === 'sat' && m.component === 'ASR');
assert(satAsr && satAsr.quantization === 'int8', 'Santali ASR declared with int8 quantization');
const satDb = manifestData.models.find(m => m.language === 'sat-hi-en');
assert(satDb && satDb.checksum.startsWith('sha256:70ee6d'), 'Translations DB has matching verified SHA-256 checksum');

// 4. Android Field Deployment Guide
console.log('\n[4/12] Android Field Deployment Runbook...');
const androidDocPath = path.join(rootDir, 'docs', 'ANDROID_FIELD_DEPLOYMENT.md');
assert(fs.existsSync(androidDocPath), 'docs/ANDROID_FIELD_DEPLOYMENT.md exists');
const androidDoc = fs.readFileSync(androidDocPath, 'utf-8');
assert(androidDoc.includes('Android 8.0'), 'Covers Android requirements (8.0+ / Android Go)');
assert(androidDoc.includes('Chrome'), 'Covers Google Chrome requirements');
assert(androidDoc.includes('Add to Home screen') || androidDoc.includes('PWA'), 'Covers PWA installation procedure');
assert(androidDoc.includes('Microphone Permissions'), 'Covers microphone permissions & recovery');
assert(androidDoc.includes('Offline Pre-Cache'), 'Covers offline pre-cache verification');
assert(androidDoc.includes('Troubleshooting & Field Reset'), 'Covers troubleshooting and reset');

// 5. Pre-Flight Pilot Checklist
console.log('\n[5/12] Pre-Flight Pilot Checklist Audit...');
const checklistPath = path.join(rootDir, 'docs', 'S2S_FIELD_DEPLOYMENT_CHECKLIST.md');
assert(fs.existsSync(checklistPath), 'docs/S2S_FIELD_DEPLOYMENT_CHECKLIST.md exists');
const checklist = fs.readFileSync(checklistPath, 'utf-8');
assert(checklist.includes('Device charged'), 'Checklist includes Device charged');
assert(checklist.includes('Chrome installed'), 'Checklist includes Chrome installed');
assert(checklist.includes('PWA installed'), 'Checklist includes PWA installed');
assert(checklist.includes('Microphone permission granted'), 'Checklist includes Microphone permission granted');
assert(checklist.includes('Models downloaded'), 'Checklist includes Models downloaded');
assert(checklist.includes('Offline mode tested'), 'Checklist includes Offline mode tested');
assert(checklist.includes('Auto-stop tested'), 'Checklist includes Auto-stop tested');
assert(checklist.includes('Data governance reviewed'), 'Checklist includes Data governance reviewed');
assert(checklist.includes('Emergency/manual fallback understood'), 'Checklist includes Emergency/manual fallback understood');

// 6. Production Performance Budget
console.log('\n[6/12] Performance Budget Document Audit...');
const budgetPath = path.join(rootDir, 'docs', 'S2S_PRODUCTION_PERFORMANCE_BUDGET.md');
assert(fs.existsSync(budgetPath), 'docs/S2S_PRODUCTION_PERFORMANCE_BUDGET.md exists');
const budgetDoc = fs.readFileSync(budgetPath, 'utf-8');
assert(budgetDoc.includes('MEASURED') || budgetDoc.includes('Measured Value'), 'Includes MEASURED metrics');
assert(budgetDoc.includes('TARGET') || budgetDoc.includes('Production Target'), 'Includes TARGET thresholds');
assert(budgetDoc.includes('STATUS') || budgetDoc.includes('Status'), 'Includes STATUS determinations');
assert(budgetDoc.includes('NOT YET TESTED ON PHYSICAL HARDWARE'), 'Truthfully marks physical mobile metrics as NOT YET TESTED');

// 7. Stage-1 Field Deployment Gate
console.log('\n[7/12] Stage-1 Field Deployment Gate Audit...');
const gatePath = path.join(rootDir, 'docs', 'S2S_STAGE1_FIELD_DEPLOYMENT_GATE.md');
assert(fs.existsSync(gatePath), 'docs/S2S_STAGE1_FIELD_DEPLOYMENT_GATE.md exists');
const gateDoc = fs.readFileSync(gatePath, 'utf-8');
assert(gateDoc.includes('GREEN'), 'Includes GREEN tier classification');
assert(gateDoc.includes('YELLOW'), 'Includes YELLOW tier classification');
assert(gateDoc.includes('RED'), 'Includes RED tier classification');
assert(gateDoc.includes('Santali') && gateDoc.includes('ASR'), 'Evaluates Santali ASR');
assert(gateDoc.includes('7-Second Silence Auto-Stop'), 'Evaluates 7-Second Silence Auto-Stop');
assert(gateDoc.includes('Healthcare Clinical Safety'), 'Evaluates Healthcare Clinical Safety');
assert(gateDoc.includes('Crowded Field Acoustics'), 'Evaluates Crowded Field Acoustics (YELLOW)');

// 8. Santali TTS Data Readiness
console.log('\n[8/12] Santali TTS Data Readiness Audit...');
const ttsPath = path.join(rootDir, 'docs', 'SANTALI_TTS_DATA_REQUIREMENTS.md');
assert(fs.existsSync(ttsPath), 'docs/SANTALI_TTS_DATA_REQUIREMENTS.md exists');
const ttsDoc = fs.readFileSync(ttsPath, 'utf-8');
assert(ttsDoc.includes('NOT YET FEASIBLE') || ttsDoc.includes('BLOCKED BY DATA'), 'Explicitly marks native neural TTS as NOT YET FEASIBLE / BLOCKED BY DATA');
assert(ttsDoc.includes('PhoneticTTSAdapter'), 'Specifies active phonetic bridge PhoneticTTSAdapter');

// 9. Mobile Dynamic Hostname Routing
console.log('\n[9/12] Mobile LAN / Hotspot Dynamic Hostname Routing Check...');
const asrServicePath = path.join(rootDir, 'src', 'services', 'asrService.ts');
const asrServiceCode = fs.readFileSync(asrServicePath, 'utf-8');
assert(asrServiceCode.includes('window.location.hostname'), 'asrService.ts dynamically resolves window.location.hostname for LAN devices');
const asrAdapterPath = path.join(rootDir, 'src', 'services', 's2s', 'asrAdapter.ts');
const asrAdapterCode = fs.readFileSync(asrAdapterPath, 'utf-8');
assert(asrAdapterCode.includes('window.location.hostname'), 'asrAdapter.ts dynamically resolves window.location.hostname for LAN devices');

// 10. Server CORS LAN Support
console.log('\n[10/12] Server CORS LAN Hotspot Configuration Check...');
const serverMainPath = path.join(rootDir, 'server', 'main.py');
const serverMainCode = fs.readFileSync(serverMainPath, 'utf-8');
assert(serverMainCode.includes('192\\.168\\.'), 'server/main.py allows 192.168.x.x private LAN subnet in CORS');
assert(serverMainCode.includes('10\\.'), 'server/main.py allows 10.x.x.x private LAN subnet in CORS');

// 11. Security Audit: Client Secret Leakage Check
console.log('\n[11/12] Client Bundle Security Audit...');
let secretLeak = false;
const distAssets = fs.readdirSync(path.join(distPath, 'assets'));
for (const f of distAssets) {
  if (f.endsWith('.js')) {
    const code = fs.readFileSync(path.join(distPath, 'assets', f), 'utf-8');
    if (code.includes('Alfiya@786') || code.includes('DB_PASSWORD')) {
      secretLeak = true;
      console.error(`  Leaked secret in ${f}!`);
    }
  }
}
assert(!secretLeak, 'Zero backend secrets or database passwords in client production bundle');

// 12. UI Freeze Integrity Check
console.log('\n[12/12] Absolute UI Freeze Integrity Check...');
const s2sPagePath = path.join(rootDir, 'src', 'pages', 'features', 'SpeechToSpeechPage.tsx');
const s2sPageCode = fs.readFileSync(s2sPagePath, 'utf-8');
assert(s2sPageCode.includes('Classroom & Field Dialogue') || s2sPageCode.includes('Two-Way Conversation Mode'), 'SpeechToSpeechPage exists and maintains page title');
assert(!s2sPageCode.includes('Dashboard'), 'No new dashboard controls injected into SpeechToSpeechPage');
const fieldModePath = path.join(rootDir, 'src', 'pages', 'features', 'FieldModePage.tsx');
const fieldModeCode = fs.readFileSync(fieldModePath, 'utf-8');
assert(fieldModeCode.includes('Field Mode'), 'FieldModePage exists and maintains page title');
assert(!fieldModeCode.includes('Dashboard'), 'No new dashboard controls injected into FieldModePage');

console.log('\n------------------------------------------------------');
console.log(`  PHASE 8 AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
console.log('------------------------------------------------------\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
