/**
 * Bhasha Setu — Phase 8: Santali Speech Dataset & Recording Pipeline Types
 *
 * Defines the core schemas, metadata contracts, and operational statuses
 * for building an ethical, linguistically valid Santali TTS training corpus.
 */

export type ScriptMode = 'ol_chiki' | 'roman' | 'devanagari' | 'mixed';

export type TranscriptionStatus =
  | 'UNREVIEWED'
  | 'TRANSCRIBED'
  | 'REVIEW_REQUIRED'
  | 'VERIFIED'
  | 'REJECTED';

export type QualityStatus = 'PASS' | 'WARNING' | 'REJECT';

export type ConsentStatus = 'ACTIVE' | 'PENDING' | 'WITHDRAWN' | 'EXPIRED';

export type RecordingEnvironmentType =
  | 'studio_treated'
  | 'quiet_indoor'
  | 'classroom_after_hours'
  | 'field_office'
  | 'untreated_indoor';

export type MicrophoneCategory =
  | 'studio_condenser'
  | 'broadcast_dynamic'
  | 'usb_condenser'
  | 'lavalier_clip_on'
  | 'smartphone_dedicated_headset'
  | 'smartphone_internal';

export interface DatasetVersionMeta {
  datasetId: string;
  datasetVersion: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: string;
}

/**
 * Strict privacy-preserving speaker schema.
 * Explicitly excludes phone numbers, home addresses, government IDs, and passwords.
 */
export interface SpeakerRecord {
  speakerId: string;
  language: string; // 'sat'
  dialect: string; // e.g. 'Mayurbhanj', 'Northern', 'UNKNOWN'
  ageRange: '18-25' | '26-40' | '41-60' | '60+' | 'UNKNOWN';
  gender: 'female' | 'male' | 'non_binary' | 'undisclosed';
  region: string; // District / State level only (e.g. 'Mayurbhanj, Odisha', 'Dumka, Jharkhand')
  nativeLanguage: string; // e.g. 'Santali'
  recordingExperience: 'none' | 'occasional' | 'professional';
  consentId: string;
}

/**
 * Multi-tier ethical consent record.
 * Differentiates training, research, commercial, and redistribution permissions.
 */
export interface ConsentRecord {
  consentId: string;
  speakerId: string;
  datasetId: string;
  purpose: string;
  recordingDate: string;
  permissionScope: 'FULL_VOICE_MODEL' | 'RESEARCH_ONLY' | 'COMMERCIAL_LIMITED';
  commercialUsePermission: boolean;
  modelTrainingPermission: boolean;
  redistributionPermission: boolean;
  withdrawalPolicy: string;
  consentVersion: string;
  status: ConsentStatus;
  withdrawnAt?: string;
  withdrawalReason?: string;
}

/**
 * Deterministic audio quality measurements calculated directly from audio samples.
 */
export interface AudioQualityMetrics {
  durationSeconds: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  rmsDb: number;
  peakDb: number;
  clippingPercentage: number;
  leadingSilenceMs: number;
  trailingSilenceMs: number;
  totalSilenceRatio: number;
  noiseFloorDb: number;
  format: string; // 'PCM'
  hasAdditionalChunks: boolean;
  chunkList: string[];
}

/**
 * Full speech recording sample schema.
 */
export interface SpeechSampleRecord {
  sampleId: string;
  speakerId: string;
  language: string; // 'sat'
  script: ScriptMode;
  text: string; // Original text as prompted/transcribed
  normalizedText: string; // Text post-linguistic normalization
  audioPath: string; // Relative path to canonical WAV file
  duration: number; // Seconds
  sampleRate: number; // e.g. 22050, 24000
  channels: number; // 1 (Mono canonical)
  bitDepth: number; // 16 or 24
  dialect: string; // 'Mayurbhanj' | 'Northern' | 'UNKNOWN'
  recordingEnvironment: RecordingEnvironmentType;
  microphone: MicrophoneCategory;
  consentId: string;
  consentStatus: ConsentStatus;
  transcriptionStatus: TranscriptionStatus;
  qualityStatus: QualityStatus;
  reviewStatus: 'PENDING_REVIEW' | 'EXPERT_APPROVED' | 'REJECTED';
  datasetVersion: string;
  sha256: string;
  notes?: string;
}

/**
 * Sample validation diagnostics.
 */
export interface DatasetSampleValidationReport {
  sampleId: string;
  status: QualityStatus;
  audioValid: boolean;
  transcriptValid: boolean;
  consentValid: boolean;
  metrics: AudioQualityMetrics;
  issues: string[];
  warnings: string[];
}

/**
 * Ol Chiki character and diacritic coverage audit.
 */
export interface ScriptCoverageReport {
  totalCharacters: number;
  uniqueBaseLettersFound: number;
  uniqueDiacriticsFound: number;
  uniqueNumeralsFound: number;
  baseLetterCoveragePercent: number; // Out of 30 Ol Chiki base letters
  diacriticCoveragePercent: number; // Out of 5 modifying diacritics
  numeralCoveragePercent: number; // Out of 10 digits
  missingBaseLetters: string[];
  missingDiacritics: string[];
  missingNumerals: string[];
  tokenCount: number;
  vocabularyDiversity: number;
}

/**
 * Dataset split configuration and audit.
 */
export interface DatasetSplitManifest {
  datasetId: string;
  datasetVersion: string;
  generatedAt: string;
  trainSamples: SpeechSampleRecord[];
  validationSamples: SpeechSampleRecord[];
  testSamples: SpeechSampleRecord[];
  trainSpeakers: string[];
  validationSpeakers: string[];
  testSpeakers: string[];
  speakerLeakageDetected: boolean;
  duplicateTextDetected: boolean;
  leakageViolations: string[];
}

/**
 * Overall training readiness verification report.
 */
export interface TrainingReadinessGateReport {
  timestamp: string;
  datasetId: string;
  datasetVersion: string;
  isReadyForTraining: boolean;
  totalSamples: number;
  passedSamples: number;
  rejectedSamples: number;
  criticalComplianceFailures: string[];
  nonCriticalWarnings: string[];
  speakerPartitionClean: boolean;
  consentIntegrityClean: boolean;
  audioQualityClean: boolean;
  transcriptIntegrityClean: boolean;
  hashIntegrityClean: boolean;
}
