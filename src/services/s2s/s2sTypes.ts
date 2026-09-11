/**
 * Bhasha Setu — Speech-to-Speech (S2S) Core Types & Interfaces
 * 
 * Provides strong typing for:
 * - Deterministic S2S State Machine
 * - Turn-taking and unique Turn IDs
 * - Separated ASR vs Translation confidence
 * - Domain risk classification and never-guess policy
 * - Multi-tier provenance and human-in-the-loop verification
 * - Offline IndexedDB and sync queue
 */

export type S2SState = 
  | 'IDLE'
  | 'LISTENING'
  | 'PROCESSING_AUDIO'
  | 'ASR_PROCESSING'
  | 'TRANSLATING'
  | 'SAFETY_CHECK'
  | 'TTS_PROCESSING'
  | 'PLAYING'
  | 'ERROR'
  | 'CANCELLED';

export type SpeakerRole = 'speakerA' | 'speakerB';

export type ConfidenceTier = 'verified' | 'dataset' | 'fallback' | 'needs_review';

export type DomainCategory = 
  | 'GENERAL'
  | 'EDUCATION'
  | 'AGRICULTURE'
  | 'ADMINISTRATION'
  | 'HEALTHCARE'
  | 'CRITICAL_HEALTHCARE';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export type VerificationStatus = 
  | 'AI_OUTPUT'
  | 'USER_CORRECTED'
  | 'HUMAN_REVIEWED'
  | 'EXPERT_VERIFIED';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export type S2SErrorCode =
  | 'MICROPHONE_ERROR'
  | 'PERMISSION_ERROR'
  | 'AUDIO_TOO_SHORT'
  | 'AUDIO_CLIPPING'
  | 'ASR_ERROR'
  | 'ASR_TIMEOUT'
  | 'ASR_LOW_CONFIDENCE'
  | 'ASR_EMPTY'
  | 'WEBSOCKET_ERROR'
  | 'TRANSLATION_NOT_FOUND'
  | 'TRANSLATION_LOW_CONFIDENCE'
  | 'UNSUPPORTED_LANGUAGE'
  | 'TTS_ERROR'
  | 'TTS_UNAVAILABLE'
  | 'DATABASE_ERROR'
  | 'OFFLINE_RESOURCE_ERROR'
  | 'SYNC_ERROR';

export interface S2SError {
  code: S2SErrorCode;
  message: string;
  turnId?: string;
  recoverable: boolean;
  timestamp: number;
}

export interface TurnVersionInfo {
  translationDbVersion: string;
  lexiconVersion: string;
  asrModelVersion: string;
  ttsVersion: string;
}

export interface TurnMetadata {
  conversationId: string;
  turnId: string;
  speakerId: SpeakerRole;
  speakerRole: string; // e.g. "Person A (Teacher/Doctor)"
  sourceLang: string;
  targetLang: string;
  sourceLangName: string;
  timestamp: number;
  timeFormatted: string;
  versionInfo: TurnVersionInfo;
}

export interface ASRResultData {
  transcript: string;
  asrConfidence: number; // 0.0 to 1.0 (Acoustic quality only)
  language: string;
  engine: string;
  latencyMs: number;
  isFinal: boolean;
  turnId: string;
  wordCount: number;
  snrEstimateDb?: number;
}

export interface TranslationDecision {
  targetText: string;
  transliteration?: string;
  translationConfidence: number; // 0.0 to 1.0 (Semantic reliability only)
  method: 'verified_exact' | 'verified_lexicon' | 'dataset_match' | 'subword_fallback' | 'web_bridge';
  provenance: string;
  latencyMs: number;
  isLexiconMatch: boolean;
  sourceLang: string;
  targetLang: string;
}

export interface DomainRiskAssessment {
  domain: DomainCategory;
  riskLevel: RiskLevel;
  requiresReview: boolean;
  safetyPassed: boolean;
  detectedKeywords: string[];
  riskExplanation?: string;
}

export interface FinalTurnReliability {
  asrConfidence: number;
  translationConfidence: number;
  domainRisk: DomainRiskAssessment;
  finalTier: ConfidenceTier;
  needsReview: boolean;
  provenanceSummary: string;
}

export interface S2STurnRecord {
  metadata: TurnMetadata;
  asr: ASRResultData;
  translation: TranslationDecision;
  reliability: FinalTurnReliability;
  verificationStatus: VerificationStatus;
  userCorrection?: {
    originalText: string;
    translatedText: string;
    correctedAt: number;
  };
  audioPlaybackAvailable: boolean;
  totalLatencyMs: number;
}

export interface SyncQueueItem {
  id: string;
  turnId: string;
  type: 'turn_telemetry' | 'human_correction';
  payload: any;
  status: SyncStatus;
  retryCount: number;
  lastAttempt?: number;
  createdAt: number;
  error?: string;
}

export interface S2SLatencyMetrics {
  audioCaptureMs: number;
  asrProcessingMs: number;
  translationMs: number;
  safetyCheckMs: number;
  ttsProcessingMs: number;
  endToEndMs: number;
}

export interface StructuredPhrase {
  id: string;
  domain: DomainCategory;
  sourceLang: string;
  targetLang: string;
  sourceText: string;
  targetText: string;
  romanizedText: string;
  pronunciation?: string;
  verificationStatus: VerificationStatus;
  riskLevel: RiskLevel;
  version: string;
}

export type ComponentHealth = 'READY' | 'DEGRADED' | 'FAILED' | 'UNAVAILABLE';

export interface ComponentDiagnostic {
  name: string;
  health: ComponentHealth;
  latencyMs?: number;
  message: string;
  details?: Record<string, any>;
}

export interface S2SDiagnosticReport {
  timestamp: number;
  overallStatus: ComponentHealth;
  components: Record<string, ComponentDiagnostic>;
  environment: {
    browser: string;
    os: string;
    isOnline: boolean;
    hasIndexedDB: boolean;
    hasWebAudio: boolean;
    hasSpeechRecognition: boolean;
    hasSpeechSynthesis: boolean;
  };
}

export interface BenchmarkRunRecord {
  runId: string;
  timestamp: number;
  device: string;
  browser: string;
  os: string;
  languagePair: string;
  engine: string;
  isOnline: boolean;
  iterations: number;
  latencies: {
    audioInitMs: number;
    asrMs: number;
    translationMs: number;
    safetyMs: number;
    ttsInitMs: number;
    endToEndMs: number;
  };
  metrics: {
    meanMs: number;
    p50Ms: number;
    p95Ms: number;
    maxMs: number;
  };
}

export interface TTSPlaybackOptions {
  rate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}
