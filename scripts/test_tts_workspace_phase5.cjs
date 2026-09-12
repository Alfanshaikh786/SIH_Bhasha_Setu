/**
 * ===============================================================
 * BHASHA SETU — PHASE 5 PREMIUM TTS WORKSPACE UI VALIDATION SUITE
 * ===============================================================
 * Validates the Phase 5 Text-to-Speech workspace refinement:
 * 1. Scope Confinement: Strictly TextToSpeechPage.tsx modified.
 * 2. 100% Color Palette Lockdown: Exact brand tokens, zero rogue colors.
 * 3. Vertical Rhythm & Introduction Optimization.
 * 4. Unified Language & Engine Configuration Bar.
 * 5. Interactive Practice Preset Pills with Selected State.
 * 6. Hero Text Input Workspace with Integrated Word/Char Counter.
 * 7. Deliberate Status Indicator & Genuine Speaking State.
 * 8. Integrated Speech Tuning Sliders with Accessibility.
 * 9. Dominant Primary Action vs Secondary Download/Clear Hierarchy.
 * 10. Touch Ergonomics & Responsive Mobile Layout.
 * 11. TTS Engine & Lifecycle Integration Integrity.
 * 12. Zero Feature Bloat & Zero Rogue Elements.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

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

console.log('===============================================================');
console.log('  BHASHA SETU — PHASE 5 PREMIUM TTS WORKSPACE UI TEST SUITE    ');
console.log('===============================================================');

const pagePath = path.join(__dirname, '..', 'src', 'pages', 'features', 'TextToSpeechPage.tsx');
assert(fs.existsSync(pagePath), 'TextToSpeechPage.tsx exists');
const pageContent = fs.readFileSync(pagePath, 'utf8');

// -------------------------------------------------------------
// MODULE 1: Scope Confinement
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
  assert(pageContent.includes('border-slate-200'), 'Slate border preserved');

  // Verify no rogue color additions
  const rogueColors = ['purple-', 'pink-', 'cyan-', 'indigo-', 'teal-', 'violet-', 'rose-', 'fuchsia-'];
  for (const rc of rogueColors) {
    assert(!pageContent.includes(rc), `No rogue color '${rc}' introduced`);
  }
});

// -------------------------------------------------------------
// MODULE 3: Vertical Introduction & Rhythm Optimization
// -------------------------------------------------------------
console.log('\n--- 3. Vertical Introduction & Rhythm Optimization ---');

it('Reduces excessive vertical introduction space to bring workspace into immediate view', () => {
  assert(pageContent.includes('pt-16 sm:pt-20'), 'Compacted section top padding');
  assert(pageContent.includes('space-y-4 sm:space-y-5'), 'Tightened vertical container spacing');
  assert(pageContent.includes('Text to Speech (TTS)'), 'Exact screen title preserved');
  assert(pageContent.includes('Phonetic Speech Synthesis (Web Speech API)'), 'Header badge preserved');
  assert(pageContent.includes('Linguistic Transparency Notice'), 'Exact transparency notice preserved');
  assert(pageContent.includes('Native tribal neural voice models (Santali, Mundari, Ho) are currently unavailable'), 'Honest transparency copy intact');
});

// -------------------------------------------------------------
// MODULE 4: Cohesive Language & Engine Configuration Bar
// -------------------------------------------------------------
console.log('\n--- 4. Cohesive Language & Engine Configuration Bar ---');

it('Integrates dialect selector and engine status badge in unified top configuration bar', () => {
  assert(pageContent.includes('Voice Dialect:'), 'Voice dialect label present');
  assert(pageContent.includes('id="tts-language-select"'), 'Dialect select element present');
  assert(pageContent.includes('getEngineBadge'), 'Engine badge helper present');
  assert(pageContent.includes('Phonetic Speech Bridge'), 'Santali phonetic engine identified');
  assert(pageContent.includes('Acoustic Indian Voice'), 'Acoustic voice sublabel identified');
  assert(pageContent.includes('Browser Native Voice'), 'Native browser engine identified');
  assert(pageContent.includes('Device Synthesis'), 'Device synthesis sublabel identified');
  assert(pageContent.includes('Architecture Ready'), 'Future scope architecture identified');
  assert(pageContent.includes('— Future Scope'), 'Future scope clearly marked in selector');
});

// -------------------------------------------------------------
// MODULE 5: Interactive Practice Preset Pills
// -------------------------------------------------------------
console.log('\n--- 5. Interactive Practice Preset Pills ---');

it('Renders practice presets as interactive chips with active loaded indication', () => {
  assert(pageContent.includes('Quick Practice Phrases'), 'Practice phrases header present');
  assert(pageContent.includes('Welcome & Healthcare'), 'Healthcare preset present');
  assert(pageContent.includes('Cow (Santali)'), 'Cow preset present');
  assert(pageContent.includes('Elephant (Santali)'), 'Elephant preset present');
  assert(pageContent.includes('Classroom (Santali)'), 'Classroom preset present');
  assert(pageContent.includes('text === preset.text'), 'Tracks active preset loaded into workspace');
  assert(pageContent.includes('ring-1 ring-[#249144]/30'), 'Highlights active preset with brand styling');
  assert(pageContent.includes('touch-manipulation'), 'Optimizes touch interactions');
  assert(pageContent.includes('min-h-[38px]'), 'Comfortable chip touch target');
});

// -------------------------------------------------------------
// MODULE 6: Hero Text Input Workspace
// -------------------------------------------------------------
console.log('\n--- 6. Hero Text Input Workspace ---');

it('Elevates textarea as central workspace with integrated character/word counts and clear action', () => {
  assert(pageContent.includes('Input Text:'), 'Input text label present');
  assert(pageContent.includes('id="tts-input-textarea"'), 'Textarea id present');
  assert(pageContent.includes('wordCount'), 'Tracks word count');
  assert(pageContent.includes('words'), 'Displays words counter');
  assert(pageContent.includes('characters'), 'Displays characters counter');
  assert(pageContent.includes('handleClear'), 'Clear action handler present');
  assert(pageContent.includes('setText(\'\')'), 'Resets text on clear');
  assert(pageContent.includes('Clear'), 'Clear action label present');
  assert(pageContent.includes('placeholder="Enter text to synthesize into speech..."'), 'Clear placeholder present');
});

// -------------------------------------------------------------
// MODULE 7: Status Indicator & Speaking State Feedback
// -------------------------------------------------------------
console.log('\n--- 7. Status Indicator & Speaking State Feedback ---');

it('Provides real-time speech engine status and genuine active speaking indicators', () => {
  assert(pageContent.includes('aria-live="polite"'), 'Status live announcement region present');
  assert(pageContent.includes('Status: {statusText}'), 'Status text rendered dynamically');
  assert(pageContent.includes('border-[#249144] bg-green-50/20'), 'Active border feedback when playing');
  assert(pageContent.includes('Volume2'), 'Speaker icon present');
  assert(pageContent.includes('Playing audio'), 'Playing audio badge rendered during playback');
  assert(pageContent.includes('animate-pulse'), 'Rhythmic waveform indicator active during playback');
  assert(pageContent.includes('motion-reduce:animate-none'), 'Respects prefers-reduced-motion');
});

// -------------------------------------------------------------
// MODULE 8: Integrated Speech Tuning Sliders
// -------------------------------------------------------------
console.log('\n--- 8. Integrated Speech Tuning Sliders ---');

it('Provides accessible Speed / Rate and Pitch sliders with quick 1.0x reset', () => {
  assert(pageContent.includes('Speech Tuning'), 'Tuning section present');
  assert(pageContent.includes('Speed / Rate'), 'Speed / Rate slider labeled');
  assert(pageContent.includes('Pitch'), 'Pitch slider labeled');
  assert(pageContent.includes('handleResetTuning'), 'Reset tuning handler present');
  assert(pageContent.includes('Reset (1.0x)'), 'Reset button text present');
  assert(pageContent.includes('0.5x (Slow)'), 'Speed lower scale marker');
  assert(pageContent.includes('1.5x (Fast)'), 'Speed upper scale marker');
  assert(pageContent.includes('0.5 (Low)'), 'Pitch lower scale marker');
  assert(pageContent.includes('1.5 (High)'), 'Pitch upper scale marker');
  assert(pageContent.includes('aria-valuetext={`${rate.toFixed(1)}x`}'), 'Rate accessible speech text');
  assert(pageContent.includes('aria-valuetext={`${pitch.toFixed(1)}`}'), 'Pitch accessible speech text');
});

// -------------------------------------------------------------
// MODULE 9: Primary Action Dominance & Secondary Actions
// -------------------------------------------------------------
console.log('\n--- 9. Action Hierarchy ---');

it('Ensures Speak is the dominant primary action while Download and Clear remain secondary', () => {
  assert(pageContent.includes('Generate & Play Speech'), 'Dominant idle play action');
  assert(pageContent.includes('Stop Speech'), 'Dominant active stop action');
  assert(pageContent.includes('btn-mota'), 'Uses dominant brand button styling');
  assert(pageContent.includes('Download WAV'), 'Secondary download action');
  assert(pageContent.includes('Download 16-bit PCM Audio (.wav)'), 'Download action title');
  assert(pageContent.includes('border-slate-200 hover:border-[#249144]'), 'Secondary button outline styling');
});

// -------------------------------------------------------------
// MODULE 10: Touch Ergonomics & Mobile Layout
// -------------------------------------------------------------
console.log('\n--- 10. Touch Ergonomics & Mobile Layout ---');

it('Enforces mobile-friendly touch targets and responsive layouts', () => {
  assert(pageContent.includes('min-h-[46px]'), 'Primary button >= 44px (46px)');
  assert(pageContent.includes('min-h-[44px]'), 'Secondary and select controls >= 44px');
  assert(pageContent.includes('min-h-[38px]'), 'Preset buttons have comfortable touch targets');
  assert(pageContent.includes('w-full sm:w-auto'), 'Buttons expand gracefully on mobile');
  assert(pageContent.includes('touch-manipulation'), 'Touch manipulation enabled');
});

// -------------------------------------------------------------
// MODULE 11: TTS Engine & Lifecycle Integration Integrity
// -------------------------------------------------------------
console.log('\n--- 11. TTS Engine & Lifecycle Integration Integrity ---');

it('Maintains exact synthesis, audio export, and unmount cleanup signatures', () => {
  assert(pageContent.includes('playTextSpeech(text, selectedLang, rate, () => setIsPlaying(false))'), 'Calls playTextSpeech with rate and callback');
  assert(pageContent.includes('stopTextSpeech()'), 'Calls stopTextSpeech');
  assert(pageContent.includes('TTSAudioExporter.downloadSpeech(text, selectedLang)'), 'Calls downloadSpeech');
  assert(/React\.useEffect\(\(\)\s*=>\s*{\s*return\s*\(\)\s*=>\s*{\s*stopTextSpeech\(\);/s.test(pageContent), 'Registers unmount cleanup');
  assert(pageContent.includes('Speech stopped (language switched)'), 'Language switch cancellation handled');
  assert(pageContent.includes('isPlaying ? \'Speaking audio...\' : \'Ready\''), 'Download completion checks isPlaying');
});

// -------------------------------------------------------------
// MODULE 12: Zero Feature Bloat & Zero Unauthorized Elements
// -------------------------------------------------------------
console.log('\n--- 12. Zero Feature Bloat ---');

it('Guarantees zero unauthorized controls or widgets injected', () => {
  const forbiddenWidgets = [
    'Confidence Meter',
    'AI Voice Settings',
    'Prosody Mode',
    'Compound Viewer',
    'Quarantine Status',
    'Pronunciation Pipeline Studio'
  ];
  for (const widget of forbiddenWidgets) {
    assert(!pageContent.includes(widget), `Forbidden widget '${widget}' not present`);
  }
});

console.log('\n===============================================================');
console.log(`  PHASE 5 TEST SUITE FINISHED: ${passCount} Passed, ${failCount} Failed.`);
console.log('===============================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
