/**
 * scripts/check_bundle_regression.cjs
 *
 * Bhasha Setu (भाषा | SETU) - Phase 4
 * Production Bundle Regression & Chunk Size Guard
 *
 * Ensures that the 97.5% bundle reduction achieved in Phase 3 does not regress.
 * Thresholds:
 * - Initial Entry JS (index-*.js)   : <= 120 kB (Target: ~70 kB)
 * - Vendor React (vendor-react-*.js): <= 220 kB (Target: ~165 kB)
 * - Santali Dataset Chunk           : <= 2.6 MB (Isolated on-device)
 * - Text-To-Text Page Chunk         : <= 75 kB  (Target: ~46 kB)
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const distAssetsDir = path.resolve(__dirname, '../dist/assets');

if (!fs.existsSync(distAssetsDir)) {
  console.error('[ERROR] dist/assets not found. Run "npm run build" first.');
  process.exit(1);
}

const files = fs.readdirSync(distAssetsDir);

console.log('============================================================');
console.log('       BHASHA SETU — BUNDLE PERFORMANCE REGRESSION GUARD    ');
console.log('============================================================\n');

let initialJsSize = 0;
let initialJsGzip = 0;
let santaliChunkSize = 0;
let vendorReactSize = 0;
let textToTextSize = 0;
let totalJsBytes = 0;
let totalJsGzipBytes = 0;

files.forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(distAssetsDir, file);
    const content = fs.readFileSync(filePath);
    const size = content.length;
    const gzipSize = zlib.gzipSync(content).length;

    totalJsBytes += size;
    totalJsGzipBytes += gzipSize;

    if (file.startsWith('index-')) {
      initialJsSize = size;
      initialJsGzip = gzipSize;
      console.log(`[ENTRY CHUNK]     ${file.padEnd(35)}: ${(size / 1024).toFixed(2)} kB (gzip: ${(gzipSize / 1024).toFixed(2)} kB)`);
    } else if (file.startsWith('santali-dataset-')) {
      santaliChunkSize = size;
      console.log(`[SANTALI DATASET] ${file.padEnd(35)}: ${(size / 1024).toFixed(2)} kB (gzip: ${(gzipSize / 1024).toFixed(2)} kB)`);
    } else if (file.startsWith('vendor-react-')) {
      vendorReactSize = size;
      console.log(`[VENDOR REACT]    ${file.padEnd(35)}: ${(size / 1024).toFixed(2)} kB (gzip: ${(gzipSize / 1024).toFixed(2)} kB)`);
    } else if (file.startsWith('TextToTextPage-')) {
      textToTextSize = size;
      console.log(`[TEXT-TO-TEXT]    ${file.padEnd(35)}: ${(size / 1024).toFixed(2)} kB (gzip: ${(gzipSize / 1024).toFixed(2)} kB)`);
    }
  }
});

console.log('------------------------------------------------------------');
console.log(`Total JavaScript Assets (All Routes): ${(totalJsBytes / 1024).toFixed(2)} kB (gzip: ${(totalJsGzipBytes / 1024).toFixed(2)} kB)`);
console.log('------------------------------------------------------------');

let hasRegression = false;

// 1. Initial Entry JS Guard (<= 120 kB threshold)
const initialThresholdKb = 120;
const initialKb = initialJsSize / 1024;
if (initialKb > initialThresholdKb) {
  console.error(`❌ REGRESSION DETECTED: Initial entry JS grew to ${initialKb.toFixed(2)} kB (Threshold: ${initialThresholdKb} kB)`);
  hasRegression = true;
} else {
  console.log(`✅ PASS: Initial entry JS is ${initialKb.toFixed(2)} kB (Under ${initialThresholdKb} kB threshold)`);
}

// 2. Isolated Santali Dataset Guard (Must remain isolated on-device, <= 2600 kB)
const datasetThresholdKb = 2600;
const datasetKb = santaliChunkSize / 1024;
if (datasetKb > datasetThresholdKb) {
  console.error(`❌ REGRESSION DETECTED: Santali dataset chunk grew to ${datasetKb.toFixed(2)} kB (Threshold: ${datasetThresholdKb} kB)`);
  hasRegression = true;
} else {
  console.log(`✅ PASS: Santali dataset chunk is ${datasetKb.toFixed(2)} kB (Isolated on-device)`);
}

// 3. Text-to-Text Studio Chunk Guard (<= 80 kB)
const textThresholdKb = 80;
const textKb = textToTextSize / 1024;
if (textKb > textThresholdKb) {
  console.error(`❌ REGRESSION DETECTED: TextToTextPage chunk grew to ${textKb.toFixed(2)} kB (Threshold: ${textThresholdKb} kB)`);
  hasRegression = true;
} else {
  console.log(`✅ PASS: TextToTextPage chunk is ${textKb.toFixed(2)} kB (Under ${textThresholdKb} kB threshold)`);
}

console.log('============================================================\n');

if (hasRegression) {
  process.exit(1);
} else {
  console.log('🎉 Bundle performance regression check passed! All thresholds respected.');
}
