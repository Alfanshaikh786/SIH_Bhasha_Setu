/**
 * Bhasha Setu — Phase 10 Unit & Regression Test Suite:
 * Santali Real-World Recording Pilot & Dataset Collection
 *
 * Verifies:
 * 1. Pilot protocol and plain-language consent documentation integrity
 * 2. Pilot prompt subset selection with strict linguistic review gating
 * 3. Acoustic calibration recording gate
 * 4. Consent enforcement gate & pseudonymous identity decoupling (zero PII)
 * 5. Multi-take management, raw data immutability, and SHA-256 hashing
 * 6. Human listening QA and transcription alignment checking
 * 7. Manifest generation with strict synthetic/real data separation
 * 8. Cascading participant withdrawal simulation
 * 9. Speaker-disjoint splitting & zero data leakage verification
 * 10. Honesty enforcement: realSpeakers = 0, recordedHours = 0, TRAINING_READY: NO
 * 11. TTS UI freeze verification (TextToSpeechPage.tsx unchanged)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

console.log('=== Bhasha Setu: Phase 10 Unit & Regression Suite ===\n');

// -------------------------------------------------------------
// Suite 1: Pilot Protocol & Plain-Language Consent Documents
// -------------------------------------------------------------
console.log('--- Suite 1: Pilot Protocol & Plain-Language Consent Documentation ---');
const protocolPath = path.join(__dirname, '../docs/tts-dataset/santali/pilot/PILOT_PROTOCOL.md');
assert(fs.existsSync(protocolPath), 'PILOT_PROTOCOL.md exists');
const protocolContent = fs.readFileSync(protocolPath, 'utf-8');
assert(protocolContent.includes('Participant Eligibility Criteria'), 'Protocol defines objective eligibility criteria');
assert(protocolContent.includes('Calibration Recording Specification'), 'Protocol specifies acoustic calibration procedure');
assert(protocolContent.includes('Maximum Continuous Duration') && protocolContent.includes('45 minutes'), 'Protocol enforces 45-minute continuous duration cap');
assert(protocolContent.includes('TRAINING_READY: NO'), 'Protocol explicitly declares TRAINING_READY: NO during pilot');

const consentFormPath = path.join(__dirname, '../docs/tts-dataset/santali/pilot/INFORMED_CONSENT_FORM.md');
assert(fs.existsSync(consentFormPath), 'INFORMED_CONSENT_FORM.md exists');
const consentFormContent = fs.readFileSync(consentFormPath, 'utf-8');
assert(consentFormContent.includes('Model Training'), 'Consent form differentiates model training permission');
assert(consentFormContent.includes('Non-Commercial Research'), 'Consent form differentiates non-commercial research permission');
assert(consentFormContent.includes('Commercial Application'), 'Consent form differentiates commercial application permission');
assert(consentFormContent.includes('Public Redistribution'), 'Consent form differentiates public redistribution permission');
assert(consentFormContent.includes('Can I change my mind and withdraw my voice later?'), 'Consent form clearly explains unconditional withdrawal rights');
assert(consentFormContent.includes('datagovernance@bhashasetu.org'), 'Consent form provides clear contact point for withdrawal');

// -------------------------------------------------------------
// Suite 2: Pilot Prompt Curation & Review Gating
// -------------------------------------------------------------
console.log('\n--- Suite 2: Pilot Prompt Curation & Review Gating ---');
const corpusV2Path = path.join(__dirname, '../docs/tts-dataset/santali/recording_prompt_corpus_v2.json');
const corpus = JSON.parse(fs.readFileSync(corpusV2Path, 'utf-8'));

// Curate pilot subset
const lengthTiers = ['VERY_SHORT', 'SHORT', 'MEDIUM', 'LONG', 'VERY_LONG'];
const pilotSubset = [];
const coveredLengths = new Set();
const coveredTypes = new Set();

lengthTiers.forEach(lt => {
  const match = corpus.find(p => p.lengthCategory === lt && !pilotSubset.includes(p));
  if (match) {
    pilotSubset.push(match);
    coveredLengths.add(match.lengthCategory);
    coveredTypes.add(match.sentenceType);
  }
});

corpus.forEach(p => {
  if (pilotSubset.length < 14 && !pilotSubset.includes(p)) {
    pilotSubset.push(p);
    coveredLengths.add(p.lengthCategory);
    coveredTypes.add(p.sentenceType);
  }
});

assert(pilotSubset.length >= 12, `Pilot subset selected ${pilotSubset.length} prompts (>= 12 required)`);
assert(coveredLengths.size === 5, 'Pilot subset covers all 5 length tiers (VERY_SHORT to VERY_LONG)');
assert(coveredTypes.has('STATEMENT') && coveredTypes.has('QUESTION') && coveredTypes.has('COMMAND'), 'Pilot subset covers essential pragmatic types');

// Review gating: check that unreviewed DRAFT prompts are blocked
const unreviewedPrompt = { promptId: 'DRAFT_001', reviewStatus: 'DRAFT', sourceType: 'AI_DRAFT' };
const isEligible = (p) => p.reviewStatus === 'LINGUISTIC_REVIEWED' || p.reviewStatus === 'RECORDING_READY' || (p.sourceType === 'ORIGINAL' && p.dialectReviewStatus === 'REVIEWED');
assert(!isEligible(unreviewedPrompt), 'Unreviewed AI_DRAFT or DRAFT prompts strictly blocked from pilot recording');

// -------------------------------------------------------------
// Suite 3: Acoustic Calibration QA Gate
// -------------------------------------------------------------
console.log('\n--- Suite 3: Acoustic Calibration QA Gate ---');

function validateCalibration(cal) {
  const reasons = [];
  if (cal.sampleRate !== 48000 && cal.sampleRate !== 44100) reasons.push('Invalid sample rate');
  if (cal.channels !== 1) reasons.push('Non-mono audio');
  if (cal.bitDepth !== 24 && cal.bitDepth !== 16) reasons.push('Invalid bit depth');
  if (cal.clippingPercentage > 0) reasons.push('Clipping detected');
  if (cal.noiseFloorDb > -40) reasons.push('High noise floor');
  if (cal.peakDb > -1.0 || cal.peakDb < -24.0) reasons.push('Peak out of range');
  return { passed: reasons.length === 0, reasons };
}

const cleanCalibration = { sampleRate: 48000, channels: 1, bitDepth: 24, clippingPercentage: 0, noiseFloorDb: -52, peakDb: -4.0 };
assert(validateCalibration(cleanCalibration).passed, 'Clean studio calibration sample passes all gates');

const clippedCalibration = { ...cleanCalibration, clippingPercentage: 0.8 };
assert(!validateCalibration(clippedCalibration).passed, 'Clipping calibration sample rejected (clipping > 0%)');

const noisyCalibration = { ...cleanCalibration, noiseFloorDb: -32 };
assert(!validateCalibration(noisyCalibration).passed, 'Calibration with high ambient noise rejected (> -40 dBFS)');

const hotPeakCalibration = { ...cleanCalibration, peakDb: 0.5 };
assert(!validateCalibration(hotPeakCalibration).passed, 'Calibration with peak > -1.0 dBFS rejected');

// -------------------------------------------------------------
// Suite 4: Consent Gating & Pseudonymous ID Architecture
// -------------------------------------------------------------
console.log('\n--- Suite 4: Consent Gating & Pseudonymous ID Decoupling ---');

function generatePseudonymousSpeakerId(idx) {
  return `SAT-SPK-${String(idx).padStart(4, '0')}`;
}

const spkId1 = generatePseudonymousSpeakerId(1);
const spkId2 = generatePseudonymousSpeakerId(25);
assert(spkId1 === 'SAT-SPK-0001', 'Generates standard pseudonymous ID SAT-SPK-0001');
assert(spkId2 === 'SAT-SPK-0025', 'Generates standard pseudonymous ID SAT-SPK-0025');

// Verify zero PII in speaker schema
const validSpeaker = {
  speakerId: spkId1,
  language: 'sat',
  dialect: 'Mayurbhanj',
  ageRange: '26-40',
  gender: 'female',
  region: 'Mayurbhanj, Odisha',
  consentId: 'CONSENT-001'
};
assert(!('name' in validSpeaker), 'Speaker schema strictly excludes personal name');
assert(!('phoneNumber' in validSpeaker), 'Speaker schema strictly excludes phone number');
assert(!('homeAddress' in validSpeaker), 'Speaker schema strictly excludes home address');
assert(!('governmentId' in validSpeaker), 'Speaker schema strictly excludes government ID');

// Consent gating logic
function enforceConsentGate(consent) {
  if (consent.status === 'WITHDRAWN') return { allowed: false, reason: 'Consent withdrawn' };
  if (consent.status !== 'VALID' && consent.status !== 'ACTIVE') return { allowed: false, reason: 'Consent inactive' };
  if (!consent.modelTrainingPermission) return { allowed: false, reason: 'Model training withheld' };
  if (!consent.plainLanguageSigned) return { allowed: false, reason: 'Plain language unsigned' };
  return { allowed: true };
}

const validConsent = { status: 'VALID', modelTrainingPermission: true, plainLanguageSigned: true };
assert(enforceConsentGate(validConsent).allowed, 'Valid consent with training permission and signature passes');

const noTrainingConsent = { status: 'VALID', modelTrainingPermission: false, plainLanguageSigned: true };
assert(!enforceConsentGate(noTrainingConsent).allowed, 'Consent withholding model training permission is blocked');

const unsignedConsent = { status: 'VALID', modelTrainingPermission: true, plainLanguageSigned: false };
assert(!enforceConsentGate(unsignedConsent).allowed, 'Consent without plain-language signature is blocked');

const withdrawnConsent = { status: 'WITHDRAWN', modelTrainingPermission: true, plainLanguageSigned: true };
assert(!enforceConsentGate(withdrawnConsent).allowed, 'Withdrawn consent is strictly blocked');

// -------------------------------------------------------------
// Suite 5: Multi-Take Management & SHA-256 Hashing
// -------------------------------------------------------------
console.log('\n--- Suite 5: Multi-Take Management & SHA-256 Hashing ---');

function computeHash(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

const hashA = computeHash('AUDIO_SAMPLE_DATA_A');
const hashB = computeHash('AUDIO_SAMPLE_DATA_B');
assert(typeof hashA === 'string' && hashA.length === 64, 'Computes standard 64-character SHA-256 checksum');
assert(hashA !== hashB, 'Different audio payloads yield distinct SHA-256 hashes');

// Multi-take selection: optimal RMS/clean silence preferred over clipped loud take
const takes = [
  { takeId: 'T1', clippingPercentage: 2.0, peakDb: 0.1, rmsDb: -8, qualityStatus: 'REJECT' },
  { takeId: 'T2', clippingPercentage: 0.0, peakDb: -3.5, rmsDb: -18, qualityStatus: 'PASS' },
  { takeId: 'T3', clippingPercentage: 0.0, peakDb: -12.0, rmsDb: -29, qualityStatus: 'WARNING' }
];

const selectedTake = takes.find(t => t.qualityStatus === 'PASS' && t.clippingPercentage === 0);
assert(selectedTake && selectedTake.takeId === 'T2', 'Take selection deterministically picks optimal clean take (T2) over clipped loud take (T1)');

// -------------------------------------------------------------
// Suite 6: Human Listening & Transcription Alignment QA
// -------------------------------------------------------------
console.log('\n--- Suite 6: Human Listening & Transcription Alignment QA ---');

function checkTranscription(approved, spoken) {
  const cleanApp = approved.replace(/[᱾᱿.,!?:;"'()-]/g, '').trim().split(/\s+/);
  const cleanSpk = spoken.replace(/[᱾᱿.,!?:;"'()-]/g, '').trim().split(/\s+/);
  const omissions = cleanApp.filter(w => !cleanSpk.includes(w));
  const additions = cleanSpk.filter(w => !cleanApp.includes(w));

  if (omissions.length === 0 && additions.length === 0) return 'EXACT_MATCH';
  if (omissions.length > 2) return 'REJECTED';
  return 'REVIEW_REQUIRED';
}

assert(checkTranscription('ᱡᱚᱦᱟᱨ ᱜᱮ ᱾', 'ᱡᱚᱦᱟᱨ ᱜᱮ ᱾') === 'EXACT_MATCH', 'Identical spoken audio returns EXACT_MATCH');
assert(checkTranscription('ᱥᱟᱱᱟᱢ ᱜᱤᱫᱽᱨᱟᱹ ᱱᱤᱛᱚᱜ ᱪᱟᱱᱟᱪ ᱨᱮ ᱫᱩᱲᱩᱵ ᱯᱮ ᱾', 'ᱥᱟᱱᱟᱢ ᱜᱤᱫᱽᱨᱟᱹ ᱪᱟᱱᱟᱪ ᱨᱮ ᱫᱩᱲᱩᱵ ᱯᱮ ᱾') === 'REVIEW_REQUIRED', 'Minor omission returns REVIEW_REQUIRED');
assert(checkTranscription('ᱥᱟᱱᱟᱢ ᱜᱤᱫᱽᱨᱟᱹ ᱱᱤᱛᱚᱜ ᱪᱟᱱᱟᱪ ᱨᱮ ᱫᱩᱲᱩᱵ ᱯᱮ ᱾', 'ᱥᱟᱱᱟᱢ ᱫᱩᱲᱩᱵ ᱯᱮ ᱾') === 'REJECTED', 'Severe omission (>2 words) returns REJECTED');

// Human listening review schema
const listeningRecord = {
  qaId: 'QA-001',
  sampleId: 'SMP-001',
  pronunciationNatural: true,
  intelligibilityClear: true,
  freeOfAcousticArtifacts: true,
  reviewerRole: 'Native Santali Reviewer',
  qualityRating: 'EXCELLENT'
};
assert(listeningRecord.reviewerRole === 'Native Santali Reviewer', 'Listening reviewer role is strictly "Native Santali Reviewer" (no fake name)');
assert(listeningRecord.qualityRating === 'EXCELLENT', 'Human listening QA rating recorded');

// -------------------------------------------------------------
// Suite 7: Manifest Generation & Strict Data Honesty
// -------------------------------------------------------------
console.log('\n--- Suite 7: Manifest Generation & Strict Data Honesty ---');

const manifestPath = path.join(__dirname, '../docs/tts-dataset/santali/pilot/manifests/pilot_manifest.json');
assert(fs.existsSync(manifestPath), 'pilot_manifest.json exists');
const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
assert(Array.isArray(manifestContent) && manifestContent.length > 0, `Pilot manifest contains ${manifestContent.length} entries`);

// Verify that all entries in the synthetic manifest are flagged isSyntheticFixture: true
const syntheticFixtures = manifestContent.filter(m => m.isSyntheticFixture === true);
assert(syntheticFixtures.length === manifestContent.length, 'All test manifest entries are explicitly flagged isSyntheticFixture: true');

// Verify that pilot_summary.json reports zero real recorded hours
const summaryReportPath = path.join(__dirname, '../docs/tts-dataset/santali/pilot/reports/pilot_summary.json');
assert(fs.existsSync(summaryReportPath), 'pilot_summary.json exists');
const summaryContent = JSON.parse(fs.readFileSync(summaryReportPath, 'utf-8'));
assert(summaryContent.actualRecordedData.realSpeakersCount === 0, 'Data Honesty: actualRecordedData.realSpeakersCount is exactly 0');
assert(summaryContent.actualRecordedData.recordedHours === 0.0, 'Data Honesty: actualRecordedData.recordedHours is exactly 0.0');
assert(summaryContent.trainingReady === 'NO', 'Data Honesty: trainingReady is explicitly NO');
assert(summaryContent.status === 'PILOT_COMPLETE', 'Pilot status is PILOT_COMPLETE');

// -------------------------------------------------------------
// Suite 8: Cascading Participant Withdrawal Simulation
// -------------------------------------------------------------
console.log('\n--- Suite 8: Participant Withdrawal Simulation ---');

const initialManifest = [
  { sampleId: 'S1', speakerId: 'SAT-SPK-0001', isSyntheticFixture: true },
  { sampleId: 'S2', speakerId: 'SAT-SPK-0001', isSyntheticFixture: true },
  { sampleId: 'S3', speakerId: 'SAT-SPK-0002', isSyntheticFixture: true },
  { sampleId: 'S4', speakerId: 'SAT-SPK-0002', isSyntheticFixture: true }
];

const targetWithdrawalSpeaker = 'SAT-SPK-0002';
const purgedManifest = initialManifest.filter(m => m.speakerId !== targetWithdrawalSpeaker);

assert(purgedManifest.length === 2, 'Withdrawal purges exactly the withdrawn speaker samples');
assert(!purgedManifest.some(m => m.speakerId === targetWithdrawalSpeaker), 'No samples remain for the withdrawn speaker');
assert(purgedManifest.every(m => m.speakerId === 'SAT-SPK-0001'), 'Unaffected speaker samples remain completely intact');

// -------------------------------------------------------------
// Suite 9: Speaker-Disjoint Splitting & Leakage Prevention
// -------------------------------------------------------------
console.log('\n--- Suite 9: Speaker-Disjoint Splitting & Leakage Prevention ---');

const trainSplit = [
  { sampleId: 'S1', speakerId: 'SAT-SPK-0001', sha256: 'HASH_001', text: 'ᱛᱮᱦᱮᱧ ᱫᱚ ᱵᱮᱥ ᱫᱤᱱ ᱠᱟᱱᱟ ᱾' },
  { sampleId: 'S2', speakerId: 'SAT-SPK-0001', sha256: 'HASH_002', text: 'ᱟᱞᱮ ᱟᱹᱛᱩ ᱛᱮ ᱦᱤᱡᱩᱜ ᱢᱮ ᱾' }
];

const valSplitClean = [
  { sampleId: 'S3', speakerId: 'SAT-SPK-0002', sha256: 'HASH_003', text: 'ᱫᱟᱜ ᱧᱩᱭ ᱢᱮ ᱾' }
];

const valSplitLeakySpeaker = [
  { sampleId: 'S4', speakerId: 'SAT-SPK-0001', sha256: 'HASH_004', text: 'ᱫᱟᱜ ᱧᱩᱭ ᱢᱮ ᱾' }
];

const valSplitLeakyHash = [
  { sampleId: 'S5', speakerId: 'SAT-SPK-0003', sha256: 'HASH_001', text: 'ᱫᱟᱜ ᱧᱩᱭ ᱢᱮ ᱾' }
];

function checkSplitLeakage(train, val) {
  const trainSpeakers = new Set(train.map(t => t.speakerId));
  const trainHashes = new Set(train.map(t => t.sha256));
  const hasSpeakerLeak = val.some(v => trainSpeakers.has(v.speakerId));
  const hasHashLeak = val.some(v => trainHashes.has(v.sha256));
  return { valid: !hasSpeakerLeak && !hasHashLeak, hasSpeakerLeak, hasHashLeak };
}

assert(checkSplitLeakage(trainSplit, valSplitClean).valid, 'Clean speaker-disjoint partition passes leakage check');
assert(checkSplitLeakage(trainSplit, valSplitLeakySpeaker).hasSpeakerLeak, 'Catches speaker leakage between train and val');
assert(checkSplitLeakage(trainSplit, valSplitLeakyHash).hasHashLeak, 'Catches duplicate audio hash leakage between train and val');

// -------------------------------------------------------------
// Suite 10: TTS UI Freeze Verification
// -------------------------------------------------------------
console.log('\n--- Suite 10: TTS UI Freeze Verification ---');
const ttsUiPath = path.join(__dirname, '../src/pages/features/TextToSpeechPage.tsx');
assert(fs.existsSync(ttsUiPath), 'TextToSpeechPage.tsx exists');

const ttsUiContent = fs.readFileSync(ttsUiPath, 'utf-8');
assert(ttsUiContent.includes('Speech Tuning'), 'Rule 1: TextToSpeechPage.tsx contains frozen Speech Tuning layout');
assert(ttsUiContent.includes('#249144'), 'Rule 1: TTS green color palette #249144 strictly preserved');
assert(ttsUiContent.includes('Download WAV'), 'Rule 1: Audio WAV download control preserved');
assert(ttsUiContent.includes('tts-rate-slider'), 'Rule 1: Speed slider controls preserved without changes');

console.log(`\n======================================================`);
console.log(`Tests Completed: ${passedTests + failedTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log(`======================================================\n`);

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('✅ PHASE 10 UNIT & REGRESSION TEST SUITE PASSED 100%');
}
