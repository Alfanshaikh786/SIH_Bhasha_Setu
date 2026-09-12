/**
 * Bhasha Setu — Phase 10: Santali Real-World Recording Pilot & Dataset Collection Types
 *
 * Defines formal schemas for:
 * - Objective participant eligibility & plain-language consent tracking
 * - Pseudonymous speaker identification strictly decoupled from PII
 * - Acoustic calibration recording validation
 * - Multi-take tracking with immutable raw audio hashing (SHA-256)
 * - Automated audio QA & human listening / transcription QA
 * - Speaker contribution caps & fatigue monitoring
 * - Cascading participant withdrawal tracing (using synthetic fixtures)
 * - Speaker-disjoint train/validation partition integrity (leakage prevention)
 * - Pilot manifests and machine-readable audit reports
 */

import {
  CorpusPromptItem,
  CorpusCategory,
  CorpusSentenceType,
  SentenceLengthCategory,
  CorpusReviewStatus
} from './corpusTypes';
import { ConsentStatus } from './types';

export type PilotConsentStatus = 'ACTIVE' | 'VALID' | 'PENDING' | 'WITHDRAWN' | 'EXPIRED';

export interface PilotConsentPermissions {
  modelTraining: boolean;
  commercialUse: boolean;
  redistribution: boolean;
}

export interface PilotConsentRecord {
  consentId: string;
  speakerId: string; // Pseudonymous ID (e.g. SAT-SPK-0001)
  consentVersion: string; // e.g. "v1.0"
  datasetVersion: string; // e.g. "pilot-v0.1.0"
  consentDate: string;
  permissions: PilotConsentPermissions;
  status: PilotConsentStatus;
  withdrawalDate?: string;
  withdrawalReason?: string;
  plainLanguageSigned: boolean;
}

export interface ParticipantEligibility {
  isNativeOrProficientSantali: boolean;
  comfortableReadingOlChiki: boolean;
  informedConsentProvided: boolean;
  acousticEnvironmentCompliant: boolean;
  ageTier: '18-30' | '31-50' | '51+';
  gender: 'FEMALE' | 'MALE' | 'NON_BINARY' | 'DECLINE_TO_STATE';
  reportedDialectVariety: 'Mayurbhanj' | 'Northern' | 'West_Bengal_Border' | 'UNKNOWN';
}

export interface AcousticCalibrationResult {
  calibrationId: string;
  sessionId: string;
  speakerId: string;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  peakDb: number;
  rmsDb: number;
  clippingPercentage: number;
  noiseFloorDb: number;
  status: 'PASS' | 'FAIL';
  reasons: string[];
  calibratedAt: string;
}

export type TranscriptionMatchStatus =
  | 'EXACT_MATCH'
  | 'MINOR_VARIATION'
  | 'REVIEW_REQUIRED'
  | 'REJECTED';

export interface HumanTranscriptionQARecord {
  qaId: string;
  sampleId: string;
  promptId: string;
  speakerId: string;
  approvedPromptText: string;
  spokenText: string;
  status: TranscriptionMatchStatus;
  omissions: string[];
  additions: string[];
  substitutions: string[];
  repetitions: string[];
  reviewerRole: 'Native Santali Reviewer';
  notes?: string;
  reviewedAt: string;
}

export interface HumanListeningQARecord {
  qaId: string;
  sampleId: string;
  speakerId: string;
  pronunciationNatural: boolean;
  intelligibilityClear: boolean;
  freeOfAcousticArtifacts: boolean;
  reviewerRole: 'Native Santali Reviewer';
  qualityRating: 'EXCELLENT' | 'ACCEPTABLE' | 'NEEDS_RETAKE' | 'UNUSABLE';
  notes?: string;
  reviewedAt: string;
}

export interface PilotTakeRecord {
  takeId: string;
  sampleId: string;
  promptId: string;
  speakerId: string;
  sessionId: string;
  takeNumber: number;
  audioPathRaw: string;
  sha256: string;
  durationSeconds: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  peakDb: number;
  rmsDb: number;
  clippingPercentage: number;
  trailingSilenceMs: number;
  qualityStatus: 'PASS' | 'WARNING' | 'REJECT';
  transcriptionStatus: TranscriptionMatchStatus;
  selectedForDataset: boolean;
  rejectionReason?: string;
  isSyntheticFixture: boolean;
  recordedAt: string;
}

export interface PilotManifestEntry {
  sampleId: string;
  speakerId: string;
  promptId: string;
  audioPath: string;
  sha256: string;
  text: string;
  script: 'ol_chiki';
  category: CorpusCategory;
  sentenceType: CorpusSentenceType;
  lengthCategory: SentenceLengthCategory;
  dialect: string;
  dialectConfidence: 'HIGH' | 'MEDIUM' | 'UNVERIFIED';
  qualityStatus: 'PASS' | 'WARNING';
  transcriptionStatus: TranscriptionMatchStatus;
  consentStatus: PilotConsentStatus;
  datasetVersion: string;
  isSyntheticFixture: boolean;
}

export interface PilotSummaryReport {
  generatedAt: string;
  pilotVersion: string;
  status: 'PILOT_COMPLETE';
  trainingReady: 'NO';
  rationale: string;
  actualRecordedData: {
    realSpeakersCount: number;
    recordedHours: number;
    totalTakes: number;
    approvedSamples: number;
    statement: string;
  };
  syntheticTestData: {
    testFixturesExecuted: number;
    withdrawalTestPassed: boolean;
    leakageTestPassed: boolean;
    calibrationCheckPassed: boolean;
    consentGatingPassed: boolean;
  };
}
