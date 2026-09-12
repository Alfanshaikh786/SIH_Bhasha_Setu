/**
 * Bhasha Setu — Phase 6: Native Santali TTS Model-Ready Architecture Types
 * 
 * Formalizes the contracts, interfaces, and metadata schemas required to bridge
 * the existing browser-based phonetic speech engine with a future genuine native
 * Santali neural acoustic model (VITS / FastSpeech2 / Piper / Matcha-TTS).
 */

import { ScriptType, TTSPlaybackOptions } from '../types';

export type AudioFormat = 'pcm_wav' | 'pcm16' | 'ogg_opus' | 'mp3';

export type ModelAvailabilityStatus = 
  | 'available'           // Verified model artifact present and verified
  | 'unavailable'         // Model artifact not yet deployed / service offline
  | 'download_required'   // Model exists in manifest but weights need local download
  | 'incompatible';       // Device / runtime cannot execute model requirements

export type ModelExecutionTarget = 'local' | 'remote' | 'browser';

export type EnginePriority =
  | 'NATIVE_VERIFIED_NEURAL'  // Priority 1: Native verified neural model (on-device/server)
  | 'TRUSTED_REMOTE_NEURAL'   // Priority 2: Trusted remote neural inference microservice
  | 'TRUSTED_LOCAL_NEURAL'    // Priority 3: Local neural model (WebAssembly/ONNX/WebGPU)
  | 'BROWSER_NATIVE_VOICE'    // Priority 4: Browser speech synthesis native voice (hi-IN, en-IN)
  | 'PHONETIC_SPEECH_BRIDGE'  // Priority 5: Linguistic transliteration bridge + Indian voice
  | 'SAFE_FALLBACK';          // Priority 6: Acoustic chime / visual feedback fallback

export interface SpeakerMetadata {
  speakerId: string;
  name: string;
  gender?: 'female' | 'male' | 'non_binary';
  dialectRegion?: string;
  ageGroup?: string;
  nativeStatus: boolean;
}

export interface DatasetProvenanceInfo {
  datasetId: string;
  datasetName: string;
  version: string;
  totalAudioHours?: number;
  totalSpeakers?: number;
  ethicalClearance: boolean;
  nativeSpeakerAudited: boolean;
  license: string;
  sourceUri?: string;
  curationDate?: string;
}

export interface TTSModelManifest {
  modelId: string;
  name: string;
  language: string; // 'sat' | 'hin' | 'eng' | 'ben' | 'unr' | 'hoc'
  script: ScriptType;
  version: string; // Model checkpoint / weights version
  architecture: 'VITS' | 'FastSpeech2' | 'Piper-ONNX' | 'Matcha-TTS' | 'BrowserNative' | 'PhoneticBridge';
  speakerSupport: SpeakerMetadata[];
  sampleRate: number; // e.g. 16000, 22050, 24000, 44100
  supportedFormats: AudioFormat[];
  executionTarget: ModelExecutionTarget;
  availability: ModelAvailabilityStatus;
  license: string;
  datasetProvenance: DatasetProvenanceInfo;
  checksum?: string;
  sizeBytes?: number;
  minMemoryMb?: number;
  requiresWebGPU?: boolean;
  requiresWasmSIMD?: boolean;
}

export interface NeuralTTSRequest {
  text: string;
  language: string;
  speakerId?: string;
  speed?: number;       // 0.5 to 1.5 (default 1.0)
  pitch?: number;       // 0.5 to 1.5 (default 1.0)
  sampleRate?: number;  // Requested sample rate (default matches model)
  format?: AudioFormat; // Default: 'pcm_wav'
  turnId?: string;
  onAudioChunk?: (chunk: Uint8Array, chunkIndex: number, isLast: boolean) => void;
}

export interface NeuralTTSResult {
  audio: Uint8Array | null;
  format: AudioFormat;
  sampleRate: number;
  durationSeconds: number;
  language: string;
  modelId: string;
  modelVersion: string;
  metadata: {
    latencyMs: LatencyBreakdown;
    engineUsed: EnginePriority;
    isFallback: boolean;
    speakerId?: string;
    tokensCount: number;
  };
}

export type NeuralErrorCode =
  | 'MODEL_UNAVAILABLE'     // Model weights/service not deployed
  | 'MODEL_LOAD_FAILED'     // Weights corrupt or runtime failed to initialize
  | 'MODEL_INCOMPATIBLE'    // Browser lacks required WebAssembly/WebGPU features
  | 'INFERENCE_FAILED'      // Model forward pass crashed or produced NaN
  | 'AUDIO_DECODE_FAILED'   // Raw PCM buffer conversion failed
  | 'NETWORK_FAILED'        // Remote inference service connection refused
  | 'TIMEOUT'               // Model execution exceeded safety timeout
  | 'RESOURCE_LIMIT';       // Memory or thread pool limit exceeded

export interface NeuralError {
  code: NeuralErrorCode;
  message: string;
  timestamp: number;
  recoverable: boolean;
  fallbackRecommended: boolean;
  details?: any;
}

export interface LatencyBreakdown {
  requestTimeMs: number;
  initTimeMs: number;
  inferenceTimeMs: number;
  decodeTimeMs: number;
  playbackStartTimeMs: number;
  totalLatencyMs: number;
  realTimeFactor?: number; // audioDuration / inferenceTime
}

export interface ResolutionPlan {
  preferredEngine: EnginePriority;
  fallbackEngine: EnginePriority;
  modelId?: string;
  adapterId: string;
  chain: EnginePriority[];
  reason: string;
  isNativeNeuralAvailable: boolean;
}

export interface EnvironmentCapabilities {
  isOnline: boolean;
  hasWebSpeech: boolean;
  hasWebAudio: boolean;
  hasWebAssembly: boolean;
  hasWasmSIMD?: boolean;
  hasWebGPU?: boolean;
  availableVoices: string[];
}

/**
 * INeuralTTSAdapter: Unified abstraction for neural acoustic engines.
 */
export interface INeuralTTSAdapter {
  readonly id: string;
  readonly name: string;
  readonly targetModelId: string;
  readonly isAvailable: boolean;
  canHandle(langCode: string): boolean;
  synthesize(request: NeuralTTSRequest): Promise<NeuralTTSResult>;
  synthesizeStreaming?(request: NeuralTTSRequest): AsyncIterable<Uint8Array>;
  stop(): void;
}

/**
 * SantaliSpeechSampleContract: Strict schema for training & evaluation speech data.
 */
export interface SantaliSpeechSampleContract {
  sampleId: string;
  text: string;
  script: ScriptType;
  language: 'sat';
  audio: {
    format: 'pcm_wav' | 'flac';
    sampleRate: number; // >= 16000
    durationMs: number;
    channels: 1; // Mono required
    bitDepth: 16;
  };
  speakerId: string;
  speakerMetadata: {
    gender: 'female' | 'male' | 'non_binary';
    ageRange: '18-29' | '30-49' | '50+';
    nativeDialect: string; // e.g. 'Northern Santali', 'Mayurbhanj', 'Southern Santali'
    primaryRegion: string; // e.g. 'Jharkhand', 'Odisha', 'West Bengal'
  };
  recordingMetadata: {
    environment: 'studio' | 'controlled_room' | 'quiet_field';
    microphone: string;
    snrDb?: number;
  };
  transcriptionVersion: string;
  consentStatus: 'INFORMED_WRITTEN_CONSENT' | 'COMMUNITY_CONSENT' | 'REVOKED' | 'NOT_DOCUMENTED';
  qualityStatus: 'GOLDEN_AUDITED' | 'RESEARCH_GRADE' | 'REJECTED' | 'PENDING_REVIEW';
  datasetVersion: string;
  split: 'train' | 'validation' | 'test';
}

export interface NativeSpeakerEvaluationRecord {
  evalId: string;
  text: string;
  language: string;
  referenceAudioUrl?: string;
  generatedAudioUrl?: string;
  modelId: string;
  modelVersion: string;
  intelligibilityScore?: number; // 1 to 5 (Likert)
  naturalnessScore?: number;     // 1 to 5 (Likert)
  pronunciationAccuracyScore?: number; // 1 to 5 (Likert)
  dialectAppropriatenessScore?: number; // 1 to 5 (Likert)
  reviewer: {
    reviewerId: string;
    isNativeSpeaker: boolean;
    dialectRegion: string;
  };
  notes?: string;
  timestamp: number;
}

export interface AudioValidationResult {
  isValid: boolean;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  durationSeconds: number;
  hasClipping: boolean;
  isSilent: boolean;
  errors: string[];
}
