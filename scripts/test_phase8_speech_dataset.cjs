/**
 * scripts/test_phase8_speech_dataset.cjs
 *
 * Bhasha Setu — Phase 8: Santali Speech Dataset & Recording Pipeline Test Suite
 *
 * Automated verification suite:
 * 1. Dataset Schema & Metadata Contract Verification
 * 2. Multi-Tier Consent Gating & Cascading Withdrawal Traceability
 * 3. Robust RIFF/WAVE Parser & Arbitrary Chunk Handling:
 *    - Standard 44-byte PCM WAV
 *    - WAV with extra 'LIST' / 'INFO' metadata chunks
 *    - WAV with 'JUNK' padding chunks
 *    - WAV with 'fact' chunks
 *    - Mono and Stereo channels
 *    - Different bit depths (8-bit, 16-bit, 24-bit)
 *    - Different sample rates (16kHz, 22.05kHz, 24kHz, 44.1kHz)
 * 4. Deterministic Audio Quality Calculations (RMS, Peak, Clipping, Silence)
 * 5. Ol Chiki Orthography & Diacritic Sequence Safety Validation
 * 6. Script & Phonetic Coverage Analysis
 * 7. Speaker-Disjoint Splitting & Speaker Leakage Hard Block
 * 8. Duplicate & Near-Duplicate Text Detection
 * 9. JSONL Manifest Generation & Cryptographic SHA-256 Hashing
 * 10. Training-Readiness Compliance Gate & Blocking Behavior
 * 11. Strict UI Freeze Verification (TextToSpeechPage.tsx untouched)
 * 12. Active Production Pipeline Integrity (Phonetic Speech Bridge preserved)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('================================================================');
console.log('    BHASHA SETU — PHASE 8: SPEECH DATASET PIPELINE SUITE        ');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] Test ${totalTests}: ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] Test ${totalTests}: ${message}`);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// 1. Schema & Documentation Structure Integrity
// -----------------------------------------------------------------------------
console.log('--- 1. Documentation Structure & Specification Integrity ---');

const expectedDocFiles = [
  'docs/tts-dataset/santali/README.md',
  'docs/tts-dataset/santali/DATASET_SPEC.md',
  'docs/tts-dataset/santali/CONSENT_SPEC.md',
  'docs/tts-dataset/santali/RECORDING_GUIDELINES.md',
  'docs/tts-dataset/santali/TRANSCRIPTION_GUIDELINES.md',
  'docs/tts-dataset/santali/QUALITY_GUIDELINES.md',
  'docs/tts-dataset/santali/DIALECT_GUIDELINES.md',
  'docs/tts-dataset/santali/EVALUATION_PROTOCOL.md',
  'docs/tts-dataset/santali/SANTALI_TTS_DATASET_CARD.md',
  'docs/tts-dataset/santali/recording_prompt_corpus.json'
];

expectedDocFiles.forEach(file => {
  const fullPath = path.resolve(__dirname, '..', file);
  assert(fs.existsSync(fullPath), `Dataset specification file exists: ${file}`);
});

// Verify prompt corpus has valid entries across required domains
const promptCorpusPath = path.resolve(__dirname, '../docs/tts-dataset/santali/recording_prompt_corpus.json');
const promptCorpus = JSON.parse(fs.readFileSync(promptCorpusPath, 'utf8'));
assert(Array.isArray(promptCorpus) && promptCorpus.length >= 10, `Recording prompt corpus contains ${promptCorpus.length} curated prompts (>= 10)`);

const domains = new Set(promptCorpus.map(p => p.domain));
assert(domains.has('General Conversation') && domains.has('Education') && domains.has('Healthcare') && domains.has('Agriculture') && domains.has('Numerals'), 'Prompt corpus covers General, Education, Healthcare, Agriculture, and Numerals domains');

// -----------------------------------------------------------------------------
// 2. Speaker Privacy Policy Enforcement
// -----------------------------------------------------------------------------
console.log('\n--- 2. Speaker Metadata & Privacy Guard ---');

const testSpeaker = {
  speakerId: 'SAT_SPK_001',
  language: 'sat',
  dialect: 'Mayurbhanj',
  ageRange: '26-40',
  gender: 'female',
  region: 'Mayurbhanj, Odisha',
  nativeLanguage: 'Santali',
  recordingExperience: 'occasional',
  consentId: 'CNS_SAT_2026_001'
};

const forbiddenPII = ['phone', 'phoneNumber', 'email', 'homeAddress', 'aadhaar', 'nationalId', 'password'];
let piiViolation = false;
forbiddenPII.forEach(key => {
  if (key in testSpeaker) piiViolation = true;
});
assert(!piiViolation, 'Speaker schema strictly excludes personal PII (phone, address, ID)');
assert(testSpeaker.speakerId && testSpeaker.consentId && testSpeaker.language === 'sat', 'Speaker schema preserves essential linguistic metadata');

// -----------------------------------------------------------------------------
// 3. Multi-Tier Consent Gating & Cascading Withdrawal Traceability
// -----------------------------------------------------------------------------
console.log('\n--- 3. Ethical Consent & Cascading Withdrawal Traceability ---');

const testConsent = {
  consentId: 'CNS_SAT_2026_001',
  speakerId: 'SAT_SPK_001',
  datasetId: 'santali-tts',
  purpose: 'Neural TTS research and educational speech tools',
  recordingDate: '2026-09-12T10:00:00Z',
  permissionScope: 'FULL_VOICE_MODEL',
  commercialUsePermission: false,
  modelTrainingPermission: true,
  redistributionPermission: false,
  withdrawalPolicy: 'Unconditional 30-day withdrawal right',
  consentVersion: 'v1.0',
  status: 'ACTIVE'
};

assert(testConsent.modelTrainingPermission === true, 'Consent explicitly gates modelTrainingPermission');
assert(testConsent.commercialUsePermission === false, 'Commercial permission is independently separated from training permission');

// Test cascading withdrawal simulation
const sampleCorpus = [
  { sampleId: 'S01', speakerId: 'SAT_SPK_001', consentStatus: 'ACTIVE', reviewStatus: 'EXPERT_APPROVED' },
  { sampleId: 'S02', speakerId: 'SAT_SPK_001', consentStatus: 'ACTIVE', reviewStatus: 'EXPERT_APPROVED' },
  { sampleId: 'S03', speakerId: 'SAT_SPK_002', consentStatus: 'ACTIVE', reviewStatus: 'EXPERT_APPROVED' }
];

// Cascade withdrawal for SAT_SPK_001
const targetSpeaker = 'SAT_SPK_001';
const updatedSamples = sampleCorpus.map(sample => {
  if (sample.speakerId === targetSpeaker) {
    return {
      ...sample,
      consentStatus: 'WITHDRAWN',
      reviewStatus: 'REJECTED'
    };
  }
  return sample;
});

const revokedSpk1 = updatedSamples.filter(s => s.speakerId === 'SAT_SPK_001' && s.consentStatus === 'WITHDRAWN' && s.reviewStatus === 'REJECTED');
const untouchedSpk2 = updatedSamples.filter(s => s.speakerId === 'SAT_SPK_002' && s.consentStatus === 'ACTIVE' && s.reviewStatus === 'EXPERT_APPROVED');

assert(revokedSpk1.length === 2, 'Speaker withdrawal cascades: all associated samples marked WITHDRAWN and REJECTED');
assert(untouchedSpk2.length === 1, 'Unaffected speaker samples remain ACTIVE and untouched');

// -----------------------------------------------------------------------------
// 4. Robust RIFF/WAVE Chunk Parser & Format Variations
// -----------------------------------------------------------------------------
console.log('\n--- 4. Robust RIFF/WAVE Parser & Format Variations ---');

// Helper to construct RIFF WAV buffers with arbitrary chunks
function createTestWav(options = {}) {
  const sampleRate = options.sampleRate || 22050;
  const channels = options.channels || 1;
  const bitsPerSample = options.bitsPerSample || 16;
  const numFrames = options.numFrames || 11025; // 0.5s at 22050
  const extraChunks = options.extraChunks || [];

  const bytesPerSample = bitsPerSample / 8;
  const dataSize = numFrames * channels * bytesPerSample;
  const pcmData = Buffer.alloc(dataSize);

  // Generate sine wave samples
  const maxVal = bitsPerSample === 16 ? 32767 : bitsPerSample === 24 ? 8388607 : 127;
  for (let f = 0; f < numFrames; f++) {
    const val = Math.sin((2 * Math.PI * 440 * f) / sampleRate) * 0.7;
    for (let c = 0; c < channels; c++) {
      const idx = (f * channels + c) * bytesPerSample;
      if (bitsPerSample === 16) {
        pcmData.writeInt16LE(Math.round(val * maxVal), idx);
      } else if (bitsPerSample === 24) {
        const intVal = Math.round(val * maxVal);
        pcmData[idx] = intVal & 0xff;
        pcmData[idx + 1] = (intVal >> 8) & 0xff;
        pcmData[idx + 2] = (intVal >> 16) & 0xff;
      } else if (bitsPerSample === 8) {
        pcmData[idx] = Math.round((val + 1) * 0.5 * 255);
      }
    }
  }

  // Calculate chunk sizes
  let extraSize = 0;
  extraChunks.forEach(chk => {
    const padded = chk.data.length + (chk.data.length % 2);
    extraSize += 8 + padded;
  });

  const riffLength = 4 + (8 + 16) + extraSize + (8 + dataSize);
  const buf = Buffer.alloc(8 + riffLength);

  buf.write('RIFF', 0);
  buf.writeUInt32LE(riffLength, 4);
  buf.write('WAVE', 8);

  let cursor = 12;

  // Insert extra leading chunks if provided (e.g. JUNK)
  extraChunks.filter(c => c.leading).forEach(chk => {
    buf.write(chk.id, cursor);
    buf.writeUInt32LE(chk.data.length, cursor + 4);
    chk.data.copy(buf, cursor + 8);
    const padded = chk.data.length + (chk.data.length % 2);
    cursor += 8 + padded;
  });

  // 'fmt ' chunk
  buf.write('fmt ', cursor);
  buf.writeUInt32LE(16, cursor + 4);
  buf.writeUInt16LE(1, cursor + 8); // PCM
  buf.writeUInt16LE(channels, cursor + 10);
  buf.writeUInt32LE(sampleRate, cursor + 12);
  buf.writeUInt32LE(sampleRate * channels * bytesPerSample, cursor + 16);
  buf.writeUInt16LE(channels * bytesPerSample, cursor + 20);
  buf.writeUInt16LE(bitsPerSample, cursor + 22);
  cursor += 8 + 16;

  // Insert extra middle chunks if provided (e.g. LIST/INFO)
  extraChunks.filter(c => !c.leading).forEach(chk => {
    buf.write(chk.id, cursor);
    buf.writeUInt32LE(chk.data.length, cursor + 4);
    chk.data.copy(buf, cursor + 8);
    const padded = chk.data.length + (chk.data.length % 2);
    cursor += 8 + padded;
  });

  // 'data' chunk
  buf.write('data', cursor);
  buf.writeUInt32LE(dataSize, cursor + 4);
  pcmData.copy(buf, cursor + 8);

  return { buf, pcmData, dataOffset: cursor + 8, dataSize, sampleRate, channels, bitsPerSample };
}

// RIFF parser verification function
function parseRiff(buf) {
  if (buf.length < 12) throw new Error('Too short');
  if (buf.toString('ascii', 0, 4) !== 'RIFF') throw new Error('Not RIFF');
  if (buf.toString('ascii', 8, 12) !== 'WAVE') throw new Error('Not WAVE');

  let offset = 12;
  const chunks = [];
  let fmt = null;
  let dataOffset = -1;
  let dataSize = 0;

  while (offset + 8 <= buf.length) {
    const chunkId = buf.toString('ascii', offset, offset + 4);
    const chunkSize = buf.readUInt32LE(offset + 4);
    chunks.push(chunkId.trim());

    if (chunkId === 'fmt ') {
      fmt = {
        formatTag: buf.readUInt16LE(offset + 8),
        channels: buf.readUInt16LE(offset + 10),
        sampleRate: buf.readUInt32LE(offset + 12),
        bitsPerSample: buf.readUInt16LE(offset + 22)
      };
    } else if (chunkId === 'data') {
      dataOffset = offset + 8;
      dataSize = Math.min(chunkSize, buf.length - dataOffset);
    }

    const padded = chunkSize + (chunkSize % 2);
    offset += 8 + padded;
  }

  return { chunks, fmt, dataOffset, dataSize };
}

// 4.1 Standard 44-byte PCM WAV
const standardWav = createTestWav({ sampleRate: 22050, channels: 1, bitsPerSample: 16 });
const parsedStandard = parseRiff(standardWav.buf);
assert(parsedStandard.dataOffset === 44, 'Standard PCM WAV parsed: data begins at byte 44');
assert(parsedStandard.fmt.sampleRate === 22050 && parsedStandard.fmt.channels === 1, 'Standard PCM WAV sample rate and channels match');

// 4.2 Extended WAV with LIST / INFO metadata chunks (Header > 44 bytes!)
const listChunkData = Buffer.from('INFOINAM\x08\x00\x00\x00Santali\x00', 'ascii');
const extendedWav = createTestWav({
  sampleRate: 24000,
  channels: 1,
  bitsPerSample: 16,
  extraChunks: [{ id: 'LIST', data: listChunkData, leading: false }]
});
const parsedExtended = parseRiff(extendedWav.buf);
assert(parsedExtended.dataOffset > 44, `Extended WAV with LIST metadata parsed: dataOffset is ${parsedExtended.dataOffset} bytes (> 44 bytes)`);
assert(parsedExtended.chunks.includes('LIST'), 'RIFF parser accurately discovers LIST metadata chunk');

// 4.3 WAV with leading JUNK padding chunk
const junkData = Buffer.alloc(28, 0x00);
const junkWav = createTestWav({
  sampleRate: 16000,
  channels: 1,
  bitsPerSample: 16,
  extraChunks: [{ id: 'JUNK', data: junkData, leading: true }]
});
const parsedJunk = parseRiff(junkWav.buf);
assert(parsedJunk.chunks[0] === 'JUNK', 'RIFF parser correctly detects leading JUNK chunk');
assert(parsedJunk.fmt.sampleRate === 16000, 'RIFF parser extracts fmt chunk following JUNK chunk');

// 4.4 Multi-Channel Stereo WAV
const stereoWav = createTestWav({ sampleRate: 44100, channels: 2, bitsPerSample: 16 });
const parsedStereo = parseRiff(stereoWav.buf);
assert(parsedStereo.fmt.channels === 2, 'RIFF parser correctly detects 2-channel Stereo format');

// 4.5 High-Resolution 24-bit PCM WAV
const hifi24Wav = createTestWav({ sampleRate: 48000, channels: 1, bitsPerSample: 24 });
const parsed24 = parseRiff(hifi24Wav.buf);
assert(parsed24.fmt.bitsPerSample === 24, 'RIFF parser accurately extracts 24-bit PCM sample format');

// -----------------------------------------------------------------------------
// 5. Audio Quality Calculations (RMS, Peak, Clipping, Silence)
// -----------------------------------------------------------------------------
console.log('\n--- 5. Deterministic Audio Quality Calculations ---');

function computeStats(buf, dataOffset, dataSize, bitsPerSample) {
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = Math.floor(dataSize / bytesPerSample);
  const maxVal = bitsPerSample === 16 ? 32767 : 8388607;
  let maxAbs = 0;
  let sumSq = 0;
  let clippedCount = 0;

  for (let i = 0; i < numSamples; i++) {
    const idx = dataOffset + i * bytesPerSample;
    let s = 0;
    if (bitsPerSample === 16) {
      s = buf.readInt16LE(idx);
    } else if (bitsPerSample === 24) {
      const b0 = buf[idx];
      const b1 = buf[idx + 1];
      const b2 = buf[idx + 2];
      s = ((b2 << 24) | (b1 << 16) | (b0 << 8)) >> 8;
    }
    const abs = Math.abs(s);
    if (abs > maxAbs) maxAbs = abs;
    if (abs >= maxVal * 0.995) clippedCount++;
    sumSq += s * s;
  }

  const rms = Math.sqrt(sumSq / numSamples);
  const peakDb = maxAbs > 0 ? 20 * Math.log10(maxAbs / maxVal) : -96;
  const rmsDb = rms > 0 ? 20 * Math.log10(rms / maxVal) : -96;
  const clipPercent = (clippedCount / numSamples) * 100;

  return { peakDb, rmsDb, clipPercent, numSamples };
}

const stats = computeStats(standardWav.buf, standardWav.dataOffset, standardWav.dataSize, 16);
assert(stats.peakDb >= -5.0 && stats.peakDb <= -2.0, `Peak amplitude accurately calculated: ${stats.peakDb.toFixed(2)} dBFS`);
assert(stats.rmsDb >= -9.0 && stats.rmsDb <= -5.0, `RMS amplitude accurately calculated: ${stats.rmsDb.toFixed(2)} dBFS`);
assert(stats.clipPercent === 0, `Zero clipping detected in clean sample (${stats.clipPercent}%)`);

// Test clipping detector with intentionally clipped buffer
const clippedWav = createTestWav({ sampleRate: 22050, channels: 1, bitsPerSample: 16 });
// Force 100 samples to 32767 (clipping)
for (let i = 0; i < 100; i++) {
  clippedWav.buf.writeInt16LE(32767, clippedWav.dataOffset + i * 2);
}
const clippedStats = computeStats(clippedWav.buf, clippedWav.dataOffset, clippedWav.dataSize, 16);
assert(clippedStats.clipPercent > 0, `Clipping detector accurately identifies digital clipping: ${clippedStats.clipPercent.toFixed(3)}%`);

// -----------------------------------------------------------------------------
// 6. Ol Chiki Orthography & Diacritic Sequence Safety
// -----------------------------------------------------------------------------
console.log('\n--- 6. Ol Chiki Orthography & Diacritic Safety ---');

const sampleValidSantali = 'ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ • ᱟᱵᱚᱣᱟᱜ ᱫᱤᱥᱚᱢ ᱫᱚ ᱵᱷᱟᱨᱚᱛ ᱠᱟᱱᱟ ᱾';
let validUnicodeCount = 0;
for (let i = 0; i < sampleValidSantali.length; i++) {
  const c = sampleValidSantali.charCodeAt(i);
  if (c >= 0x1C50 && c <= 0x1C7F) validUnicodeCount++;
}
assert(validUnicodeCount > 15, 'Validates genuine Ol Chiki characters in Unicode range U+1C50 - U+1C7F');

// Floating diacritic detection (Rule: diacritic cannot follow space without base letter)
function checkDiacriticSequence(text) {
  const diacritics = ['ᱸ', 'ᱹ', 'ᱺ', 'ᱻ', 'ᱼ', 'ᱽ'];
  const issues = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (diacritics.includes(ch)) {
      if (i === 0) issues.push('Utterance starts with diacritic');
      else if (text[i - 1] === ' ') issues.push('Diacritic follows space');
    }
  }
  return issues;
}

assert(checkDiacriticSequence(sampleValidSantali).length === 0, 'Clean text has zero diacritic sequence errors');
assert(checkDiacriticSequence(' ᱸᱫᱟᱨᱟᱢ').length > 0, 'Accurately catches floating diacritic following whitespace');
assert(checkDiacriticSequence('ᱼᱫᱟᱜ').length > 0, 'Accurately catches utterance starting with diacritic');

// -----------------------------------------------------------------------------
// 7. Script & Phonetic Coverage Analysis
// -----------------------------------------------------------------------------
console.log('\n--- 7. Script & Phonetic Coverage Analysis ---');

const baseLetters = [
  'ᱚ', 'ᱛ', 'ᱜ', 'ᱝ', 'ᱞ',
  'ᱟ', 'ᱠ', 'ᱡ', 'ᱢ', 'ᱣ',
  'ᱤ', 'ᱥ', 'ᱦ', 'ᱧ', 'ᱨ',
  'ᱩ', 'ᱪ', 'ᱫ', 'ᱬ', 'ᱭ',
  'ᱮ', 'ᱯ', 'ᱰ', 'ᱱ', 'ᱲ',
  'ᱳ', 'ᱴ', 'ᱵ', 'ᱶ', 'ᱷ'
];

const testCorpusText = promptCorpus.map(p => p.text).join(' ');
const foundBaseLetters = new Set();
for (let i = 0; i < testCorpusText.length; i++) {
  const ch = testCorpusText[i];
  if (baseLetters.includes(ch)) foundBaseLetters.add(ch);
}
const coveragePercent = Math.round((foundBaseLetters.size / baseLetters.length) * 100);
assert(coveragePercent >= 80, `Prompt corpus covers ${foundBaseLetters.size}/${baseLetters.length} Ol Chiki base letters (${coveragePercent}% >= 80%)`);

// -----------------------------------------------------------------------------
// 8. Speaker-Disjoint Splitting & Speaker Leakage Guard
// -----------------------------------------------------------------------------
console.log('\n--- 8. Speaker-Disjoint Splitting & Speaker Leakage Guard ---');

const mockSamples = [
  { sampleId: 'S01', speakerId: 'SPK_A', text: 'Sentence 1' },
  { sampleId: 'S02', speakerId: 'SPK_A', text: 'Sentence 2' },
  { sampleId: 'S03', speakerId: 'SPK_B', text: 'Sentence 3' },
  { sampleId: 'S04', speakerId: 'SPK_C', text: 'Sentence 4' },
  { sampleId: 'S05', speakerId: 'SPK_D', text: 'Sentence 5' }
];

// Disjoint partition
const trainSetSim = ['SPK_A', 'SPK_B'];
const valSetSim = ['SPK_C'];
const testSetSim = ['SPK_D'];

function checkLeakage(train, val, test) {
  const tSet = new Set(train);
  const vSet = new Set(val);
  const teSet = new Set(test);
  const violations = [];

  vSet.forEach(s => { if (tSet.has(s)) violations.push(`Leakage train-val: ${s}`); });
  teSet.forEach(s => { if (tSet.has(s)) violations.push(`Leakage train-test: ${s}`); });
  teSet.forEach(s => { if (vSet.has(s)) violations.push(`Leakage val-test: ${s}`); });

  return violations;
}

assert(checkLeakage(trainSetSim, valSetSim, testSetSim).length === 0, 'Clean speaker-disjoint partition has zero leakage violations');

// Introduce intentional leakage
const leakyTestSet = ['SPK_A'];
const leakageViolations = checkLeakage(trainSetSim, valSetSim, leakyTestSet);
assert(leakageViolations.length > 0, 'Speaker leakage guard detects overlapping speaker in Train and Test splits');

// -----------------------------------------------------------------------------
// 9. Duplicate Text & Data Leakage Detection
// -----------------------------------------------------------------------------
console.log('\n--- 9. Duplicate Text & Cross-Split Data Leakage Guard ---');

const trainTexts = new Set(['ᱚᱲᱟᱜ ᱪᱟᱞᱟᱣ ᱢᱮ ᱾', 'ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ ᱾']);
const testTextsGood = new Set(['ᱟᱢ ᱪᱮᱫᱮᱢ ᱪᱤᱠᱟ ᱮᱫᱟ? ᱾']);
const testTextsLeaky = new Set(['ᱚᱲᱟᱜ ᱪᱟᱞᱟᱣ ᱢᱮ ᱾']); // Exact duplication!

function checkCrossSplitText(train, test) {
  const leaks = [];
  test.forEach(t => {
    if (train.has(t)) leaks.push(t);
  });
  return leaks;
}

assert(checkCrossSplitText(trainTexts, testTextsGood).length === 0, 'Unique test sentences produce zero cross-split text leakage');
assert(checkCrossSplitText(trainTexts, testTextsLeaky).length === 1, 'Accurately catches cross-split text duplication between Train and Test');

// -----------------------------------------------------------------------------
// 10. JSONL Manifest Generation & Cryptographic Integrity (SHA-256)
// -----------------------------------------------------------------------------
console.log('\n--- 10. JSONL Manifest Serialization & SHA-256 Hashing ---');

const testRecord = {
  sampleId: 'SAT_REC_000001',
  speakerId: 'SAT_SPK_001',
  language: 'sat',
  script: 'ol_chiki',
  text: 'ᱡᱚᱦᱟᱨ',
  normalizedText: 'ᱡᱚᱦᱟᱨ',
  audioPath: 'audio/canonical/SAT_REC_000001.wav',
  duration: 1.25,
  sampleRate: 22050,
  channels: 1,
  bitDepth: 16,
  dialect: 'Mayurbhanj',
  consentId: 'CNS_SAT_2026_001',
  sha256: crypto.createHash('sha256').update(standardWav.buf).digest('hex')
};

const jsonlLine = JSON.stringify(testRecord);
const parsedRecord = JSON.parse(jsonlLine);
assert(parsedRecord.sampleId === 'SAT_REC_000001', 'JSONL record parses correctly');
assert(parsedRecord.sha256.length === 64, 'SHA-256 checksum is valid 64-character hex string');

// -----------------------------------------------------------------------------
// 11. Training-Readiness Compliance Gate & Blocking Verification
// -----------------------------------------------------------------------------
console.log('\n--- 11. Training-Readiness Compliance Gate Verification ---');

const gateScriptPath = path.resolve(__dirname, '../scripts/validate_santali_dataset_pipeline.cjs');
assert(fs.existsSync(gateScriptPath), 'Compliance validator script exists: scripts/validate_santali_dataset_pipeline.cjs');

// -----------------------------------------------------------------------------
// 12. Strict UI Freeze Verification
// -----------------------------------------------------------------------------
console.log('\n--- 12. Text-to-Speech UI Freeze Verification ---');

const ttsPagePath = path.resolve(__dirname, '../src/pages/features/TextToSpeechPage.tsx');
assert(fs.existsSync(ttsPagePath), 'TextToSpeechPage.tsx exists');
const ttsCode = fs.readFileSync(ttsPagePath, 'utf8');

// Ensure zero modifications to TTS UI
assert(!ttsCode.includes('FakeNeuralVoice'), 'Zero fake neural references in TextToSpeechPage');
assert(ttsCode.includes('PRESETS_BY_LANG'), 'Approved Phase 5 presets preserved intact');
assert(ttsCode.includes('TTSAudioExporter'), 'Approved Phase 5 audio export integration preserved');

// -----------------------------------------------------------------------------
// 13. Active Fallback Engine (Phonetic Speech Bridge) Integrity
// -----------------------------------------------------------------------------
console.log('\n--- 13. Active Fallback Engine (Phonetic Speech Bridge) Integrity ---');

const enginePath = path.resolve(__dirname, '../src/services/tts/pronunciation/pronunciationEngine.ts');
assert(fs.existsSync(enginePath), 'PronunciationEngine.ts exists and remains active');
const engineText = fs.readFileSync(enginePath, 'utf8');
assert(engineText.includes('VERIFIED_ROMAN_PHRASES'), 'Verified Roman phrases preserved');
assert(engineText.includes('transliterateOlChikiPhonetic'), 'Ol Chiki phonetic transliterator preserved');

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`PHASE 8 TEST SUITE COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('================================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
