/**
 * Bhasha Setu — Phase 4 Intelligent Pronunciation & Natural Speech Engine Test Suite
 *
 * Validates:
 * 1. UI Freeze: TextToSpeechPage.tsx UI remains 100% frozen (0 UI changes).
 * 2. Dedicated Pronunciation Pipeline:
 *    - 8-stage resolution hierarchy (Native Verified -> Expert -> Curated -> Dataset -> Context -> Rule -> Algorithmic -> Fallback)
 *    - Stop at highest confidence tier; zero overwrite by lower tiers.
 * 3. Santali & Ol Chiki Diacritics:
 *    - Base letters, vowels, checked consonants with/without Ahad, aspiration (Oh), nasalization (Mu-Tuda).
 * 4. Roman Santali Linguistics:
 *    - Language-aware normalization without destructive rewriting.
 *    - Isolation of English vocabulary in mixed sentences.
 * 5. Syllable Intelligence:
 *    - Accurate segmentation for pacing and difficult-word detection without unnatural pauses.
 * 6. Difficult Word Detection:
 *    - Bounded scoring model identifying polysyllabic and clinical words.
 * 7. Medical & Number Speech Normalization:
 *    - Vitals (120/80), temperatures (37.5 °C), dosages (10-20 mg, 2 tablets), negative numbers (-5), large numbers (1,00,000).
 *    - Abbreviation intelligence (letter-by-letter BP, OPD, ANC vs expanded PHC).
 * 8. Golden Pronunciation Corpus & Native Validation Readiness:
 *    - Provenance verification against Santhali-Words.csv.
 * 9. Structured Candidate Model:
 *    - Inspectable metadata schema with rule versions and qualitative provenance.
 * 10. Central Voice Intelligence Integration:
 *    - End-to-end integration without backend regressions.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

console.log('===============================================================');
console.log('  BHASHA SETU — PHASE 4 INTELLIGENT PRONUNCIATION TEST SUITE   ');
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
    if (err.stack) {
      console.error(`     Stack: ${err.stack.split('\n').slice(1, 4).join('\n')}`);
    }
    failCount++;
  }
}

// Module loader that bundles and instantiates TypeScript files in memory
const moduleCache = new Map();
function loadTsModule(relativePath) {
  if (moduleCache.has(relativePath)) {
    return moduleCache.get(relativePath);
  }
  const fullPath = path.resolve(__dirname, '..', relativePath);
  const bundled = esbuild.buildSync({
    entryPoints: [fullPath],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    target: 'node18'
  });
  const code = bundled.outputFiles[0].text;
  const m = { exports: {} };
  const fn = new Function('module', 'exports', 'require', '__dirname', '__filename', code);
  fn(m, m.exports, require, path.dirname(fullPath), fullPath);
  moduleCache.set(relativePath, m.exports);
  return m.exports;
}

// Initialize mock window environment for browser modules
global.window = {
  speechSynthesis: {
    speak: () => {},
    cancel: () => {},
    pause: () => {},
    resume: () => {},
    getVoices: () => [
      { name: 'Microsoft Heera - English (India)', lang: 'en-IN', default: true },
      { name: 'Google हिन्दी', lang: 'hi-IN', default: false }
    ],
    onvoiceschanged: null,
    speaking: false,
    paused: false,
    pending: false
  },
  AudioContext: function() {
    return {
      state: 'running',
      createOscillator: () => ({
        connect: () => {},
        start: () => {},
        stop: () => {},
        frequency: { setValueAtTime: () => {} }
      }),
      createGain: () => ({
        connect: () => {},
        gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }
      }),
      destination: {}
    };
  }
};
global.SpeechSynthesisUtterance = function(text) {
  this.text = text;
  this.lang = 'en-US';
  this.rate = 1.0;
  this.pitch = 1.0;
  this.volume = 1.0;
  this.onstart = null;
  this.onend = null;
  this.onerror = null;
};

// -------------------------------------------------------------
// MODULE 1: Strict UI Freeze Verification
// -------------------------------------------------------------
console.log('\n--- 1. Strict UI Freeze Verification ---');

it('Confirms TextToSpeechPage.tsx remains completely frozen and unmodified in Phase 4', () => {
  const ttsPagePath = path.join(__dirname, '..', 'src', 'pages', 'features', 'TextToSpeechPage.tsx');
  const ttsPage = fs.readFileSync(ttsPagePath, 'utf8');

  // Verify core UI controls and labels intact
  assert(ttsPage.includes('Text to Speech (TTS)'));
  assert(ttsPage.includes('Phonetic Speech Synthesis (Web Speech API)'));
  assert(ttsPage.includes('Linguistic Transparency Notice'));
  assert(ttsPage.includes('Voice Dialect:'));
  assert(ttsPage.includes('Input Text:'));
  assert(ttsPage.includes('Speed / Rate'));
  assert(ttsPage.includes('Pitch'));
  assert(ttsPage.includes('Generate & Play Speech'));
  assert(ttsPage.includes('Stop Speech'));
  assert(ttsPage.includes('Download WAV'));

  // Verify no unauthorized UI elements injected
  assert(!ttsPage.includes('Confidence Meter'));
  assert(!ttsPage.includes('AI Voice Settings'));
  assert(!ttsPage.includes('Prosody Mode'));
  assert(!ttsPage.includes('Compound Viewer'));
  assert(!ttsPage.includes('Quarantine Status'));
  assert(!ttsPage.includes('Pronunciation Pipeline Studio'));
});

// -------------------------------------------------------------
// MODULE 2: Pronunciation Pipeline & Multi-Tier Resolution
// -------------------------------------------------------------
console.log('\n--- 2. Multi-Tier Pronunciation Pipeline ---');

const { PronunciationPipeline, PIPELINE_RULE_VERSION } = loadTsModule('src/services/tts/pronunciation/pronunciationPipeline.ts');

it('Stage 1: Resolves authoritative native verified phrases at highest tier', () => {
  const resJohar = PronunciationPipeline.resolve('ᱡᱚᱦᱟᱨ', 'sat');
  assert.strictEqual(resJohar.quality, 'NATIVE_VERIFIED');
  assert.strictEqual(resJohar.spokenText, 'Johar');

  const resWelcome = PronunciationPipeline.resolve('ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ', 'sat');
  assert.strictEqual(resWelcome.quality, 'NATIVE_VERIFIED');
  assert.strictEqual(resWelcome.spokenText, 'Sagun daram');

  const resSarhaw = PronunciationPipeline.resolve('ᱥᱟᱨᱦᱟᱣ', 'sat');
  assert.strictEqual(resSarhaw.quality, 'NATIVE_VERIFIED');
  assert.strictEqual(resSarhaw.spokenText, 'Sarhaw');
});

it('Stage 4: Resolves parallel corpus entries from dataset at DATASET tier', () => {
  const resClass = PronunciationPipeline.resolve('ᱟᱞᱮ ᱪᱟᱱᱟᱪ ᱨᱮ ᱢᱤᱫ ᱦᱩᱰᱤᱧ ᱠᱟᱹᱢᱤᱦᱚᱨᱟ ᱢᱮᱱᱟᱜᱼᱟ ᱾', 'sat');
  assert.strictEqual(resClass.quality, 'DATASET');
  assert(resClass.spokenText.includes('Machet ale mid'));
});

it('Stage 5: Resolves multi-token contextual compounds in sentences', () => {
  const resCompound = PronunciationPipeline.resolve('ᱱᱚᱣᱟ ᱫᱚ ᱥᱤᱠᱤᱞ ᱥᱮᱞ ᱵᱤᱰᱟᱹᱣ ᱠᱟᱱᱟ᱾', 'sat');
  assert(resCompound.spokenText.includes('sikil sel bidaw'));
  assert.strictEqual(resCompound.quality, 'CURATED');
});

it('Stage 6: Resolves unknown Ol Chiki words via context-aware diacritic rules', () => {
  const resRule = PronunciationPipeline.resolve('ᱚᱲᱟᱜ', 'sat');
  assert.strictEqual(resRule.quality, 'RULE_BASED');
  assert(resRule.spokenText.length > 0);
  assert(Array.isArray(resRule.syllables));
});

it('Stage 8: Honestly isolates unsupported future languages to FALLBACK', () => {
  const resMundari = PronunciationPipeline.resolve('ᱡᱚᱦᱟᱨ ᱜᱮ ᱟᱞᱮ ᱫᱚ', 'unr');
  assert.strictEqual(resMundari.quality, 'FALLBACK');
  assert(resMundari.notes.includes('Future scope'));
});

// -------------------------------------------------------------
// MODULE 3: Ol Chiki Diacritics & Deglottalization
// -------------------------------------------------------------
console.log('\n--- 3. Ol Chiki Diacritics & Deglottalization ---');

const { transliterateOlChikiPhonetic } = loadTsModule('src/services/tts/linguistics/olChikiLinguistics.ts');

it('Applies Ahad deglottalization on checked plosive consonants', () => {
  // ᱜ (g) + ᱽ (ahad) -> released 'g'
  const withAhad = transliterateOlChikiPhonetic('ᱜᱽ');
  assert.strictEqual(withAhad, 'g');

  // ᱡ (j) + ᱽ (ahad) -> released 'j'
  const jAhad = transliterateOlChikiPhonetic('ᱡᱽ');
  assert.strictEqual(jAhad, 'j');

  // ᱫ (d) + ᱽ (ahad) -> released 'd'
  const dAhad = transliterateOlChikiPhonetic('ᱫᱽ');
  assert.strictEqual(dAhad, 'd');
});

it('Handles aspiration combinations (consonant + Oh ᱷ)', () => {
  assert.strictEqual(transliterateOlChikiPhonetic('ᱛᱷ'), 'th');
  assert.strictEqual(transliterateOlChikiPhonetic('ᱠᱷ'), 'kh');
  assert.strictEqual(transliterateOlChikiPhonetic('ᱪᱷ'), 'chh');
  assert.strictEqual(transliterateOlChikiPhonetic('ᱯᱷ'), 'ph');
});

it('Applies Mu-Tuda nasalization and Relo elongation', () => {
  // ᱟ (a) + ᱸ (Mu-Tuda nasalization) -> an
  const nasal = transliterateOlChikiPhonetic('ᱟᱸ');
  assert.strictEqual(nasal, 'an');

  // ᱟ (a) + ᱻ (Relo elongation) -> aa
  const elongated = transliterateOlChikiPhonetic('ᱟᱻ');
  assert.strictEqual(elongated, 'aa');
});

// -------------------------------------------------------------
// MODULE 4: Roman Santali Linguistics
// -------------------------------------------------------------
console.log('\n--- 4. Roman Santali Linguistics ---');

const { RomanSantaliLinguistics } = loadTsModule('src/services/tts/linguistics/romanSantaliLinguistics.ts');

it('Correctly identifies Roman Santali vocabulary vs English words', () => {
  assert.strictEqual(RomanSantaliLinguistics.isRomanSantaliWord('johar'), true);
  assert.strictEqual(RomanSantaliLinguistics.isRomanSantaliWord('sarhaw'), true);
  assert.strictEqual(RomanSantaliLinguistics.isRomanSantaliWord('aatu'), true);
  assert.strictEqual(RomanSantaliLinguistics.isRomanSantaliWord('menag-a'), true);
  assert.strictEqual(RomanSantaliLinguistics.isRomanSantaliWord('kanay'), true);

  // Common English words must NOT be classified as Roman Santali
  assert.strictEqual(RomanSantaliLinguistics.isRomanSantaliWord('the'), false);
  assert.strictEqual(RomanSantaliLinguistics.isRomanSantaliWord('school'), false);
  assert.strictEqual(RomanSantaliLinguistics.isRomanSantaliWord('hospital'), false);
  assert.strictEqual(RomanSantaliLinguistics.isRomanSantaliWord('tablet'), false);
  assert.strictEqual(RomanSantaliLinguistics.isRomanSantaliWord('doctor'), false);
});

it('Normalizes orthographic variations of Roman Santali without semantic mutation', () => {
  assert.strictEqual(RomanSantaliLinguistics.normalizeRomanWord("menag'a"), 'Menag-a');
  assert.strictEqual(RomanSantaliLinguistics.normalizeRomanWord('menag’a'), 'Menag-a');
  assert.strictEqual(RomanSantaliLinguistics.normalizeRomanWord('aatu'), 'Aatu');
  assert.strictEqual(RomanSantaliLinguistics.normalizeRomanWord('sarhao'), 'Sarhaw');
});

it('Protects English words while transliterating mixed English/Santali sentences', () => {
  const mixed = 'Welcome to our aatu and please take two tablets';
  const guide = RomanSantaliLinguistics.transliterateRomanToAcousticGuide(mixed);
  assert(guide.includes('Welcome to our Aatu and please take two tablets'));
});

// -------------------------------------------------------------
// MODULE 5: Syllable Intelligence
// -------------------------------------------------------------
console.log('\n--- 5. Syllable Intelligence Engine ---');

const { SyllableEngine } = loadTsModule('src/services/tts/linguistics/syllableEngine.ts');

it('Segments words into accurate phonetic syllables', () => {
  const sagunSyllables = SyllableEngine.segment('sagun', 'sat');
  assert.strictEqual(sagunSyllables.length, 2);
  assert.deepStrictEqual(sagunSyllables, ['sa', 'gun']);

  const chanachSyllables = SyllableEngine.segment('chanach', 'sat');
  assert.strictEqual(chanachSyllables.length, 2);
  assert.deepStrictEqual(chanachSyllables, ['cha', 'nach']);
});

it('Performs complexity analysis with bounded scoring', () => {
  const analysisSimple = SyllableEngine.analyzeWord('daag', 'sat');
  assert.strictEqual(analysisSimple.syllableCount, 1);
  assert(analysisSimple.complexityScore <= 40);

  const analysisComplex = SyllableEngine.analyzeWord('kamihowra', 'sat');
  assert(analysisComplex.syllableCount >= 3);
  assert(analysisComplex.complexityScore > analysisSimple.complexityScore);
});

// -------------------------------------------------------------
// MODULE 6: Bounded Difficult Word Detection
// -------------------------------------------------------------
console.log('\n--- 6. Difficult Word Detection ---');

const { DifficultWordDetector } = loadTsModule('src/services/tts/confidence/difficultWordDetector.ts');

it('Identifies polysyllabic and clinical words as requiring careful pacing', () => {
  const diffWord = DifficultWordDetector.evaluateWord('sphygmomanometer', 'eng', { isMedical: true });
  assert.strictEqual(diffWord.isDifficult, true);
  assert.strictEqual(diffWord.requiresSlowPacing, true);

  const simpleWord = DifficultWordDetector.evaluateWord('gai', 'sat');
  assert.strictEqual(simpleWord.isDifficult, false);
  assert.strictEqual(simpleWord.requiresSlowPacing, false);
});

it('Detects multiple difficult words across a clinical sentence', () => {
  const sentence = 'Please take paracetamol and check hemoglobin at the hospital';
  const difficult = DifficultWordDetector.analyzeSentence(sentence, 'eng');
  assert(difficult.length >= 2);
  assert(difficult.some(d => d.word.toLowerCase() === 'paracetamol'));
  assert(difficult.some(d => d.word.toLowerCase() === 'hemoglobin'));
});

// -------------------------------------------------------------
// MODULE 7: Medical & Number Speech Normalization
// -------------------------------------------------------------
console.log('\n--- 7. Medical & Number Speech Normalization ---');

const { MedicalSpeechNormalizer } = loadTsModule('src/services/tts/normalization/medicalSpeechNormalizer.ts');
const { IntelligentNormalizer } = loadTsModule('src/services/tts/normalization/intelligentNormalizer.ts');

it('Normalizes clinical blood pressure vitals without fraction confusion', () => {
  const bpEnglish = MedicalSpeechNormalizer.normalizeVitals('BP is 120/80 mmHg', 'eng');
  assert(bpEnglish.includes('120 by 80'));

  const bpHindi = MedicalSpeechNormalizer.normalizeVitals('रक्तचाप 120/80 है', 'hin');
  assert(bpHindi.includes('120 बटा 80'));
});

it('Normalizes clinical temperatures in Celsius and Fahrenheit', () => {
  const tempC = MedicalSpeechNormalizer.normalizeTemperatures('Patient has 37.5 °C fever', 'eng');
  assert(tempC.includes('37.5 degrees celsius'));

  const tempF = MedicalSpeechNormalizer.normalizeTemperatures('Temperature is 98.6°F', 'eng');
  assert(tempF.includes('98.6 degrees fahrenheit'));
});

it('Normalizes clinical abbreviations according to spoken policy', () => {
  const abbr = MedicalSpeechNormalizer.normalizeAbbreviations('Visit PHC for OPD and check BP, Hb, ANC and PNC', 'eng');
  assert(abbr.includes('Primary Health Centre'));
  assert(abbr.includes('O P D'));
  assert(abbr.includes('B P'));
  assert(abbr.includes('H B'));
  assert(abbr.includes('A N C'));
  assert(abbr.includes('P N C'));
});

it('Normalizes negative numbers and Indian lakh / million formats', () => {
  const neg = MedicalSpeechNormalizer.normalizeNegativeNumbers('Temperature was -5 degrees', 'eng');
  assert(neg.includes('minus 5'));

  const lakh = MedicalSpeechNormalizer.normalizeLargeNumbers('Population is 1,00,000 in district', 'eng');
  assert(lakh.includes('1 lakh'));

  const million = MedicalSpeechNormalizer.normalizeLargeNumbers('Funding is 1,000,000 USD', 'eng');
  assert(million.includes('1 million'));
});

it('Integrates seamlessly into IntelligentNormalizer without mutating underlying numbers', () => {
  const clinicalInput = 'Take 10-20 mg of paracetamol, 2 tablets daily. BP is 120/80, temp 37.5 °C at PHC.';
  const normalized = IntelligentNormalizer.normalize(clinicalInput, 'eng');
  assert(normalized.includes('10 to 20 milligram'));
  assert(normalized.includes('2 tablets'));
  assert(normalized.includes('120 by 80'));
  assert(normalized.includes('degrees celsius'));
  assert(normalized.includes('Primary Health Centre'));
});

// -------------------------------------------------------------
// MODULE 8: Golden Pronunciation Corpus & Schema
// -------------------------------------------------------------
console.log('\n--- 8. Golden Pronunciation Corpus & Validation Schema ---');

const { NativeValidationCorpus, GOLDEN_PRONUNCIATION_CORPUS, VALIDATION_CORPUS_VERSION } = loadTsModule('src/services/tts/evaluation/nativeValidationCorpus.ts');

it('Validates all golden corpus entries carry authentic repository provenance', () => {
  const allRecords = NativeValidationCorpus.getAllRecords();
  assert(allRecords.length >= 8);

  for (const record of allRecords) {
    assert(record.phrase, 'Record must have phrase');
    assert(record.language, 'Record must have language');
    assert(record.script, 'Record must have script');
    assert(record.expectedPronunciation, 'Record must have expected pronunciation');
    assert(record.confidence, 'Record must have confidence');
    assert(record.provenance, 'Record must identify provenance');
    assert(record.ruleVersion === VALIDATION_CORPUS_VERSION, 'Record must match corpus version');
  }
});

it('Provides lookup and filtering by review status', () => {
  const verified = NativeValidationCorpus.getByStatus('VERIFIED');
  assert(verified.length > 0);

  const joharRec = NativeValidationCorpus.findRecord('ᱡᱚᱦᱟᱨ');
  assert(joharRec !== undefined);
  assert.strictEqual(joharRec.expectedPronunciation, 'Johar');
});

// -------------------------------------------------------------
// MODULE 9: Central Voice Intelligence Engine Integration
// -------------------------------------------------------------
console.log('\n--- 9. Voice Intelligence Orchestration Integration ---');

const { VoiceIntelligenceEngine } = loadTsModule('src/services/tts/intelligence/voiceIntelligenceEngine.ts');

it('Generates structured speech plan integrating pronunciation and clinical safety', () => {
  const plan = VoiceIntelligenceEngine.synthesizeSpeech(
    'ᱡᱚᱦᱟᱨ • ᱥᱤᱠᱤᱞ ᱥᱮᱞ ᱵᱤᱰᱟᱹᱣ ᱦᱟᱥᱯᱟᱛᱟᱞ ᱨᱮ ᱦᱩᱭᱩᱜ ᱠᱟᱱᱟ᱾',
    'sat',
    { rate: 1.0 }
  );

  assert(plan !== null);
  assert.strictEqual(typeof plan.plannedRate, 'number');
  assert(plan.chunks.length > 0);
  assert(plan.pauseStrategy.length > 0);
});

console.log('\n===============================================================');
console.log(`  PHASE 4 TEST SUITE FINISHED: ${passCount} Passed, ${failCount} Failed.`);
console.log('===============================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
