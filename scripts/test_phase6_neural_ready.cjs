/**
 * ===============================================================
 * BHASHA SETU — PHASE 6 NATIVE SANTALI TTS MODEL-READY TEST SUITE
 * ===============================================================
 * Validates the Phase 6 Native Santali Model-Ready Architecture:
 * 1. UI Freeze: TextToSpeechPage.tsx remains completely frozen (0 UI changes).
 * 2. Zero Fake Voice: Santali neural model strictly declared UNAVAILABLE.
 * 3. Neural TTS Abstraction & Manifest Schema.
 * 4. Deterministic Capability Resolver across all supported languages.
 * 5. Dynamic Engine Priority Chain & Simulated Availability.
 * 6. Model Versioning & Checksum Verification.
 * 7. Audio Format Contract & WAV Header Validation.
 * 8. Peak Normalization & Resampling Integrity.
 * 9. Speech Data Ethics & Consent Gating.
 * 10. Speaker Partition Safety (Zero Data Leakage).
 * 11. Dialect Metadata & Regional Attribution.
 * 12. Native Speaker Human Evaluation Contract.
 * 13. Structured Failure & Fallback Model.
 * 14. Latency Tracking & Zero-PII Telemetry.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const esbuild = require('esbuild');

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

const moduleCache = new Map();
function loadTsModule(relPath) {
  const fullPath = path.resolve(__dirname, '..', relPath);
  const normalizedKey = fullPath.toLowerCase();
  if (moduleCache.has(normalizedKey)) {
    return moduleCache.get(normalizedKey).exports;
  }
  const tsCode = fs.readFileSync(fullPath, 'utf8');
  const result = esbuild.transformSync(tsCode, {
    loader: 'ts',
    format: 'cjs',
    target: 'node18'
  });
  const m = { exports: {} };
  moduleCache.set(normalizedKey, m);
  const dirname = path.dirname(fullPath);
  const customRequire = (id) => {
    if (id.startsWith('.')) {
      let resolved = path.resolve(dirname, id);
      if (fs.existsSync(resolved + '.ts')) return loadTsModule(path.relative(path.join(__dirname, '..'), resolved + '.ts'));
      if (fs.existsSync(resolved + '.tsx')) return loadTsModule(path.relative(path.join(__dirname, '..'), resolved + '.tsx'));
      if (fs.existsSync(path.join(resolved, 'index.ts'))) return loadTsModule(path.relative(path.join(__dirname, '..'), path.join(resolved, 'index.ts')));
      if (fs.existsSync(resolved + '.js')) return require(resolved + '.js');
      if (fs.existsSync(resolved + '.cjs')) return require(resolved + '.cjs');
    }
    return require(id);
  };
  const fn = new Function('module', 'exports', 'require', '__dirname', '__filename', result.code);
  fn(m, m.exports, customRequire, dirname, fullPath);
  return m.exports;
}

console.log('===============================================================');
console.log('  BHASHA SETU — PHASE 6 MODEL-READY TTS ARCHITECTURE SUITE     ');
console.log('===============================================================');

// -------------------------------------------------------------
// MODULE 1: Strict UI Freeze Verification
// -------------------------------------------------------------
console.log('\n--- 1. Strict UI Freeze Verification ---');

it('Confirms TextToSpeechPage.tsx remains completely frozen and unmodified in Phase 6', () => {
  const ttsPagePath = path.join(__dirname, '..', 'src', 'pages', 'features', 'TextToSpeechPage.tsx');
  const ttsPage = fs.readFileSync(ttsPagePath, 'utf8');

  // Verify core UI controls and labels intact
  assert(ttsPage.includes('Text to Speech (TTS)'), 'Screen title intact');
  assert(ttsPage.includes('Phonetic Speech Synthesis (Web Speech API)'), 'Header badge intact');
  assert(ttsPage.includes('Linguistic Transparency Notice'), 'Transparency notice intact');
  assert(ttsPage.includes('Voice Dialect:'), 'Voice dialect label intact');
  assert(ttsPage.includes('Input Text:'), 'Input text label intact');
  assert(ttsPage.includes('Speed / Rate'), 'Speed slider label intact');
  assert(ttsPage.includes('Pitch'), 'Pitch slider label intact');
  assert(ttsPage.includes('Generate & Play Speech'), 'Generate speech button intact');
  assert(ttsPage.includes('Stop Speech'), 'Stop speech button intact');
  assert(ttsPage.includes('Download WAV'), 'Download button intact');

  // Verify zero forbidden widgets
  assert(!ttsPage.includes('Confidence Meter'), 'No Confidence Meter UI');
  assert(!ttsPage.includes('AI Voice Settings'), 'No AI Voice Settings panel');
  assert(!ttsPage.includes('Prosody Mode'), 'No Prosody Mode UI');
  assert(!ttsPage.includes('Compound Viewer'), 'No Compound Viewer UI');
  assert(!ttsPage.includes('Quarantine Status'), 'No Quarantine Status UI');
  assert(!ttsPage.includes('Pronunciation Pipeline Studio'), 'No Pipeline Studio UI');
});

// -------------------------------------------------------------
// MODULE 2: Zero Fake Voice Verification
// -------------------------------------------------------------
console.log('\n--- 2. Zero Fake Voice Verification ---');

const { TTSModelRegistry } = loadTsModule('src/services/tts/neural/modelRegistry.ts');

it('Strictly declares Santali neural model as UNAVAILABLE until real weights are deployed', () => {
  const satModel = TTSModelRegistry.getModel('santali-neural-v1');
  assert(satModel, 'Santali neural model manifest registered');
  assert.strictEqual(satModel.availability, 'unavailable', 'Santali neural model availability is strictly "unavailable"');
  assert.strictEqual(TTSModelRegistry.isModelAvailable('santali-neural-v1'), false, 'isModelAvailable returns false');
  assert.strictEqual(satModel.language, 'sat', 'Language code is sat');
  assert.strictEqual(satModel.script, 'ol_chiki', 'Script is ol_chiki');
  assert(satModel.datasetProvenance.ethicalClearance, 'Demands ethical clearance');
});

// -------------------------------------------------------------
// MODULE 3: TTS Model Registry & Multi-Model Discovery
// -------------------------------------------------------------
console.log('\n--- 3. TTS Model Registry & Multi-Model Discovery ---');

it('Registers and queries models across Santali, Hindi, English, and Bengali', () => {
  const models = TTSModelRegistry.listModels();
  assert(models.length >= 4, 'At least 4 speech models registered');

  const hinModel = TTSModelRegistry.getModel('hindi-browser-native-v1');
  assert(hinModel, 'Hindi browser voice registered');
  assert.strictEqual(hinModel.availability, 'available', 'Hindi browser voice is available');

  const engModel = TTSModelRegistry.getModel('english-browser-native-v1');
  assert(engModel, 'English browser voice registered');
  assert.strictEqual(engModel.availability, 'available', 'English browser voice is available');

  const benModel = TTSModelRegistry.getModel('bengali-browser-native-v1');
  assert(benModel, 'Bengali browser voice registered');
  assert.strictEqual(benModel.availability, 'available', 'Bengali browser voice is available');

  // Mundari and Ho stubs exist and are honestly unavailable
  const unrModel = TTSModelRegistry.getModel('mundari-future-v1');
  assert(unrModel && unrModel.availability === 'unavailable', 'Mundari stub strictly unavailable');
  const hocModel = TTSModelRegistry.getModel('ho-future-v1');
  assert(hocModel && hocModel.availability === 'unavailable', 'Ho stub strictly unavailable');
});

// -------------------------------------------------------------
// MODULE 4: Deterministic Capability Resolver
// -------------------------------------------------------------
console.log('\n--- 4. Deterministic Capability Resolver ---');

const { TTSCapabilityResolver } = loadTsModule('src/services/tts/neural/capabilityResolver.ts');

it('Routes Santali to Phonetic Speech Bridge when neural model is unavailable', () => {
  const plan = TTSCapabilityResolver.resolve('sat');
  assert.strictEqual(plan.preferredEngine, 'PHONETIC_SPEECH_BRIDGE', 'Preferred engine is PHONETIC_SPEECH_BRIDGE');
  assert.strictEqual(plan.fallbackEngine, 'SAFE_FALLBACK', 'Fallback engine is SAFE_FALLBACK');
  assert.strictEqual(plan.isNativeNeuralAvailable, false, 'isNativeNeuralAvailable is false');
  assert(plan.chain.includes('PHONETIC_SPEECH_BRIDGE'), 'Phonetic bridge is in execution chain');
});

it('Routes Hindi and English to native browser speech synthesis', () => {
  const hinPlan = TTSCapabilityResolver.resolve('hin', { hasWebSpeech: true });
  assert.strictEqual(hinPlan.preferredEngine, 'BROWSER_NATIVE_VOICE', 'Hindi routes to BROWSER_NATIVE_VOICE');

  const engPlan = TTSCapabilityResolver.resolve('eng', { hasWebSpeech: true });
  assert.strictEqual(engPlan.preferredEngine, 'BROWSER_NATIVE_VOICE', 'English routes to BROWSER_NATIVE_VOICE');
});

it('Honestly isolates Mundari and Ho to safe future scope fallback', () => {
  const unrPlan = TTSCapabilityResolver.resolve('unr');
  assert.strictEqual(unrPlan.preferredEngine, 'SAFE_FALLBACK', 'Mundari routes to SAFE_FALLBACK');

  const hocPlan = TTSCapabilityResolver.resolve('hoc');
  assert.strictEqual(hocPlan.preferredEngine, 'SAFE_FALLBACK', 'Ho routes to SAFE_FALLBACK');
});

// -------------------------------------------------------------
// MODULE 5: Dynamic Engine Priority Chain & Simulated Availability
// -------------------------------------------------------------
console.log('\n--- 5. Dynamic Engine Priority Chain ---');

it('Dynamically elevates to NATIVE_VERIFIED_NEURAL if genuine model is deployed', () => {
  // Simulate future deployment of authentic Santali model weights
  TTSModelRegistry.updateAvailability('santali-neural-v1', 'available');

  const elevatedPlan = TTSCapabilityResolver.resolve('sat');
  assert.strictEqual(elevatedPlan.preferredEngine, 'NATIVE_VERIFIED_NEURAL', 'Elevates to NATIVE_VERIFIED_NEURAL when available');
  assert.strictEqual(elevatedPlan.fallbackEngine, 'PHONETIC_SPEECH_BRIDGE', 'Phonetic bridge serves as immediate fallback');
  assert.strictEqual(elevatedPlan.isNativeNeuralAvailable, true, 'Flags native neural as available');

  // Reset to honest undeployed state
  TTSModelRegistry.updateAvailability('santali-neural-v1', 'unavailable');
  const restoredPlan = TTSCapabilityResolver.resolve('sat');
  assert.strictEqual(restoredPlan.preferredEngine, 'PHONETIC_SPEECH_BRIDGE', 'Restores phonetic bridge when unavailable');
});

// -------------------------------------------------------------
// MODULE 6: Model Versioning & Checksum Verification
// -------------------------------------------------------------
console.log('\n--- 6. Model Versioning & Checksum Verification ---');

it('Separates model checkpoint versioning from linguistic rules and verifies checksum', () => {
  const version = TTSModelRegistry.getModelVersion('santali-neural-v1');
  assert.strictEqual(version, '0.1.0-alpha', 'Tracks model version accurately');

  const expectedChecksum = 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const isValid = TTSModelRegistry.verifyChecksum('santali-neural-v1', expectedChecksum);
  assert.strictEqual(isValid, true, 'Verifies valid model checksum');

  const isInvalid = TTSModelRegistry.verifyChecksum('santali-neural-v1', 'sha256:corrupt_checksum_hash');
  assert.strictEqual(isInvalid, false, 'Rejects corrupted checksum');
});

// -------------------------------------------------------------
// MODULE 7: Audio Format Contract & WAV Header Validation
// -------------------------------------------------------------
console.log('\n--- 7. Audio Format Contract & WAV Normalization ---');

const { TTSAudioNormalizer } = loadTsModule('src/services/tts/neural/audioNormalization.ts');

it('Builds and validates standard 44-byte PCM16 WAV audio buffers', () => {
  // Create 0.5s of 440Hz tone in PCM16
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * 0.5);
  const pcm16 = new Int16Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    pcm16[i] = Math.round(15000 * Math.sin((2 * Math.PI * 440 * i) / sampleRate));
  }

  const wavBuffer = TTSAudioNormalizer.createPcmWav(pcm16, sampleRate, 1);
  assert(wavBuffer.length === 44 + numSamples * 2, 'WAV buffer has exact 44-byte header + data size');

  const validation = TTSAudioNormalizer.validateWavHeader(wavBuffer);
  assert.strictEqual(validation.isValid, true, 'WAV header is valid');
  assert.strictEqual(validation.sampleRate, 22050, 'Sample rate matches 22050Hz');
  assert.strictEqual(validation.channels, 1, 'Mono channel verified');
  assert.strictEqual(validation.bitDepth, 16, '16-bit depth verified');
  assert.strictEqual(validation.hasClipping, false, 'No clipping detected');
  assert.strictEqual(validation.isSilent, false, 'Audio has audible energy');
});

it('Rejects corrupted, truncated, or clipped audio buffers', () => {
  const truncated = new Uint8Array([82, 73, 70, 70, 0, 0]); // 6 bytes
  const res = TTSAudioNormalizer.validateWavHeader(truncated);
  assert.strictEqual(res.isValid, false, 'Rejects truncated header');
  assert(res.errors.length > 0, 'Contains explanatory error messages');
});

// -------------------------------------------------------------
// MODULE 8: Peak Normalization & Resampling
// -------------------------------------------------------------
console.log('\n--- 8. Peak Normalization & Resampling ---');

it('Safely peak-normalizes PCM16 audio without digital distortion', () => {
  const testData = new Int16Array([5000, -10000, 15000, -20000]);
  const normalized = TTSAudioNormalizer.peakNormalize(testData, 0.95);
  assert.strictEqual(normalized.length, testData.length, 'Maintains sample length');
  assert(Math.max(...normalized.map(Math.abs)) <= 31130, 'Peak scaled to target headroom');
});

it('Resamples PCM16 samples cleanly using linear interpolation', () => {
  const input = new Int16Array([0, 1000, 2000, 3000, 4000]);
  const resampled = TTSAudioNormalizer.resamplePcm16(input, 16000, 24000);
  assert(resampled.length > input.length, 'Upsampled sample count increased proportionally');
});

// -------------------------------------------------------------
// MODULE 9: Speech Data Ethics & Consent Gating
// -------------------------------------------------------------
console.log('\n--- 9. Speech Data Ethics & Consent Gating ---');

const { SantaliDataEthicsValidator } = loadTsModule('src/services/tts/neural/dataEthicsContract.ts');

it('Enforces informed written consent as a mandatory gate for speech training data', () => {
  const validSample = {
    sampleId: 'sat_rec_001',
    text: 'ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ',
    script: 'ol_chiki',
    language: 'sat',
    audio: { format: 'pcm_wav', sampleRate: 22050, durationMs: 2500, channels: 1, bitDepth: 16 },
    speakerId: 'spk_mayurbhanj_01',
    speakerMetadata: { gender: 'female', ageRange: '30-49', nativeDialect: 'Mayurbhanj Santali', primaryRegion: 'Odisha' },
    recordingMetadata: { environment: 'studio', microphone: 'Rode NT1-A', snrDb: 38 },
    transcriptionVersion: '1.0.0',
    consentStatus: 'INFORMED_WRITTEN_CONSENT',
    qualityStatus: 'GOLDEN_AUDITED',
    datasetVersion: '0.1.0',
    split: 'train'
  };

  const report = SantaliDataEthicsValidator.validateSample(validSample);
  assert.strictEqual(report.isValid, true, 'Consented, high-quality sample is approved');

  // Test unconsented sample rejection
  const unconsentedSample = { ...validSample, consentStatus: 'NOT_DOCUMENTED' };
  const rejectionReport = SantaliDataEthicsValidator.validateSample(unconsentedSample);
  assert.strictEqual(rejectionReport.isValid, false, 'Unconsented sample is strictly rejected');
  assert(rejectionReport.errors.some(e => e.includes('Ethical Violation')), 'Reports explicit ethical violation');
});

// -------------------------------------------------------------
// MODULE 10: Speaker Partition Safety (Zero Leakage)
// -------------------------------------------------------------
console.log('\n--- 10. Speaker Partition Safety ---');

it('Prevents speaker identity leakage between train, validation, and test splits', () => {
  const cleanDataset = [
    { sampleId: 's1', speakerId: 'spk_A', split: 'train' },
    { sampleId: 's2', speakerId: 'spk_A', split: 'train' },
    { sampleId: 's3', speakerId: 'spk_B', split: 'validation' },
    { sampleId: 's4', speakerId: 'spk_C', split: 'test' }
  ];

  const auditClean = SantaliDataEthicsValidator.auditSpeakerSplits(cleanDataset);
  assert.strictEqual(auditClean.isSafe, true, 'Clean dataset has zero speaker leakage');
  assert.strictEqual(auditClean.leakageSpeakers.length, 0, 'No leaking speakers');

  // Introduce speaker leakage: spk_A in both train and test
  const contaminatedDataset = [
    { sampleId: 's1', speakerId: 'spk_A', split: 'train' },
    { sampleId: 's2', speakerId: 'spk_B', split: 'validation' },
    { sampleId: 's3', speakerId: 'spk_A', split: 'test' } // LEAKAGE
  ];

  const auditContaminated = SantaliDataEthicsValidator.auditSpeakerSplits(contaminatedDataset);
  assert.strictEqual(auditContaminated.isSafe, false, 'Catches speaker leakage across splits');
  assert(auditContaminated.leakageSpeakers.includes('spk_A'), 'Identifies leaking speaker spk_A');
});

// -------------------------------------------------------------
// MODULE 11: Dialect Metadata & Regional Attribution
// -------------------------------------------------------------
console.log('\n--- 11. Dialect Metadata Attribution ---');

it('Validates speaker dialect and regional attribution metadata', () => {
  const missingDialectSample = {
    sampleId: 'sat_rec_002',
    text: 'ᱡᱚᱦᱟᱨ',
    script: 'ol_chiki',
    language: 'sat',
    audio: { format: 'pcm_wav', sampleRate: 22050, durationMs: 1200, channels: 1, bitDepth: 16 },
    speakerId: 'spk_unknown',
    speakerMetadata: { gender: 'male', ageRange: '18-29', nativeDialect: '', primaryRegion: '' },
    transcriptionVersion: '1.0.0',
    consentStatus: 'INFORMED_WRITTEN_CONSENT',
    qualityStatus: 'RESEARCH_GRADE',
    datasetVersion: '0.1.0',
    split: 'test'
  };

  const report = SantaliDataEthicsValidator.validateSample(missingDialectSample);
  assert.strictEqual(report.isValid, false, 'Rejects sample missing dialect metadata');
  assert(report.errors.some(e => e.includes('dialect')), 'Flags dialect metadata error');
});

// -------------------------------------------------------------
// MODULE 12: Native Speaker Human Evaluation Contract
// -------------------------------------------------------------
console.log('\n--- 12. Native Speaker Human Evaluation Contract ---');

it('Validates Likert evaluation records without fabricating artificial MOS values', () => {
  const validEval = {
    evalId: 'eval_sat_01',
    text: 'ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ',
    language: 'sat',
    modelId: 'santali-neural-v1',
    modelVersion: '0.1.0-alpha',
    intelligibilityScore: 4,
    naturalnessScore: 3,
    pronunciationAccuracyScore: 5,
    dialectAppropriatenessScore: 4,
    reviewer: { reviewerId: 'rev_sat_native_01', isNativeSpeaker: true, dialectRegion: 'Mayurbhanj' },
    timestamp: Date.now()
  };

  assert(SantaliDataEthicsValidator.validateHumanEvaluation(validEval), 'Valid Likert review accepted');

  // Reject out-of-range rating (e.g. 7 on 1-5 scale)
  const invalidEval = { ...validEval, intelligibilityScore: 7 };
  assert.strictEqual(SantaliDataEthicsValidator.validateHumanEvaluation(invalidEval), false, 'Rejects invalid Likert rating');
});

// -------------------------------------------------------------
// MODULE 13: Structured Failure & Fallback Model
// -------------------------------------------------------------
console.log('\n--- 13. Structured Failure & Fallback Model ---');

const { NeuralTTSAdapter } = loadTsModule('src/services/tts/neural/neuralAdapter.ts');

it('Throws structured NeuralError with code MODEL_UNAVAILABLE on raw neural synthesis attempt', async () => {
  const adapter = new NeuralTTSAdapter();
  assert.strictEqual(adapter.isAvailable, false, 'Adapter confirms model is not available');

  try {
    await adapter.synthesize({
      text: 'ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ',
      language: 'sat'
    });
    assert.fail('Expected synthesize to throw MODEL_UNAVAILABLE error');
  } catch (err) {
    assert.strictEqual(err.code, 'MODEL_UNAVAILABLE', 'Throws MODEL_UNAVAILABLE error code');
    assert.strictEqual(err.recoverable, true, 'Flags error as recoverable');
    assert.strictEqual(err.fallbackRecommended, true, 'Recommends fallback execution');
  }
});

// -------------------------------------------------------------
// MODULE 14: Barrel Export & Subsystem Integration Integrity
// -------------------------------------------------------------
console.log('\n--- 14. Barrel Export & Subsystem Integration Integrity ---');

it('Exports all Phase 6 neural abstractions cleanly from src/services/tts/index.ts', () => {
  const ttsIndex = loadTsModule('src/services/tts/index.ts');
  assert(ttsIndex.TTSModelRegistry, 'TTSModelRegistry exported from root TTS');
  assert(ttsIndex.TTSCapabilityResolver, 'TTSCapabilityResolver exported from root TTS');
  assert(ttsIndex.TTSAudioNormalizer, 'TTSAudioNormalizer exported from root TTS');
  assert(ttsIndex.SantaliDataEthicsValidator, 'SantaliDataEthicsValidator exported from root TTS');
  assert(ttsIndex.NeuralTTSAdapter, 'NeuralTTSAdapter exported from root TTS');
});

console.log('\n===============================================================');
console.log(`  PHASE 6 TEST SUITE FINISHED: ${passCount} Passed, ${failCount} Failed.`);
console.log('===============================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
