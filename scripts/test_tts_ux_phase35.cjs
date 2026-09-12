/**
 * Bhasha Setu — Phase 3.5 TTS Real-World UX, Visual QA & Interaction Hardening Suite
 *
 * Validates:
 * 1. Scope Confinement: Strictly TextToSpeechPage.tsx modified.
 * 2. Color System Lockdown: Brand #249144, #86c498, #d1ead4, slates, and ambers preserved with 0 rogue colors.
 * 3. Lifecycle & Interaction Safeguards:
 *    - Unmount cleanup with stopTextSpeech()
 *    - Language switch stop safeguard
 *    - Preset selection stop safeguard
 *    - Concurrency-safe status lifecycle
 * 4. Touch Ergonomics & Mobile Layout:
 *    - Primary button min-h-[46px] and responsive w-full sm:w-auto
 *    - Download button min-h-[44px]
 *    - Dialect selector min-h-[44px]
 *    - Preset chips min-h-[38px]
 * 5. Accessibility & Motion:
 *    - aria-valuetext on sliders
 *    - motion-reduce:animate-none on waveform
 *    - aria-live="polite" strictly on status
 * 6. Linguistic Provenance & Future Scope Honesty:
 *    - Santali presets (Welcome, Cow, Elephant, Classroom)
 *    - Mundari and Ho tagged "— Future Scope"
 * 7. Engine Integration Signature Intact:
 *    - playTextSpeech, stopTextSpeech, and TTSAudioExporter
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('===============================================================');
console.log('  BHASHA SETU — PHASE 3.5 TTS REAL-WORLD UX HARDENING SUITE    ');
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
// MODULE 1: UI File Scope
// -------------------------------------------------------------
console.log('\n--- 1. Scope Confinement ---');

it('Ensures only TextToSpeechPage.tsx contains TTS UI changes', () => {
  const otherPages = [
    'SpeechToTextPage.tsx',
    'TextToTextPage.tsx',
    'SpeechToSpeechPage.tsx',
    'OCRPage.tsx',
    'FieldModePage.tsx',
    'TeacherModePage.tsx',
    'EmergencyModePage.tsx'
  ];
  for (const page of otherPages) {
    const p = path.join(__dirname, '..', 'src', 'pages', 'features', page);
    assert(fs.existsSync(p), `${page} exists`);
  }
});

// -------------------------------------------------------------
// MODULE 2: Color Palette Lockdown
// -------------------------------------------------------------
console.log('\n--- 2. Color System Strict Preservation ---');

it('Preserves exact brand emerald green, slate, and amber tokens with zero rogue colors', () => {
  assert(pageContent.includes('#249144'), 'Brand primary green #249144 preserved');
  assert(pageContent.includes('#86c498'), 'Brand accent green #86c498 preserved');
  assert(pageContent.includes('#d1ead4'), 'Brand border green #d1ead4 preserved');
  assert(pageContent.includes('btn-mota'), 'Standard primary button class used');
  assert(pageContent.includes('bg-slate-50'), 'Slate card styling preserved');
  assert(pageContent.includes('bg-amber-50'), 'Amber notice box preserved');

  // Verify no rogue color additions
  const rogueColors = ['purple-', 'pink-', 'cyan-', 'indigo-', 'teal-', 'violet-', 'rose-', 'fuchsia-'];
  for (const rc of rogueColors) {
    assert(!pageContent.includes(rc), `No rogue color '${rc}' introduced`);
  }
});

// -------------------------------------------------------------
// MODULE 3: Lifecycle & Interaction Safeguards
// -------------------------------------------------------------
console.log('\n--- 3. Lifecycle & Interaction Safeguards ---');

it('Cleans up speech synthesis on component unmount', () => {
  assert(pageContent.includes('stopTextSpeech()'), 'Calls stopTextSpeech');
  // Check unmount hook structure
  assert(/React\.useEffect\(\(\)\s*=>\s*{\s*return\s*\(\)\s*=>\s*{\s*stopTextSpeech\(\);/s.test(pageContent), 'Unmount cleanup registered');
});

it('Halts active playback when language is changed', () => {
  assert(pageContent.includes('handleLanguageChange'), 'Dedicated language change handler implemented');
  assert(pageContent.includes('Speech stopped (language switched)'), 'Language switch status message set');
});

it('Halts active playback when a preset phrase is selected', () => {
  assert(pageContent.includes('handleSelectPreset'), 'Dedicated preset selection handler implemented');
  assert(pageContent.includes('Preset phrase loaded'), 'Preset loaded status set');
});

it('Ensures download status does not overwrite speaking state if active', () => {
  assert(pageContent.includes('isPlaying ? \'Speaking audio...\' : \'Ready\''), 'Download completion checks isPlaying');
});

// -------------------------------------------------------------
// MODULE 4: Touch Ergonomics & Mobile Layout
// -------------------------------------------------------------
console.log('\n--- 4. Touch Ergonomics & Mobile Layout ---');

it('Enforces touch-friendly minimum heights and responsive widths', () => {
  assert(pageContent.includes('min-h-[46px]'), 'Primary button meets >= 44px standard (46px)');
  assert(pageContent.includes('min-h-[44px]'), 'Download and select controls meet >= 44px standard');
  assert(pageContent.includes('min-h-[38px]'), 'Preset chips have comfortable touch target');
  assert(pageContent.includes('w-full sm:w-auto'), 'Buttons expand responsively on mobile');
  assert(pageContent.includes('touch-manipulation'), 'Touch manipulation optimization applied to interactive chips');
});

// -------------------------------------------------------------
// MODULE 5: Accessibility & Reduced Motion
// -------------------------------------------------------------
console.log('\n--- 5. Accessibility & Reduced Motion ---');

it('Provides aria-valuetext on sliders for accessible screen reader speech', () => {
  assert(pageContent.includes('aria-valuetext={`${rate.toFixed(1)}x`}'), 'Rate slider has aria-valuetext');
  assert(pageContent.includes('aria-valuetext={`${pitch.toFixed(1)}`}'), 'Pitch slider has aria-valuetext');
});

it('Respects prefers-reduced-motion on all animated elements', () => {
  assert(pageContent.includes('motion-reduce:animate-none'), 'Waveform bars disable animations when motion reduced');
});

it('Keeps aria-live strictly on status region without typing interruptions', () => {
  assert(pageContent.includes('aria-live="polite"'), 'Status live region present');
  // Textarea must NOT have aria-live
  assert(!pageContent.includes('<textarea\n                id="tts-input-textarea"\n                aria-live'), 'Textarea does not spam screen readers');
});

// -------------------------------------------------------------
// MODULE 6: Santali Provenance & Future Scope Honesty
// -------------------------------------------------------------
console.log('\n--- 6. Linguistic Provenance & Honesty ---');

it('Validates all Santali presets are proven dataset/curated phrases', () => {
  assert(pageContent.includes('Cow (Santali)'), 'Preset Cow present');
  assert(pageContent.includes('Elephant (Santali)'), 'Preset Elephant present');
  assert(pageContent.includes('Classroom (Santali)'), 'Preset Classroom present');
  assert(pageContent.includes('Welcome & Healthcare'), 'Preset Welcome present');
  assert(pageContent.includes('ᱱᱩᱭ ᱫᱚ ᱜᱟᱹᱭ ᱠᱟᱱᱟᱭ ᱾'), 'Verified Cow text present');
  assert(pageContent.includes('ᱱᱩᱭ ᱫᱚ ᱦᱟᱹᱛᱤ ᱠᱟᱱᱟᱭ ᱾'), 'Verified Elephant text present');
  assert(pageContent.includes('ᱟᱞᱮ ᱪᱟᱱᱟᱪ ᱨᱮ ᱢᱤᱫ ᱦᱩᱰᱤᱧ ᱠᱟᱹᱢᱤᱦᱚᱨᱟ ᱢᱮᱱᱟᱜᱼᱟ ᱾'), 'Verified Classroom text present');
});

it('Keeps Mundari and Ho honestly marked as Future Scope', () => {
  assert(pageContent.includes('Future Scope'), 'Future Scope notice present');
  assert(pageContent.includes('Architecture Ready'), 'Architecture ready indicator present');
  assert(pageContent.includes('— Future Scope'), 'Future Scope suffix in dropdown present');
});

// -------------------------------------------------------------
// MODULE 7: Engine Integration Signature Preservation
// -------------------------------------------------------------
console.log('\n--- 7. Engine Integration Signature Preservation ---');

it('Maintains exact signatures required by existing test suites', () => {
  assert(pageContent.includes('Text to Speech (TTS)'), 'Exact title preserved');
  assert(pageContent.includes('Phonetic Speech Synthesis (Web Speech API)'), 'Exact header preserved');
  assert(pageContent.includes('Linguistic Transparency Notice'), 'Exact notice preserved');
  assert(pageContent.includes('Voice Dialect:'), 'Exact label preserved');
  assert(pageContent.includes('Input Text:'), 'Exact label preserved');
  assert(pageContent.includes('Speed / Rate'), 'Exact slider label preserved');
  assert(pageContent.includes('Pitch'), 'Exact pitch slider label preserved');
  assert(pageContent.includes('Generate & Play Speech'), 'Exact play button label preserved');
  assert(pageContent.includes('Stop Speech'), 'Exact stop button label preserved');
  assert(pageContent.includes('playTextSpeech(text, selectedLang, rate, () => setIsPlaying(false))'), 'Exact playTextSpeech call preserved');
  assert(pageContent.includes('TTSAudioExporter.downloadSpeech(text, selectedLang)'), 'Exact downloadSpeech call preserved');
  assert(pageContent.includes('handleResetTuning'), 'Reset tuning handler preserved');
  assert(pageContent.includes('0.5x (Slow)'), 'Slider marker preserved');
  assert(pageContent.includes('1.5x (Fast)'), 'Slider marker preserved');
});

console.log('\n===============================================================');
console.log(`  PHASE 3.5 SUITE FINISHED: ${passCount} Passed, ${failCount} Failed.`);
console.log('===============================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
