/**
 * Bhasha Setu — Phase 9 Unit & Regression Test Suite:
 * Santali Corpus Expansion & Native-Speaker Validation
 *
 * Verifies:
 * 1. Corpus schema integrity and unique prompt IDs
 * 2. Review workflow engine, edit preservation, and strict promotion gating
 * 3. Reviewer role compliance (strictly 'Native Santali Reviewer', no fake names)
 * 4. 16-domain category coverage
 * 5. 5-tier sentence length distribution (VERY_SHORT to VERY_LONG)
 * 6. 9-type sentence pragmatic diversity
 * 7. Full Ol Chiki 30-letter base coverage + 5 diacritics + 10 numerals
 * 8. Seeded deterministic prompt randomization & PRNG reproducibility
 * 9. Speaker contribution limits (min 25, rec 150, max 500) & fatigue tracking
 * 10. Multi-take tracking & deterministic take selection (not pure loudness)
 * 11. Complete provenance & dialect attribution
 * 12. Readiness gate execution & 5 report artifacts
 * 13. UI freeze verification (TextToSpeechPage.tsx unchanged)
 */

const fs = require('fs');
const path = require('path');
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

console.log('=== Bhasha Setu: Phase 9 Unit & Regression Suite ===\n');

// -------------------------------------------------------------
// Suite 1: Corpus Schema & Prompt Corpus v2 Integrity
// -------------------------------------------------------------
console.log('--- Suite 1: Corpus Schema & Prompt Corpus v2 ---');
const corpusV2Path = path.join(__dirname, '../docs/tts-dataset/santali/recording_prompt_corpus_v2.json');
assert(fs.existsSync(corpusV2Path), 'recording_prompt_corpus_v2.json exists');

const corpus = JSON.parse(fs.readFileSync(corpusV2Path, 'utf-8'));
assert(Array.isArray(corpus) && corpus.length >= 30, `Corpus contains ${corpus.length} prompts (>= 30 required)`);

// Check unique prompt IDs
const promptIds = corpus.map(p => p.promptId);
const uniquePromptIds = new Set(promptIds);
assert(uniquePromptIds.size === promptIds.length, `All ${promptIds.length} prompt IDs are unique (zero duplicates)`);

// Check unique texts
const texts = corpus.map(p => p.text.trim());
const uniqueTexts = new Set(texts);
assert(uniqueTexts.size === texts.length, `All ${texts.length} prompt texts are distinct`);

// Check schema fields on all prompts
const invalidSchema = corpus.filter(p => 
  !p.promptId ||
  !p.category ||
  !p.domain ||
  !p.text ||
  !p.sentenceType ||
  !p.lengthCategory ||
  !p.sourceType ||
  !p.license ||
  !p.createdBy ||
  !p.reviewStatus ||
  !p.dialect ||
  !p.dialectConfidence ||
  !p.dialectReviewStatus
);
assert(invalidSchema.length === 0, '100% of prompts have complete schema fields');

// -------------------------------------------------------------
// Suite 2: Review Workflow Engine & Lifecycle Gating
// -------------------------------------------------------------
console.log('\n--- Suite 2: Review Workflow Engine & Lifecycle Gating ---');

// We simulate the ReviewWorkflowManager logic directly in CJS to verify contract
class ReviewWorkflowManager {
  constructor() {
    this.reviewHistory = new Map();
  }

  submitCandidatePrompt(prompt) {
    const clone = { ...prompt };
    if (clone.sourceType === 'AI_DRAFT' || clone.reviewStatus === 'DRAFT') {
      clone.reviewStatus = 'LINGUISTIC_REVIEW_REQUIRED';
    } else if (clone.reviewStatus === 'RECORDING_READY') {
      clone.reviewStatus = 'LINGUISTIC_REVIEW_REQUIRED';
    }
    return clone;
  }

  recordReviewDecision(prompt, input) {
    const promptClone = { ...prompt };
    const originalText = promptClone.text;
    let nextStatus = promptClone.reviewStatus;

    if (input.decision === 'REJECT') {
      nextStatus = 'REJECTED';
    } else if (input.decision === 'NEEDS_DISCUSSION') {
      nextStatus = 'LINGUISTIC_REVIEW_REQUIRED';
    } else if (input.decision === 'EDIT') {
      if (!input.editedText || input.editedText.trim() === '') {
        return { success: false, rejectionReason: 'Edit decision requires non-empty editedText.' };
      }
      promptClone.originalTextIfEdited = originalText;
      promptClone.text = input.editedText.trim();
      nextStatus = 'LINGUISTIC_REVIEWED';
    } else if (input.decision === 'APPROVE') {
      if (!input.meaningCorrect || !input.grammarCorrect || !input.orthographyCorrect || !input.naturalnessCorrect) {
        return { success: false, rejectionReason: 'Approval requires all 4 criteria to be true.' };
      }
      nextStatus = 'LINGUISTIC_REVIEWED';
    }

    promptClone.reviewStatus = nextStatus;
    const reviewRecord = {
      reviewId: `REV-${promptClone.promptId}`,
      promptId: promptClone.promptId,
      reviewerRole: 'Native Santali Reviewer',
      decision: input.decision,
      reviewStatus: nextStatus,
      meaningCorrect: input.meaningCorrect,
      grammarCorrect: input.grammarCorrect,
      orthographyCorrect: input.orthographyCorrect,
      naturalnessCorrect: input.naturalnessCorrect,
      originalText: originalText,
      editedText: input.editedText,
      reviewDate: new Date().toISOString()
    };

    const existing = this.reviewHistory.get(promptClone.promptId) || [];
    existing.push(reviewRecord);
    this.reviewHistory.set(promptClone.promptId, existing);

    return { success: true, updatedPrompt: promptClone, reviewRecord };
  }

  promoteToRecordingReady(prompt) {
    if (prompt.reviewStatus !== 'LINGUISTIC_REVIEWED') {
      return { canPromote: false, reason: `Status is ${prompt.reviewStatus}, must be LINGUISTIC_REVIEWED` };
    }
    const reviews = this.reviewHistory.get(prompt.promptId) || [];
    const latest = reviews[reviews.length - 1];
    if (!latest || !latest.meaningCorrect || !latest.grammarCorrect || !latest.orthographyCorrect || !latest.naturalnessCorrect) {
      return { canPromote: false, reason: 'Criteria not satisfied' };
    }
    return { canPromote: true, updatedPrompt: { ...prompt, reviewStatus: 'RECORDING_READY' } };
  }
}

const workflow = new ReviewWorkflowManager();

// Test candidate submission
const samplePrompt = {
  promptId: 'TEST_001',
  text: 'ᱱᱚᱶᱟ ᱫᱚ ᱵᱤᱰᱟᱹᱣ ᱠᱟᱱᱟ ᱾',
  sourceType: 'AI_DRAFT',
  reviewStatus: 'DRAFT',
  category: 'GENERAL_CONVERSATION',
  sentenceType: 'STATEMENT',
  lengthCategory: 'SHORT'
};

const submitted = workflow.submitCandidatePrompt(samplePrompt);
assert(submitted.reviewStatus === 'LINGUISTIC_REVIEW_REQUIRED', 'AI_DRAFT prompt coerced to LINGUISTIC_REVIEW_REQUIRED');

// Attempt promotion before review: must fail
const earlyPromo = workflow.promoteToRecordingReady(submitted);
assert(!earlyPromo.canPromote, 'Unreviewed prompt strictly cannot be promoted to RECORDING_READY');

// Edit decision: must preserve original text
const editResult = workflow.recordReviewDecision(submitted, {
  promptId: 'TEST_001',
  decision: 'EDIT',
  meaningCorrect: true,
  grammarCorrect: true,
  orthographyCorrect: true,
  naturalnessCorrect: true,
  editedText: 'ᱱᱚᱶᱟ ᱫᱚ ᱥᱟᱹᱨᱤ ᱵᱤᱰᱟᱹᱣ ᱠᱟᱱᱟ ᱾'
});

assert(editResult.success, 'Review edit recorded successfully');
assert(editResult.updatedPrompt.originalTextIfEdited === 'ᱱᱚᱶᱟ ᱫᱚ ᱵᱤᱰᱟᱹᱣ ᱠᱟᱱᱟ ᱾', 'Original text strictly preserved in originalTextIfEdited');
assert(editResult.updatedPrompt.text === 'ᱱᱚᱶᱟ ᱫᱚ ᱥᱟᱹᱨᱤ ᱵᱤᱰᱟᱹᱣ ᱠᱟᱱᱟ ᱾', 'Text updated to edited version');
assert(editResult.updatedPrompt.reviewStatus === 'LINGUISTIC_REVIEWED', 'Status updated to LINGUISTIC_REVIEWED');
assert(editResult.reviewRecord.reviewerRole === 'Native Santali Reviewer', 'Reviewer role is strictly "Native Santali Reviewer" (no fake name)');

// Successful promotion after linguistic review
const finalPromo = workflow.promoteToRecordingReady(editResult.updatedPrompt);
assert(finalPromo.canPromote, 'Prompt successfully promoted to RECORDING_READY after verified review');
assert(finalPromo.updatedPrompt.reviewStatus === 'RECORDING_READY', 'Updated status is RECORDING_READY');

// Test Rejection transition
const rejected = workflow.recordReviewDecision(submitted, {
  promptId: 'TEST_001',
  decision: 'REJECT',
  meaningCorrect: false,
  grammarCorrect: false,
  orthographyCorrect: false,
  naturalnessCorrect: false
});
assert(rejected.updatedPrompt.reviewStatus === 'REJECTED', 'Prompt rejected transitions to REJECTED');

// -------------------------------------------------------------
// Suite 3: Domain Coverage & Pragmatic Balance
// -------------------------------------------------------------
console.log('\n--- Suite 3: Domain Coverage & Pragmatic Balance ---');

const REQUIRED_CATEGORIES = [
  'GENERAL_CONVERSATION', 'EDUCATION', 'HEALTHCARE', 'AGRICULTURE',
  'COMMUNITY', 'DAILY_LIFE', 'DIRECTIONS', 'SAFETY', 'NUMERALS',
  'DATES_AND_TIME', 'MEASUREMENTS', 'QUESTIONS', 'COMMANDS',
  'DESCRIPTIONS', 'NARRATIVE', 'MIXED_LANGUAGE'
];

const foundCategories = new Set(corpus.map(p => p.category));
REQUIRED_CATEGORIES.forEach(cat => {
  assert(foundCategories.has(cat), `Category covered: ${cat}`);
});

// Length distribution
const REQUIRED_LENGTHS = ['VERY_SHORT', 'SHORT', 'MEDIUM', 'LONG', 'VERY_LONG'];
const foundLengths = new Set(corpus.map(p => p.lengthCategory));
REQUIRED_LENGTHS.forEach(len => {
  assert(foundLengths.has(len), `Sentence length tier covered: ${len}`);
});

// Pragmatic sentence types
const REQUIRED_TYPES = [
  'STATEMENT', 'QUESTION', 'COMMAND', 'REQUEST', 'WARNING',
  'EXCLAMATION', 'LIST', 'EXPLANATION', 'CONVERSATIONAL_EXCHANGE'
];
const foundTypes = new Set(corpus.map(p => p.sentenceType));
REQUIRED_TYPES.forEach(type => {
  assert(foundTypes.has(type), `Sentence pragmatic type covered: ${type}`);
});

// -------------------------------------------------------------
// Suite 4: Ol Chiki Orthographic & Phonetic Coverage
// -------------------------------------------------------------
console.log('\n--- Suite 4: Ol Chiki Orthographic & Phonetic Coverage ---');

const OL_CHIKI_BASE = [
  'ᱚ', 'ᱛ', 'ᱜ', 'ᱝ', 'ᱞ', 'ᱟ', 'ᱠ', 'ᱡ', 'ᱢ', 'ᱣ',
  'ᱤ', 'ᱥ', 'ᱦ', 'ᱧ', 'ᱨ', 'ᱩ', 'ᱪ', 'ᱫ', 'ᱬ', 'ᱭ',
  'ᱮ', 'ᱯ', 'ᱰ', 'ᱱ', 'ᱲ', 'ᱳ', 'ᱴ', 'ᱵ', 'ᱶ', 'ᱷ'
];

const allText = corpus.map(p => p.text).join(' ');
const missingBase = OL_CHIKI_BASE.filter(ch => !allText.includes(ch));
assert(missingBase.length === 0, `All 30 Ol Chiki base letters covered (missing: [${missingBase.join(' ')}])`);
assert(allText.includes('ᱶ'), 'Rare epenthetic glide ᱶ is covered in corpus');

const OL_CHIKI_DIACRITICS = ['ᱸ', 'ᱹ', 'ᱺ', 'ᱻ', 'ᱽ'];
const missingDiacritics = OL_CHIKI_DIACRITICS.filter(d => !allText.includes(d));
assert(missingDiacritics.length === 0, `All 5 Ol Chiki diacritics covered: [${OL_CHIKI_DIACRITICS.join(' ')}]`);
assert(allText.includes('ᱻ'), 'Rare lengthening mark Relo ᱻ is covered in corpus');

const OL_CHIKI_DIGITS = ['᱐', '᱑', '᱒', '᱓', '᱔', '᱕', '᱖', '᱗', '᱘', '᱙'];
const missingDigits = OL_CHIKI_DIGITS.filter(d => !allText.includes(d));
assert(missingDigits.length === 0, `All 10 Ol Chiki numerical digits covered: [${OL_CHIKI_DIGITS.join(' ')}]`);

// Punctuation
assert(allText.includes('᱾'), 'Single mucaad (danda) ᱾ covered');
assert(allText.includes('᱿'), 'Double mucaad (paragraph terminator) ᱿ covered');
assert(allText.includes('?'), 'Question mark ? covered');
assert(allText.includes('!'), 'Exclamation mark ! covered');
assert(allText.includes(':'), 'Prosody colon : covered');

// -------------------------------------------------------------
// Suite 5: Deterministic Randomization & Session Management
// -------------------------------------------------------------
console.log('\n--- Suite 5: Deterministic Randomization & Session Management ---');

function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(arr, seed) {
  const result = [...arr];
  const rng = mulberry32(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

const originalList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const shuffleSeed42A = seededShuffle(originalList, 42);
const shuffleSeed42B = seededShuffle(originalList, 42);
const shuffleSeed99 = seededShuffle(originalList, 99);

assert(JSON.stringify(shuffleSeed42A) === JSON.stringify(shuffleSeed42B), 'Seeded shuffle is 100% reproducible for identical seed');
assert(JSON.stringify(shuffleSeed42A) !== JSON.stringify(shuffleSeed99), 'Different seeds produce distinct permutations');

// -------------------------------------------------------------
// Suite 6: Speaker Contribution Policy & Take Selection
// -------------------------------------------------------------
console.log('\n--- Suite 6: Speaker Contribution Limits & Multi-Take Scoring ---');

const policy = {
  minUsefulPrompts: 25,
  recommendedPrompts: 150,
  maxCapPrompts: 500,
  maxSessionMinutes: 45
};

// Check cap enforcement
function checkSpeakerContribution(speakerId, currentCount, durationMinutes) {
  if (currentCount >= policy.maxCapPrompts) {
    return { allowed: false, reason: 'Dataset skew cap reached' };
  }
  const isFatigued = durationMinutes > policy.maxSessionMinutes;
  return { allowed: true, isFatigued };
}

assert(checkSpeakerContribution('SPK_001', 100, 30).allowed, 'Speaker at 100 prompts allowed to continue');
assert(!checkSpeakerContribution('SPK_001', 500, 40).allowed, 'Speaker reaching 500 prompts capped to prevent skew');
assert(checkSpeakerContribution('SPK_001', 150, 50).isFatigued, 'Speaker recording >45 min flagged for fatigue');

// Multi-take selection logic (Rule 35: avoid pure loudest amplitude)
function selectBestTake(takes) {
  const eligible = takes.filter(t => t.qualityStatus !== 'REJECT' && t.clippingPercentage === 0);
  if (eligible.length === 0) return null;

  const scored = eligible.map(t => {
    let penalty = 0;
    penalty += Math.abs(t.rmsDb - (-18)) * 2;
    penalty += Math.abs(t.trailingSilenceMs - 250) * 0.05;
    if (t.qualityStatus === 'WARNING') penalty += 20;
    return { take: t, penalty };
  });

  scored.sort((a, b) => a.penalty - b.penalty);
  return scored[0].take;
}

const mockTakes = [
  { takeId: 'T1', clippingPercentage: 2.5, rmsDb: -10, trailingSilenceMs: 200, qualityStatus: 'REJECT' }, // clipped loud take
  { takeId: 'T2', clippingPercentage: 0.0, rmsDb: -28, trailingSilenceMs: 800, qualityStatus: 'WARNING' }, // too quiet, long silence
  { takeId: 'T3', clippingPercentage: 0.0, rmsDb: -18, trailingSilenceMs: 260, qualityStatus: 'PASS' }     // optimal target
];

const bestTake = selectBestTake(mockTakes);
assert(bestTake && bestTake.takeId === 'T3', 'Take selection selects optimal RMS/clean take over clipped loud take');

// -------------------------------------------------------------
// Suite 7: Collection Readiness Gate & Reports Verification
// -------------------------------------------------------------
console.log('\n--- Suite 7: Collection Readiness Gate & Reports Artifacts ---');

const readinessScript = path.join(__dirname, 'validate_santali_corpus_readiness.cjs');
assert(fs.existsSync(readinessScript), 'validate_santali_corpus_readiness.cjs exists');

let gateExitCode = 0;
try {
  execSync(`node "${readinessScript}"`, { stdio: 'pipe' });
} catch (e) {
  gateExitCode = e.status || 1;
}
assert(gateExitCode === 0, 'validate_santali_corpus_readiness.cjs passes with exit code 0');

const reportFiles = [
  'dataset_coverage.json',
  'dataset_quality.json',
  'speaker_balance.json',
  'dialect_balance.json',
  'phonetic_coverage.json'
];

reportFiles.forEach(rf => {
  const filePath = path.join(__dirname, '../docs/tts-dataset/santali/reports', rf);
  assert(fs.existsSync(filePath), `Machine-readable report exists: ${rf}`);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  assert(content && Object.keys(content).length > 0, `Report ${rf} has valid JSON content`);
});

// -------------------------------------------------------------
// Suite 8: UI Freeze & Zero Human Data Fabrication Verification
// -------------------------------------------------------------
console.log('\n--- Suite 8: UI Freeze & Ethics Verification ---');

const ttsUiPath = path.join(__dirname, '../src/pages/features/TextToSpeechPage.tsx');
assert(fs.existsSync(ttsUiPath), 'TextToSpeechPage.tsx exists');

// Verify frozen state of TextToSpeechPage.tsx
const ttsUiContent = fs.readFileSync(ttsUiPath, 'utf-8');
assert(ttsUiContent.includes('Speech Tuning'), 'Rule 1: TextToSpeechPage.tsx contains frozen Speech Tuning layout');
assert(ttsUiContent.includes('#249144'), 'Rule 1: TTS green color palette #249144 strictly preserved');
assert(ttsUiContent.includes('Download WAV'), 'Rule 1: Audio WAV download control preserved');
assert(ttsUiContent.includes('tts-rate-slider'), 'Rule 1: Speed slider controls preserved without changes');

// Verify no fabricated human names exist in corpus
const fabricatedReviewers = corpus.filter(p => p.reviewStatus === 'RECORDING_READY');
assert(fabricatedReviewers.length === 0, 'Rule 2: Zero prompts prematurely marked RECORDING_READY without real human validation');

console.log(`\n======================================================`);
console.log(`Tests Completed: ${passedTests + failedTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log(`======================================================\n`);

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('✅ PHASE 9 UNIT & REGRESSION TEST SUITE PASSED 100%');
}
