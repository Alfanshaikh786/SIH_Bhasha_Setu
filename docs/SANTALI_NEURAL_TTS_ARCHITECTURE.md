# Bhasha Setu — Native Santali Neural TTS Architecture & Roadmap
**Phase 6 Specification & Engineering Whitepaper**

---

## A. Current TTS Architecture

Bhasha Setu currently operates a production-hardened, multi-tier speech synthesis pipeline configured for low-resource tribal language communication:

```
User Input (Ol Chiki / Roman Santali)
                  │
                  ▼
   [ Intelligent Normalizer ] ── (Clinical vitals, digits, abbreviations)
                  │
                  ▼
   [ Context Window Engine ]  ── (Tri-token context & cultural compound analysis)
                  │
                  ▼
 [ Multi-Tier Pronunciation ] ── (Native golden corpus -> Dataset parallel phrases -> 
                                  Curated lexicon -> Diacritic rules -> Roman guide)
                  │
                  ▼
    [ Prosody & Chunking ]   ── (Sentence-type detection & punctuation pause intervals)
                  │
                  ▼
      [ Voice Quality Router ] ── (Acoustic voice scoring, health monitoring & fallback)
                  │
                  ▼
    [ Web Speech API Engine ] ── (Indian English / Hindi voice phonetic reproduction)
                  │
                  ▼
     [ PCM16 Audio Export ]  ── (Offline 16-bit WAV download)
```

### Key Characteristics of Current Architecture:
1. **Phonetic Speech Bridge**: Because browser speech engines lack native Santali neural voices, Bhasha Setu converts Santali text (Ol Chiki or Romanized) into verified phonetic representations vocalized through high-clarity Indian acoustic voices (`en-IN` and `hi-IN`).
2. **Deterministic & Infallible**: The pipeline includes Chromium 14s heartbeat watchdogs, reference leak prevention, and Web Audio chime fallbacks.
3. **Transparent**: Never claims to be an on-device neural voice; clearly identifies as a `Phonetic Speech Bridge`.

---

## B. Neural TTS Abstraction

Phase 6 introduces the `INeuralTTSAdapter` interface, decoupling the speech delivery subsystem from the underlying inference engine:

```typescript
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
```

### Request & Result Contracts
* **`NeuralTTSRequest`**: Defines `text`, `language`, `speakerId?`, `speed?` (0.5–1.5), `pitch?` (0.5–1.5), `sampleRate?` (default 22050Hz), `format?` (`pcm_wav` | `pcm16` | `ogg_opus`), and optional chunked streaming callback `onAudioChunk`.
* **`NeuralTTSResult`**: Carries raw `audio` (Uint8Array), `format`, `sampleRate`, `durationSeconds`, `language`, `modelId`, `modelVersion`, and rich telemetry metadata (`LatencyBreakdown`, `engineUsed`, `isFallback`).

---

## C. Model Registry & Versioning

The `TTSModelRegistry` provides centralized discovery, metadata tracking, and environment compatibility validation for all available and planned speech models:

| Model ID | Language | Script | Version | Architecture | Sample Rate | Availability Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `santali-neural-v1` | `sat` | Ol Chiki | 0.1.0-alpha | VITS / ONNX | 22,050 Hz | **`unavailable`** (Weights not deployed) |
| `hindi-browser-native-v1` | `hin` | Devanagari | 1.0.0 | BrowserNative | 16,000 Hz | **`available`** (Web Speech API) |
| `english-browser-native-v1` | `eng` | Latin | 1.0.0 | BrowserNative | 16,000 Hz | **`available`** (Web Speech API) |
| `bengali-browser-native-v1` | `ben` | Bengali | 1.0.0 | BrowserNative | 16,000 Hz | **`available`** (Web Speech API) |
| `mundari-future-v1` | `unr` | Ol Chiki | 0.0.1-stub | VITS | 22,050 Hz | **`unavailable`** (Future Scope) |
| `ho-future-v1` | `hoc` | Ol Chiki | 0.0.1-stub | VITS | 22,050 Hz | **`unavailable`** (Future Scope) |

### Versioning Separation
* **Model Versioning** (`modelVersion`, e.g. `0.1.0`): Governs acoustic weights, neural network checkpoints, and latent embeddings.
* **Rules Versioning** (`rulesVersion`, e.g. `4.0.0`): Governs text normalizers, Ol Chiki diacritic rules, and contextual compound lexicons.

---

## D. Deterministic Capability Routing

The `TTSCapabilityResolver` evaluates language, script, network connectivity, and model availability using a strict 6-tier deterministic priority hierarchy:

```
[ Incoming Request (Lang, Script) ]
                 │
                 ▼
 1. Native Verified Neural TTS? ──(Yes)──► [ Execute Native Neural Engine ]
                 │ (No)
                 ▼
 2. Trusted Remote Neural TTS?  ──(Yes)──► [ Execute Remote Inference Microservice ]
                 │ (No)
                 ▼
 3. Trusted Local Neural TTS?   ──(Yes)──► [ Execute WASM/ONNX Local Model ]
                 │ (No)
                 ▼
 4. Browser Native Voice?       ──(Yes)──► [ Execute Web Speech API Native Voice ]
                 │ (No)
                 ▼
 5. Phonetic Speech Bridge?     ──(Yes)──► [ Execute Ol Chiki Linguistic Bridge ]
                 │ (No)
                 ▼
 6. Safe Fallback               ─────────► [ Web Audio Chime / Visual Message ]
```

### Deterministic Routing Matrix:
* **Santali (`sat`)**:
  * If `santali-neural-v1` is installed & verified: `NATIVE_VERIFIED_NEURAL` -> fallback `PHONETIC_SPEECH_BRIDGE`.
  * If `santali-neural-v1` is unavailable (Current Default): **`PHONETIC_SPEECH_BRIDGE`** -> fallback `SAFE_FALLBACK`.
* **Hindi (`hin`)**:
  * Browser voice available: **`BROWSER_NATIVE_VOICE`** (`hi-IN`).
* **English (`eng`)**:
  * Browser voice available: **`BROWSER_NATIVE_VOICE`** (`en-IN`).
* **Bengali (`ben`)**:
  * Browser voice available: **`BROWSER_NATIVE_VOICE`** (`bn-IN`).
* **Mundari (`unr`) & Ho (`hoc`)**:
  * Explicitly isolated to **`SAFE_FALLBACK`** with honest future scope logging.

---

## E. Santali Model Readiness Roadmap

To transition from Phase 6 (Architecture Ready) to a full native neural model, the following milestones must be reached:

```
Stage 1 (Current - Phase 6): Model-Ready Architecture, Contracts & Fallbacks
                           ↓
Stage 2: Ethical Native Speech Data Collection (10–20h Studio/Quiet Field)
                           ↓
Stage 3: Corpus Alignment & Linguistic Validation (Ol Chiki Text-to-Audio)
                           ↓
Stage 4: Acoustic Model Training (VITS / FastSpeech2 / Piper-ONNX)
                           ↓
Stage 5: Native Speaker Quality Audit & Benchmark Evaluation
                           ↓
Stage 6: On-Device Quantization (WASM SIMD / ONNX Runtime Web / WebGPU)
                           ↓
Stage 7: Production Rollout (Registry status updated to 'available')
```

---

## F. Dataset Contract

The `SantaliSpeechSampleContract` defines the required structure for any speech recording entering the training corpus:

```typescript
export interface SantaliSpeechSampleContract {
  sampleId: string;
  text: string;
  script: 'ol_chiki' | 'latin';
  language: 'sat';
  audio: {
    format: 'pcm_wav' | 'flac';
    sampleRate: number; // Must be >= 16000 Hz (recommended: 22050 Hz or 44100 Hz)
    durationMs: number; // 500ms to 25000ms
    channels: 1;        // Mono channel strictly enforced
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
```

---

## G. Data Ethics & Provenance Requirements

1. **Informed Consent**: Every speaker recording must be preceded by documented informed consent (`INFORMED_WRITTEN_CONSENT` or verified `COMMUNITY_CONSENT`). Unconsented or scraped audio is strictly rejected.
2. **Speaker Partition Safety**: Training, validation, and test splits **MUST NOT** share speaker identities. The `SantaliDataEthicsValidator.auditSpeakerSplits()` method enforces zero speaker leakage across splits.
3. **Dialect Balance & Inclusivity**: Santali features regional dialect nuances (Mayurbhanj, Northern/Santhal Parganas, Southern). Recordings must capture explicit dialect metadata.
4. **Licensing**: All collected corpora must be released under verified open or research licenses (e.g. `CC-BY-NC-SA-4.0` or `CDLA-Permissive-2.0`).

---

## H. Audio Format Contract & Normalization

The `TTSAudioNormalizer` enforces standard audio specifications:
* **Encoding**: Linear 16-bit PCM WAV (Standard 44-byte RIFF/WAVE header).
* **Sample Rates Supported**: 16,000 Hz, 22,050 Hz, 24,000 Hz, 44,100 Hz.
* **Channels**: Single-channel Mono (1) required for acoustic modeling; stereo (2) converted.
* **Digital Headroom**: Peak-normalized to -0.5 dBFS (`targetPeak = 0.95`) to prevent clipping artifacts during speaker transducer playback.
* **Integrity Checks**: Automated verification of header integrity, duration calculation, and silence/clipping detection.

---

## I. Failure & Fallback Strategy

Neural TTS models can encounter runtime failures. Bhasha Setu handles these deterministically via structured `NeuralError` codes:

| Error Code | Root Cause | Fallback Action | User Impact |
| :--- | :--- | :--- | :--- |
| `MODEL_UNAVAILABLE` | Weights not deployed | Route to `PhoneticTTSAdapter` | Seamless speech via phonetic bridge |
| `MODEL_LOAD_FAILED` | Corrupt model file / ONNX error | Fall back to `PhoneticTTSAdapter` | Speech succeeds without crashing |
| `MODEL_INCOMPATIBLE` | Browser lacks WASM SIMD / WebGPU | Fall back to `PhoneticTTSAdapter` | Safe execution on low-end hardware |
| `INFERENCE_FAILED` | Tensor shape error or NaN output | Fall back to `PhoneticTTSAdapter` | Audio generated via bridge |
| `NETWORK_FAILED` | Remote inference service timeout | Fall back to local phonetic bridge | Offline resilience preserved |
| `TIMEOUT` | Synthesis took > watchdog limit | Abort turn, cancel watchdog | Prevents browser thread hang |

---

## J. Privacy Architecture

* **Zero PII**: No user input text, clinical transcripts, or synthesized audio waveforms are transmitted to external cloud analytics or logged to persistent remote servers.
* **Local Processing Guarantee**: When native models are deployed, inference runs 100% on-device (via WebAssembly / ONNX Runtime Web).
* **Remote Model Privacy Mandate**: If an optional remote inference service is enabled in future enterprise deployments:
  1. Requests must be encrypted via TLS 1.3.
  2. Text payloads must be processed in ephemeral RAM only.
  3. Audio streams must not be retained on remote inference nodes.
  4. Explicit opt-in required before routing outside the device.

---

## K. Tests & Verification Suite

The dedicated Phase 6 validation suite (`scripts/test_phase6_neural_ready.cjs`) confirms:
* **UI Freeze**: Zero changes to `TextToSpeechPage.tsx`.
* **Honest Declarations**: `santali-neural-v1` strictly declared `unavailable`.
* **Capability Routing**: Accurate resolution across Santali, Hindi, English, Bengali, Mundari, and Ho.
* **Audio Normalization**: 44-byte WAV header validation, clipping detection, and sample rate checks.
* **Data Ethics**: Strict rejection of unconsented samples and enforcement of zero speaker leakage across splits.
* **Non-Regression**: Zero degradation of existing phonetic engine or UI tests.

---

## L. Current Limitations & Honest Disclosure

1. **No Neural Weights Deployed**: Bhasha Setu does not currently bundle a 50MB+ neural weight file. Speech is rendered authentically through the verified Roman phonetic bridge.
2. **Browser Voice Dependency**: The acoustic sound of the voice depends on the client device's installed Web Speech API voices (Indian English / Hindi).
3. **Mundari & Ho Scope**: Neural synthesis for Mundari and Ho remains in architectural design phase; full sentence translation and TTS are declared unsupported.
4. **Quality Ceiling**: True human naturalness requires genuine acoustic model training on native speakers, which this Phase 6 architecture paves the way for.
