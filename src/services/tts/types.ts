/**
 * Bhasha Setu — Production TTS Subsystem Types
 *
 * Defines the core interfaces, error codes, and data structures for
 * enterprise-grade, multilingual, offline-capable speech synthesis.
 */

export type TTSPronunciationQuality =
  | 'NATIVE_VERIFIED'     // Verified by native speaker audit
  | 'EXPERT_VERIFIED'     // Audited by linguistic researcher
  | 'CURATED'             // High-confidence dictionary or curated lexicon entry
  | 'DATASET'             // Parallel sentence or vocabulary dataset entry
  | 'RULE_BASED'          // Context-aware phonetic rules (e.g. Ol Chiki diacritic logic)
  | 'ALGORITHMIC'         // Systematic character transliteration
  | 'FALLBACK'            // Cross-script phonetic approximation (e.g. Romanized Indian voice)
  | 'UNKNOWN';            // Unclassified input

export type TTSEngineType =
  | 'BROWSER_NATIVE_TTS'      // Native browser speech synthesis voice (hi-IN, en-IN)
  | 'PHONETIC_TTS_BRIDGE'     // Phonetic transliteration bridge via Indian acoustic voice
  | 'NEURAL_ON_DEVICE_TTS'    // Future on-device neural acoustic model (VITS / FastSpeech2)
  | 'AUDIO_CHIME_FALLBACK';   // Web Audio API acoustic feedback when speech engine unavailable

export type TTSValidationStatus =
  | 'IMPLEMENTED'
  | 'TESTED'
  | 'REAL-WORLD VALIDATED'
  | 'FUTURE'
  | 'NOT YET IMPLEMENTED';

export type TTSErrorCode =
  | 'NO_SPEECH_ENGINE'             // Web Speech API missing or disabled in browser
  | 'NO_VOICE_AVAILABLE'           // No compatible speech voice found for requested language
  | 'UNSUPPORTED_LANGUAGE'         // Language not supported
  | 'VOICE_INITIALIZATION_FAILED'  // Asynchronous voice enumeration failed
  | 'SPEECH_SYNTHESIS_FAILED'      // Browser engine threw error during speech
  | 'SPEECH_TIMEOUT'               // Utterance exceeded safety watchdog timeout
  | 'BROWSER_ENGINE_ERROR'         // Underlying OS/browser audio subsystem failure
  | 'AUDIO_CONTEXT_UNAVAILABLE'    // Web Audio API not supported
  | 'PRONUNCIATION_DATA_MISSING'   // Critical linguistic lexicon unavailable
  | 'INVALID_INPUT'                // Empty or corrupt input string
  | 'CANCELLED';                   // Playback deliberately stopped or superseded by new turn

export interface TTSError {
  code: TTSErrorCode;
  message: string;
  originalError?: any;
  timestamp: number;
}

export interface PronunciationRecord {
  language: string;
  sourceText: string;
  normalizedText: string;
  spokenText: string;
  phoneticRepresentation: string;
  syllables?: string[];
  quality: TTSPronunciationQuality;
  rulesVersion: string;
  notes?: string;
}

export interface TTSChunk {
  index: number;
  text: string;
  spokenText: string;
  pauseAfterMs: number;
  isParagraphEnd: boolean;
  isSentenceEnd: boolean;
}

export interface TTSPlaybackOptions {
  rate?: number;       // Playback rate: 0.5 to 1.5 (default: 0.9)
  pitch?: number;      // Pitch: 0.5 to 1.5 (default: 1.0)
  volume?: number;     // Volume: 0.0 to 1.0 (default: 1.0)
  turnId?: string;     // Unique turn identifier for race condition isolation
  onStart?: () => void;
  onChunkStart?: (chunkIndex: number, totalChunks: number) => void;
  onEnd?: () => void;
  onError?: (error: TTSError) => void;
}

export interface TTSPlaybackInfo {
  engineType: TTSEngineType;
  label: string;
  isNative: boolean;
  notes: string;
  voiceName?: string;
  voiceLang?: string;
  quality?: TTSPronunciationQuality;
  rulesVersion?: string;
}

export type TTSQueueState = 'IDLE' | 'PROCESSING' | 'PLAYING' | 'CANCELLED' | 'ERROR';

export interface TTSObservabilityMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cancelledRequests: number;
  fallbackCount: number;
  averageLatencyMs: number;
  errorCounts: Record<string, number>;
  lastPlaybackDurationMs: number;
}

export interface NativeSpeakerValidationRecord {
  language: string;
  input: string;
  expectedPronunciation: string;
  generatedRepresentation: string;
  verificationStatus: 'VERIFIED' | 'NEEDS_CORRECTION' | 'REJECTED' | 'PENDING';
  reviewer?: string;
  reviewDate?: string;
  notes?: string;
  version: string;
}

// Phase 2: AI Voice Intelligence Engine Types
export type ScriptType = 'ol_chiki' | 'devanagari' | 'latin' | 'bengali' | 'mixed' | 'unknown';

export type SentenceType =
  | 'STATEMENT'
  | 'QUESTION'
  | 'EXCLAMATION'
  | 'INSTRUCTION'
  | 'LIST'
  | 'PARAGRAPH';

export interface TokenContext {
  prevToken: string | null;
  token: string;
  nextToken: string | null;
  lang: string;
  script: ScriptType;
  index: number;
  totalTokens: number;
}

export interface PronunciationCandidate {
  word?: string;
  language?: string;
  script?: ScriptType;
  pronunciation?: string;
  phoneticRepresentation?: string;
  syllables?: string[];
  source: string;
  quality: TTSPronunciationQuality;
  confidenceScore: number;
  ruleVersion?: string;
  context?: string;
  contextMatches?: boolean;
  notes?: string;
  // Backward compatibility aliases
  text?: string;
  spoken?: string;
}

export interface PronunciationEvaluationRecord {
  phrase: string;
  language: string;
  script: ScriptType;
  expectedPronunciation: string;
  actualPronunciationRepresentation: string;
  confidence: TTSPronunciationQuality;
  confidenceScore: number;
  reviewStatus: 'VERIFIED' | 'NEEDS_CORRECTION' | 'REJECTED' | 'PENDING';
  reviewerNotes?: string;
  ruleVersion: string;
  provenance: string;
}

export interface DifficultWordInfo {
  word: string;
  isDifficult: boolean;
  syllableCount: number;
  reason?: string;
  requiresSlowPacing: boolean;
}

export interface SpeechPlan {
  originalText: string;
  normalizedText: string;
  sentenceType: SentenceType;
  baseRate: number;
  plannedRate: number;
  difficultWords: DifficultWordInfo[];
  chunks: TTSChunk[];
  voiceInfo: TTSPlaybackInfo;
  pauseStrategy: string;
}

export interface VoiceHealthStatus {
  voiceName: string;
  failureCount: number;
  lastFailureTimestamp: number;
  isQuarantined: boolean;
  quarantineUntil: number;
}
