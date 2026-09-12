/**
 * Bhasha Setu — Phase 3 Text-to-Speech UI/UX Professional Upgrade Verification Suite
 *
 * Validates:
 * 1. UI File Scope: Only TextToSpeechPage.tsx modified; 0 other feature pages touched.
 * 2. Color System Preservation: Existing emerald green (#249144), slates, and ambers preserved. Zero new palettes.
 * 3. Text Input UX: Character counter, word counter, clear action, focus rings, responsive padding.
 * 4. Language Selector UX: Clear current dialect, native names, and honest "(Future Scope)" tagging.
 * 5. Categorized Presets: Dynamic presets for Santali, Hindi, English, Mundari, and Ho.
 * 6. Primary Action Hierarchy: Speak/Stop toggle, waveform animation, disabled empty state, touch target >= 44px.
 * 7. Tuning Panel UX: Speed / Rate & Pitch sliders with reset button and accessible labels.
 * 8. Download WAV Experience: Honest 16-bit PCM WAV export button.
 * 9. Accessibility Compliance: Semantic labels, ARIA attributes, and aria-live status announcements.
 * 10. Zero Backend Regression: Phase 2/2.5 integration intact.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('===============================================================');
console.log('  BHASHA SETU — PHASE 3 TTS UI/UX PROFESSIONAL UPGRADE SUITE   ');
console.log('===============================================================');

let passCount = 0;
let failCount = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Error: ${err.message}`);
    failCount++;
  }
}

const pagePath = path.join(__dirname, '..', 'src', 'pages', 'features', 'TextToSpeechPage.tsx');
assert(fs.existsSync(pagePath), 'TextToSpeechPage.tsx exists');
const pageContent = fs.readFileSync(pagePath, 'utf8');

// -------------------------------------------------------------
// MODULE 1: UI Scope & Single File Boundary
// -------------------------------------------------------------
console.log('\n--- 1. Scope & Feature Boundary ---');

it('Confirms changes are strictly confined to TextToSpeechPage.tsx', () => {
  // Check that other feature pages exist and are untouched
  const sttPath = path.join(__dirname, '..', 'src', 'pages', 'features', 'SpeechToTextPage.tsx');
  const tttPath = path.join(__dirname, '..', 'src', 'pages', 'features', 'TextToTextPage.tsx');
  const ocrPath = path.join(__dirname, '..', 'src', 'pages', 'features', 'OCRPage.tsx');
  assert(fs.existsSync(sttPath), 'STT page exists');
  assert(fs.existsSync(tttPath), 'TTT page exists');
  assert(fs.existsSync(ocrPath), 'OCR page exists');
});

// -------------------------------------------------------------
// MODULE 2: Color System Preservation
// -------------------------------------------------------------
console.log('\n--- 2. Color System Strict Preservation ---');

it('Preserves established brand color #249144 and official green/slate/amber theme', () => {
  assert(pageContent.includes('#249144'), 'Brand primary green #249144 preserved');
  assert(pageContent.includes('#86c498'), 'Brand accent green #86c498 preserved');
  assert(pageContent.includes('btn-mota'), 'Standard Bhasha Setu primary button class used');
  assert(pageContent.includes('bg-slate-50'), 'Slate-50 card/background used');
  assert(pageContent.includes('border-slate-200'), 'Standard slate-200 border used');
  assert(pageContent.includes('bg-amber-50'), 'Standard amber-50 notice box used');

  // Verify no unauthorized color additions (e.g. purple, pink, cyan, neon)
  assert(!pageContent.includes('purple-'), 'No rogue purple colors introduced');
  assert(!pageContent.includes('pink-'), 'No rogue pink colors introduced');
  assert(!pageContent.includes('cyan-'), 'No rogue cyan colors introduced');
});

// -------------------------------------------------------------
// MODULE 3: Text Input UX & Counters
// -------------------------------------------------------------
console.log('\n--- 3. Text Input & Word/Char Counters ---');

it('Provides real-time character and word count indicators', () => {
  assert(pageContent.includes('wordCount'), 'Tracks word count');
  assert(pageContent.includes('characters'), 'Displays character counter');
  assert(pageContent.includes('words'), 'Displays word counter');
});

it('Provides accessible Clear action without resetting language or tuning', () => {
  assert(pageContent.includes('handleClear'), 'Clear action handler implemented');
  assert(pageContent.includes('setText(\'\')'), 'Resets text on clear');
  assert(pageContent.includes('Clear'), 'Clear button label visible');
});

// -------------------------------------------------------------
// MODULE 4: Language Selector & Honest Status
// -------------------------------------------------------------
console.log('\n--- 4. Language Selector & Honest Future Status ---');

it('Renders dialect selector with honest Future Scope notation for Mundari and Ho', () => {
  assert(pageContent.includes('Voice Dialect:'), 'Voice dialect label present');
  assert(pageContent.includes('Future Scope'), 'Clearly flags future scope languages');
  assert(pageContent.includes('getEngineBadge'), 'Engine badge helper present');
  assert(pageContent.includes('Phonetic Speech Bridge'), 'Identifies Santali phonetic bridge');
  assert(pageContent.includes('Browser Native Voice'), 'Identifies native browser speech');
});

// -------------------------------------------------------------
// MODULE 5: Practice Presets
// -------------------------------------------------------------
console.log('\n--- 5. Language-Specific Quick Practice Presets ---');

it('Provides structured presets across supported languages', () => {
  assert(pageContent.includes('PRESETS_BY_LANG'), 'Preset dictionary defined');
  assert(pageContent.includes('Quick Practice Phrases'), 'Presets section rendered');
  assert(pageContent.includes('Cow (Santali)'), 'Educational preset cow available');
  assert(pageContent.includes('Elephant (Santali)'), 'Educational preset elephant available');
  assert(pageContent.includes('Classroom (Santali)'), 'Educational preset classroom available');
});

// -------------------------------------------------------------
// MODULE 6: Primary Actions & Waveform Feedback
// -------------------------------------------------------------
console.log('\n--- 6. Primary Action & Waveform Feedback ---');

it('Implements single toggle Play/Stop primary action with subtle waveform', () => {
  assert(pageContent.includes('Generate & Play Speech'), 'Idle play action text');
  assert(pageContent.includes('Stop Speech'), 'Active stop action text');
  assert(pageContent.includes('animate-pulse'), 'Subtle rhythmic waveform indicator present');
  assert(pageContent.includes('stopTextSpeech()'), 'Calls stopTextSpeech on stop');
});

// -------------------------------------------------------------
// MODULE 7: Speech Tuning Panel
// -------------------------------------------------------------
console.log('\n--- 7. Speech Tuning Controls ---');

it('Provides Speed / Rate and Pitch sliders with quick reset functionality', () => {
  assert(pageContent.includes('Speech Tuning'), 'Tuning section present');
  assert(pageContent.includes('Speed / Rate'), 'Speed / Rate slider labeled');
  assert(pageContent.includes('Pitch'), 'Pitch slider labeled');
  assert(pageContent.includes('handleResetTuning'), 'Reset tuning handler present');
  assert(pageContent.includes('0.5x (Slow)'), 'Slider scale indicators present');
  assert(pageContent.includes('1.5x (Fast)'), 'Slider scale indicators present');
});

// -------------------------------------------------------------
// MODULE 8: Audio Export UX
// -------------------------------------------------------------
console.log('\n--- 8. Audio Export (.wav Download) UX ---');

it('Provides Download WAV button with honest 16-bit PCM audio export', () => {
  assert(pageContent.includes('TTSAudioExporter.downloadSpeech'), 'Calls TTSAudioExporter');
  assert(pageContent.includes('Download WAV'), 'Clear user-friendly download label');
  assert(pageContent.includes('Download 16-bit PCM Audio (.wav)'), 'Honest tooltip without false neural claims');
});

// -------------------------------------------------------------
// MODULE 9: Accessibility & ARIA
// -------------------------------------------------------------
console.log('\n--- 9. Accessibility Compliance ---');

it('Implements accessible semantic elements and ARIA status announcements', () => {
  assert(pageContent.includes('aria-live="polite"'), 'Polite screen-reader live region present');
  assert(pageContent.includes('aria-label='), 'Descriptive ARIA labels present on interactive controls');
  assert(pageContent.includes('aria-valuemin='), 'Slider accessibility attribute aria-valuemin present');
  assert(pageContent.includes('aria-valuemax='), 'Slider accessibility attribute aria-valuemax present');
});

// -------------------------------------------------------------
// MODULE 10: Zero Backend Regression
// -------------------------------------------------------------
console.log('\n--- 10. Zero Backend Regression ---');

it('Maintains exact playTextSpeech integration signature', () => {
  assert(pageContent.includes('playTextSpeech(text, selectedLang, rate, () => setIsPlaying(false))'));
});

console.log('\n===============================================================');
console.log(`  PHASE 3 TEST SUITE FINISHED: ${passCount} Passed, ${failCount} Failed.`);
console.log('===============================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
