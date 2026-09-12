/**
 * Bhasha Setu — Phase 9: Santali Corpus Expansion & Native-Speaker Validation Types
 *
 * Defines formal schemas for:
 * - Scalable multi-category prompt corpus
 * - Native-speaker linguistic review workflow
 * - Recording session orchestration & deterministic prompt randomization
 * - Multi-take tracking & take selection
 * - Phonetic, diacritic, and rare-sequence coverage auditing
 * - Speaker contribution thresholds and balance metrics
 */

export type CorpusCategory =
  | 'GENERAL_CONVERSATION'
  | 'EDUCATION'
  | 'HEALTHCARE'
  | 'AGRICULTURE'
  | 'COMMUNITY'
  | 'DAILY_LIFE'
  | 'DIRECTIONS'
  | 'SAFETY'
  | 'NUMERALS'
  | 'DATES_AND_TIME'
  | 'MEASUREMENTS'
  | 'QUESTIONS'
  | 'COMMANDS'
  | 'DESCRIPTIONS'
  | 'NARRATIVE'
  | 'MIXED_LANGUAGE';

export type CorpusSentenceType =
  | 'STATEMENT'
  | 'QUESTION'
  | 'COMMAND'
  | 'REQUEST'
  | 'WARNING'
  | 'EXCLAMATION'
  | 'LIST'
  | 'EXPLANATION'
  | 'CONVERSATIONAL_EXCHANGE';

export type PromptSentenceType = CorpusSentenceType;

export type SentenceLengthCategory =
  | 'VERY_SHORT' // 1-3 words, <15 chars
  | 'SHORT'      // 4-7 words, 15-35 chars
  | 'MEDIUM'     // 8-14 words, 36-75 chars
  | 'LONG'       // 15-24 words, 76-130 chars
  | 'VERY_LONG'; // 25+ words, >130 chars

export type CorpusReviewStatus =
  | 'DRAFT'
  | 'LINGUISTIC_REVIEW_REQUIRED'
  | 'LINGUISTIC_REVIEWED'
  | 'RECORDING_READY'
  | 'REJECTED';

export type SourceType =
  | 'ORIGINAL'
  | 'PUBLIC_DOMAIN'
  | 'APPROPRIATELY_LICENSED'
  | 'NATIVE_REVIEWED'
  | 'AI_DRAFT';

export type ReviewDecision =
  | 'APPROVE'
  | 'EDIT'
  | 'REJECT'
  | 'NEEDS_DISCUSSION';

export type PipelineStageStatus =
  | 'CORPUS_DESIGN_READY'
  | 'RECORDING_READY'
  | 'DATASET_COLLECTION_READY'
  | 'TRAINING_READY'
  | 'MODEL_EVALUATION_READY';

export type SequenceCoverageHealth =
  | 'WELL_COVERED'
  | 'UNDERREPRESENTED'
  | 'MISSING';

export type LexicalFrequencyCategory =
  | 'COMMON'
  | 'MEDIUM'
  | 'RARE'
  | 'DOMAIN_SPECIFIC'
  | 'UNKNOWN';

/**
 * Extended prompt item schema for the scalable recording corpus.
 */
export interface CorpusPromptItem {
  promptId: string;
  category: CorpusCategory;
  domain: string;
  text: string;
  normalizedText: string;
  sentenceType: CorpusSentenceType;
  lengthCategory: SentenceLengthCategory;
  characterCount: number;
  wordCount: number;
  estimatedDurationSec: number;
  script: 'ol_chiki' | 'roman' | 'mixed';
  phoneticFocus: string;
  sourceType: SourceType;
  sourceReference: string;
  license: string;
  createdBy: string;
  reviewStatus: CorpusReviewStatus;
  dialect: string; // 'Mayurbhanj' | 'Northern' | 'UNKNOWN'
  dialectConfidence: 'HIGH' | 'MEDIUM' | 'UNVERIFIED';
  dialectReviewStatus: 'REVIEWED' | 'PENDING' | 'UNKNOWN';
  lexicalFrequency: LexicalFrequencyCategory;
  originalTextIfEdited?: string;
  editReason?: string;
  notes?: string;
}

/**
 * Native-speaker linguistic review record.
 * Dedicated to the qualified role 'Native Santali Reviewer'.
 */
export interface NativeSpeakerReviewRecord {
  reviewId: string;
  promptId: string;
  reviewerRole: 'Native Santali Reviewer';
  decision: ReviewDecision;
  reviewStatus: CorpusReviewStatus;
  meaningCorrect: boolean;
  grammarCorrect: boolean;
  orthographyCorrect: boolean;
  naturalnessCorrect: boolean;
  originalText: string;
  editedText?: string;
  pronunciationNotes?: string;
  dialectNotes?: string;
  reviewDate: string;
  reviewVersion: string;
}

/**
 * Structured recording session batch.
 */
export interface RecordingSession {
  sessionId: string;
  speakerId: string;
  promptIds: string[];
  recordingOrder: number[]; // Permutation of prompt indices generated via seed
  randomizationSeed: number;
  sessionDate: string;
  recordingEnvironment: string;
  equipment: string;
  consentReference: string;
  maxDurationMinutes: number; // e.g. 45 min cap
  completedTakesCount: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'HALTED_FATIGUE' | 'CANCELLED';
}

/**
 * Recording take record supporting multi-take capture per prompt.
 */
export interface RecordingTake {
  takeId: string;
  promptId: string;
  speakerId: string;
  sessionId: string;
  takeNumber: number;
  audioPath: string;
  durationSeconds: number;
  peakDb: number;
  rmsDb: number;
  clippingPercentage: number;
  trailingSilenceMs: number;
  qualityStatus: 'PASS' | 'WARNING' | 'REJECT';
  selectedTake: boolean;
  rejectionReason?: string;
  recordedAt: string;
}

/**
 * Speaker contribution balance rules.
 */
export interface SpeakerContributionPolicy {
  minUsefulPrompts: number;      // e.g. 25 prompts
  recommendedPrompts: number;    // e.g. 150 prompts
  maxCapPrompts: number;         // e.g. 500 prompts (prevents single-speaker dataset skew)
  maxSessionMinutes: number;     // e.g. 45 min continuous limit
  recommendedRestMinutes: number;// e.g. 15 min rest interval
}

export const DEFAULT_CONTRIBUTION_POLICY: SpeakerContributionPolicy = {
  minUsefulPrompts: 25,
  recommendedPrompts: 150,
  maxCapPrompts: 500,
  maxSessionMinutes: 45,
  recommendedRestMinutes: 15
};

/**
 * Detailed rare-sequence and character balance analysis.
 */
export interface RareSequenceAnalysisReport {
  timestamp: string;
  totalPrompts: number;
  baseLettersHealth: Record<string, { count: number; status: SequenceCoverageHealth }>;
  diacriticsHealth: Record<string, { count: number; status: SequenceCoverageHealth }>;
  numeralsHealth: Record<string, { count: number; status: SequenceCoverageHealth }>;
  rareBigrams: Array<{ bigram: string; count: number; status: SequenceCoverageHealth }>;
  positionHealth: {
    initialCoveragePercent: number;
    finalCoveragePercent: number;
  };
  sentenceTypeDistribution: Record<CorpusSentenceType, number>;
  lengthCategoryDistribution: Record<SentenceLengthCategory, number>;
}
