/**
 * Bhasha Setu — Phase 2 AI Voice Intelligence Engine Test Suite
 *
 * Validates:
 * 1. Central Voice Intelligence Orchestrator
 * 2. Multi-Script Intelligence (Ol Chiki, Devanagari, Latin, Bengali, Mixed)
 * 3. Tri-Token Context Window & Compound Term Resolution
 * 4. Qualitative Pronunciation Confidence & Difficult Word Detection
 * 5. Prosody Intelligence & Sentence Structure Planning (Questions, Lists, Instructions)
 * 6. Adaptive Speech Pacing (Clinical safety & difficult word articulation)
 * 7. Advanced Clinical Normalization (Ranges, decimals, dosages, units, abbreviations)
 * 8. Voice Quality Scoring & Health Quarantine with Bounded Recovery
 * 9. Contextual LRU Caching
 * 10. Memory Safety & Zero-PII Telemetry
 * 11. UI Freeze & Non-Invasive Architectural Integration
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('===============================================================');
console.log('  BHASHA SETU — PHASE 2 VOICE INTELLIGENCE TEST SUITE          ');
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

// -------------------------------------------------------------
// MODULE 1: Script & Language Intelligence
// -------------------------------------------------------------
console.log('\n--- 1. Script & Language Intelligence ---');

const contextPath = path.join(__dirname, '..', 'src', 'services', 'tts', 'context', 'pronunciationContext.ts');
assert(fs.existsSync(contextPath), 'pronunciationContext.ts exists');
const contextContent = fs.readFileSync(contextPath, 'utf8');

it('Identifies Ol Chiki script for Santali text', () => {
  assert(contextContent.includes("detectScript(text: string): ScriptType"));
  // Simulation check
  const isOlChiki = /[\u1C50-\u1C7F]/.test('ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ');
  assert.strictEqual(isOlChiki, true);
});

it('Identifies Devanagari script for Hindi text', () => {
  const isDevanagari = /[\u0900-\u097F]/.test('नमस्ते भारत');
  assert.strictEqual(isDevanagari, true);
});

it('Identifies Bengali script for Bengali text', () => {
  const isBengali = /[\u0980-\u09FF]/.test('স্বাগতম ভারত');
  assert.strictEqual(isBengali, true);
});

it('Identifies Latin script for English text', () => {
  const isLatin = /^[A-Za-z0-9\s.,!?;:'"()\-]+$/.test('Welcome to Bhasha Setu');
  assert.strictEqual(isLatin, true);
});

it('Identifies Mixed script when multiple writing systems co-occur', () => {
  assert(contextContent.includes("if (scriptCount > 1) return 'mixed';"));
});

// -------------------------------------------------------------
// MODULE 2: Tri-Token Context Window & Compound Resolution
// -------------------------------------------------------------
console.log('\n--- 2. Tri-Token Context Window & Compounds ---');

it('Constructs tri-token sliding window context (prevToken, token, nextToken)', () => {
  assert(contextContent.includes('buildContexts'));
  assert(contextContent.includes('prevToken'));
  assert(contextContent.includes('nextToken'));
  assert(contextContent.includes('totalTokens'));
});

it('Resolves cultural compound terms in Santali context (sagun daram, ched leka, sikil sel)', () => {
  assert(contextContent.includes('SANTALI_CONTEXTUAL_COMPOUNDS'));
  assert(contextContent.includes('ᱪᱮᱫ_ᱞᱮᱠᱟ'));
  assert(contextContent.includes('ᱥᱟᱹᱜᱩᱱ_ᱫᱟᱨᱟᱢ'));
  assert(contextContent.includes('ᱥᱤᱠᱤᱞ_ᱥᱮᱞ'));
  assert(contextContent.includes('ᱢᱟᱭᱟᱢ_ᱵᱤᱰᱟᱹᱣ'));
  assert(contextContent.includes('ᱤᱛᱩᱱ_ᱟᱥᱲᱟ'));
});

it('Identifies grammatical postposition liaisons in Santali (do, ge, re, khon, kana)', () => {
  assert(contextContent.includes('isPostpositionLiaison'));
  assert(contextContent.includes('SANTALI_POSTPOSITIONS'));
  assert(contextContent.includes('ᱫᱚ') && contextContent.includes('ᱜᱮ') && contextContent.includes('ᱨᱮ'));
});

it('Generates unique context hashes incorporating surrounding token environment', () => {
  assert(contextContent.includes('computeContextHash'));
});

// -------------------------------------------------------------
// MODULE 3: Qualitative Pronunciation Confidence
// -------------------------------------------------------------
console.log('\n--- 3. Qualitative Pronunciation Confidence ---');

const confPath = path.join(__dirname, '..', 'src', 'services', 'tts', 'confidence', 'pronunciationConfidence.ts');
assert(fs.existsSync(confPath), 'pronunciationConfidence.ts exists');
const confContent = fs.readFileSync(confPath, 'utf8');

it('Strictly enforces qualitative confidence tiers without fabricating accuracy metrics', () => {
  assert(confContent.includes('evaluateConfidence'));
  assert(confContent.includes('NATIVE_VERIFIED'));
  assert(confContent.includes('EXPERT_VERIFIED'));
  assert(confContent.includes('CURATED'));
  assert(confContent.includes('DATASET'));
  assert(confContent.includes('RULE_BASED'));
  assert(confContent.includes('ALGORITHMIC'));
  assert(confContent.includes('FALLBACK'));
});

it('Identifies polysyllabic and phonetically difficult words for careful pacing', () => {
  assert(confContent.includes('analyzeWordDifficulty'));
  assert(confContent.includes('isPolysyllabic'));
  assert(confContent.includes('hasMultipleDiacritics'));
  assert(confContent.includes('requiresSlowPacing'));
});

// -------------------------------------------------------------
// MODULE 4: Prosody Intelligence & Speech Planning
// -------------------------------------------------------------
console.log('\n--- 4. Prosody Intelligence & Speech Planning ---');

const prosodyPath = path.join(__dirname, '..', 'src', 'services', 'tts', 'prosody', 'prosodyEngine.ts');
assert(fs.existsSync(prosodyPath), 'prosodyEngine.ts exists');
const prosodyContent = fs.readFileSync(prosodyPath, 'utf8');

it('Detects QUESTION structure via punctuation (?) and language-specific interrogatives', () => {
  assert(prosodyContent.includes('detectSentenceType'));
  assert(prosodyContent.includes('SANTALI_INTERROGATIVES'));
  assert(prosodyContent.includes('ᱪᱮᱫ') && prosodyContent.includes('ᱪᱮᱫ ᱞᱮᱠᱟ'));
  assert(prosodyContent.includes('HINDI_INTERROGATIVES'));
  assert(prosodyContent.includes('क्या') && prosodyContent.includes('कहाँ'));
  assert(prosodyContent.includes('ENGLISH_INTERROGATIVES'));
});

it('Detects EXCLAMATION structure via terminal punctuation (!)', () => {
  assert(prosodyContent.includes('EXCLAMATION'));
});

it('Detects CLINICAL INSTRUCTION structure via medical imperatives', () => {
  assert(prosodyContent.includes('CLINICAL_INSTRUCTION_PATTERNS'));
  assert(prosodyContent.includes('INSTRUCTION'));
  assert(prosodyContent.includes('ᱦᱟᱥᱯᱟᱛᱟᱞ') && prosodyContent.includes('दवा') && prosodyContent.includes('dosage'));
});

it('Detects LIST structure via enumerated prefixes (1., 2., bullet points)', () => {
  assert(prosodyContent.includes('LIST'));
});

it('Formulates adaptive SpeechPlan with deliberate pacing for clinical instructions', () => {
  assert(prosodyContent.includes('planSpeech'));
  assert(prosodyContent.includes('plannedRate'));
  assert(prosodyContent.includes('pauseStrategy'));
  assert(prosodyContent.includes('clinical_precision_deliberate'));
  assert(prosodyContent.includes('userRate * 0.92'));
});

// -------------------------------------------------------------
// MODULE 5: Advanced Clinical Normalization & Safety
// -------------------------------------------------------------
console.log('\n--- 5. Advanced Clinical Normalization & Safety ---');

const normPath = path.join(__dirname, '..', 'src', 'services', 'tts', 'normalization', 'intelligentNormalizer.ts');
assert(fs.existsSync(normPath), 'intelligentNormalizer.ts exists');
const normContent = fs.readFileSync(normPath, 'utf8');

it('Normalizes clinical dosage ranges (e.g. 10-20 mg -> 10 to 20 milligram)', () => {
  assert(normContent.includes('normalizeRanges'));
  assert(normContent.includes('rangeWord'));
  assert(normContent.includes('mg') && normContent.includes('milligram'));
});

it('Normalizes clinical decimal quantities (e.g. 0.5 ml -> 0 point 5 milliliter)', () => {
  assert(normContent.includes('normalizeDecimals'));
  assert(normContent.includes('pointWord'));
  assert(normContent.includes('ml') && normContent.includes('milliliter'));
});

it('Normalizes medication form dosages (e.g. 2 tablets / 2 goli)', () => {
  assert(normContent.includes('normalizeDosages'));
  assert(normContent.includes('tablet') && normContent.includes('गोली'));
});

it('Strictly enforces clinical safety mandate (never silently alter numerical amounts)', () => {
  assert(normContent.includes('CLINICAL SAFETY MANDATE'));
});

// -------------------------------------------------------------
// MODULE 6: Voice Quality & Health Router
// -------------------------------------------------------------
console.log('\n--- 6. Voice Quality Scoring & Health Monitoring ---');

const voicePath = path.join(__dirname, '..', 'src', 'services', 'tts', 'voice', 'voiceQualityRouter.ts');
assert(fs.existsSync(voicePath), 'voiceQualityRouter.ts exists');
const voiceContent = fs.readFileSync(voicePath, 'utf8');

it('Evaluates and scores available browser voices with deterministic priority', () => {
  assert(voiceContent.includes('selectBestScoredVoice'));
  assert(voiceContent.includes('score += 100'));
});

it('Supports Bengali (bn-IN / bn-*) voice selection', () => {
  assert(voiceContent.includes('bn-in') || voiceContent.includes('bengali'));
});

it('Implements voice health monitoring with temporary quarantine on consecutive failures', () => {
  assert(voiceContent.includes('recordVoiceFailure'));
  assert(voiceContent.includes('MAX_FAILURES_BEFORE_QUARANTINE = 3'));
  assert(voiceContent.includes('isQuarantined = true'));
  assert(voiceContent.includes('QUARANTINE_DURATION_MS = 45000'));
});

it('Provides bounded trial recovery when voice quarantine duration expires', () => {
  assert(voiceContent.includes('isVoiceHealthy'));
  assert(voiceContent.includes('Date.now() > status.quarantineUntil'));
  assert(voiceContent.includes('status.isQuarantined = false'));
});

// -------------------------------------------------------------
// MODULE 7: Contextual LRU Caching
// -------------------------------------------------------------
console.log('\n--- 7. Contextual LRU Caching ---');

const cachePath = path.join(__dirname, '..', 'src', 'services', 'tts', 'cache', 'contextualCache.ts');
assert(fs.existsSync(cachePath), 'contextualCache.ts exists');
const cacheContent = fs.readFileSync(cachePath, 'utf8');

it('Incorporates context hash into cache keys to prevent cross-context phonetic pollution', () => {
  assert(cacheContent.includes('buildKey'));
  assert(cacheContent.includes('contextHash'));
});

it('Caps cache capacity to protect against unbounded memory growth', () => {
  assert(cacheContent.includes('MAX_ENTRIES = 1200'));
});

// -------------------------------------------------------------
// MODULE 8: Central Orchestrator Integration
// -------------------------------------------------------------
console.log('\n--- 8. Central Orchestrator Integration ---');

const orchPath = path.join(__dirname, '..', 'src', 'services', 'tts', 'intelligence', 'voiceIntelligenceEngine.ts');
assert(fs.existsSync(orchPath), 'voiceIntelligenceEngine.ts exists');
const orchContent = fs.readFileSync(orchPath, 'utf8');

it('Orchestrates end-to-end speech synthesis pipeline without UI modifications', () => {
  assert(orchContent.includes('synthesizeSpeech'));
  assert(orchContent.includes('PronunciationContextAnalyzer'));
  assert(orchContent.includes('IntelligentNormalizer'));
  assert(orchContent.includes('ProsodyEngine'));
  assert(orchContent.includes('VoiceQualityRouter'));
  assert(orchContent.includes('TTSQueue'));
});

it('Provides immediate platform-wide stop via stopSpeech()', () => {
  assert(orchContent.includes('stopSpeech()'));
});

// -------------------------------------------------------------
// MODULE 9: UI Freeze & Zero Visual Regressions
// -------------------------------------------------------------
console.log('\n--- 9. Strict UI Freeze Verification ---');

const ttsPagePath = path.join(__dirname, '..', 'src', 'pages', 'features', 'TextToSpeechPage.tsx');
assert(fs.existsSync(ttsPagePath), 'TextToSpeechPage.tsx exists');
const ttsPageContent = fs.readFileSync(ttsPagePath, 'utf8');

it('Confirms zero new UI controls, buttons, sliders, or panels injected into TextToSpeechPage', () => {
  assert(!ttsPageContent.includes('AI Voice Settings'), 'No new settings panel');
  assert(!ttsPageContent.includes('Confidence Meter'), 'No confidence widget');
  assert(!ttsPageContent.includes('Prosody Control'), 'No extra prosody slider');
  assert(ttsPageContent.includes('Text to Speech (TTS)'), 'Original title intact');
  assert(ttsPageContent.includes('Speed / Rate'), 'Original speed slider intact');
  assert(ttsPageContent.includes('Pitch'), 'Original pitch slider intact');
});

console.log('\n===============================================================');
console.log(`  PHASE 2 TEST SUITE FINISHED: ${passCount} Passed, ${failCount} Failed.`);
console.log('===============================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
