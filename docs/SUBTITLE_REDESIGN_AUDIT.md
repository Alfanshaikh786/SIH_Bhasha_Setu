# Bhasha Setu — Video Subtitle & AI Subtitle Studio Redesign Audit (Phase 0)

**Document Date:** September 14, 2026  
**Project:** Bhasha Setu (SIH 2024 / Low-Resource Tribal Language Localization)  
**Scope:** Video Subtitle & AI Subtitle Studio Rebuild & Architecture Hardening  

---

## 1. Current System Architecture

### 1.1. Backend Module Hierarchy (`server/video/`)

The backend video subsystem currently contains 9 functional modules:

```
server/video/
├── ffmpeg_utils.py         # FFmpeg / FFprobe media probing, 16kHz mono extraction, ASS generation, video burning
├── audio_preprocessor.py   # Audio quality metrics (SNR, RMS, speech ratio) & A/B preprocessing for noisy audio
├── timeline.py             # SubtitleCue class, preserve_media_timeline() with overlap clamping, snap-point generator
├── translator.py           # Bilingual translation (Google Translate tl=sat & tl=sat-Latn, phrase bank, glossary, SQLite)
├── segmenter.py            # Line wrapping (max 2 lines, 42 chars/line), punctuation splitting
├── validator.py            # Automated quality invariants (timing, overlaps, empty cues, Unicode integrity)
├── formatters.py           # Generates WebVTT (.vtt) and SubRip (.srt) strings
├── domain_glossary.py      # Curated tribal glossaries (Education, Agriculture, Health, Governance, Community)
└── job_manager.py          # SubtitleJobManager, background ThreadPoolExecutor, JobState & BurnJobState lifecycle
```

### 1.2. Frontend Module Hierarchy (`src/components/features/video-subtitle/`)

The frontend contains 16 components and utility modules:

```
src/components/features/video-subtitle/
├── SubtitleStudio.tsx          # Master workspace, history undo/redo, 3-panel grid, tab coordinator
├── SubtitleCueList.tsx         # Left panel: cue cards with Ol Chiki text, Latin badge, audio listen button
├── SubtitleCueEditor.tsx       # Right panel: cue timing, speaker, translated text, Latin pronunciation card
├── SubtitleVideoPlayer.tsx     # Center video player: HTML5 video element, WebVTT track, transport controls
├── SubtitlePreviewMonitor.tsx  # Mode switcher (Video Preview / Subtitle Only / Linguistic Review)
├── SubtitleTimeline.tsx        # Bottom scrubber: timeline ruler, cue blocks, snap-points
├── AudioWaveform.tsx           # Canvas-based RMS waveform visualization with playhead seeking
├── SubtitleHealthPanel.tsx     # Quality breakdown score (0-100), automated invariant checks, issue queue
├── SubtitleStyleEditor.tsx     # Styling tab: presets, typography, colors, position, background, effects
├── AccessibilityPanel.tsx      # Accessibility audit: contrast, safe area, line count, font support
├── PublishModal.tsx            # Export dialog: format selection (SRT, VTT, MP4), burned-in video preview
├── FixPreviewModal.tsx         # Automated safe correction preview (boundary clamp, line wrap, reindex)
├── useSubtitleHistory.ts       # React custom hook: debounced undo/redo history stack (max 50 states)
├── subtitleUtils.ts            # Formatting, timecode parsing, validation evaluator, WebVTT/SRT generators
├── types.ts                    # TypeScript data contracts: SubtitleCue, StudioCue, ReviewIssue, StyleConfig
└── (VideoSubtitlePage.tsx)     # In src/pages/features/: upload dropzone, language selector, pipeline progress card
```

### 1.3. Current Data Flow & Shortcomings

```
Video Upload -> FFmpeg Audio Extraction -> Whisper ASR -> Google Translate -> Segmenter -> Validation -> UI Studio
```

**Identified Architectural Gaps**:
1. **No Content Classification**: The pipeline blindly passes audio directly to ASR. It cannot differentiate between spoken dialogue, vocal singing/lyrics, instrumental solos, and silence.
2. **Media Tail Misinterpretation**: In `AUDIO SONG.mp4` (35.8s), singing stopped at 24.0s. Because Whisper produced no speech tokens for the remaining 11.8s of pure instrumental music, the user perceived the pipeline as "converting half the video".
3. **Repetitive Low-Confidence Warnings**: When ASR confidence is 34% (due to background music), the UI displays 9 identical warning cards in a flat list without categorized grouping or batch review.
4. **No Translation Invalidation on Source Edit**: If a user corrects an ASR typo in the source transcript, the existing translated text remains silently unchanged rather than being marked `STALE` and requiring regeneration.
5. **TTS Architecture Conflation**: Browser speech synthesis (`window.speechSynthesis`) is directly invoked using the Latin phonetic string without a modular `TTSProvider` abstraction or honest labelling as "Pronunciation Approximation".
6. **Video Container Aspect-Ratio Distortion**: `SubtitleVideoPlayer.tsx` hardcodes an `aspect-video` (16:9) container, which can stretch or letterbox vertical (9:16) or square (1:1) video formats.
7. **Single Overloaded Workspace**: Ol Chiki subtitle editing, Latin pronunciation tuning, TTS listening, style customization, and accessibility auditing are mixed into a single view rather than providing dedicated workflows.

---

## 2. Protected Components (CRITICAL FREEZE — DO NOT MODIFY)

Per [`AGENTS.md`](file:///d:/SIH/AGENTS.md), the entire **Speech-to-Speech (S2S)** translation system is **STRICTLY AND PERMANENTLY FROZEN**. No agent or refactor may edit, touch, or delete these files without password challenge `ALFIYA@786`.

### 2.1. Protected S2S Files
- `src/pages/features/SpeechToSpeechPage.tsx`
- `src/services/s2s/**` (All 23 files: `asrAdapter.ts`, `turnController.ts`, `autoStopController.ts`, `translationDecisionEngine.ts`, `audioPipeline.ts`, `s2sStateMachine.ts`, `ttsEngine.ts`, `ttsAdapter.ts`, `domainSafetyEngine.ts`, `s2sStorage.ts`, `languageRegistry.ts`, `pronunciationDictionary.ts`, `s2sLogger.ts`, `s2sDiagnostics.ts`, etc.)
- `server/asr/**` (`router.py`, `whisper_engine.py`, `santali.py`, `base.py`)
- `server/api/asr_routes.py`
- Test harnesses: `scripts/test_s2s_phase4_autostop.cjs`, `scripts/test_s2s_runtime_speech_chain.cjs`

### 2.2. Invariant Gate
Existing regression suite [`scripts/test_s2s_phase4_autostop.cjs`](file:///d:/SIH/scripts/test_s2s_phase4_autostop.cjs) must pass **32 / 32 tests (100%)** before and after every phase of this redesign.

---

## 3. Existing Reusable Components

The following components and utilities are technically mature and should be preserved and enhanced incrementally:

| Component / Utility | Current Capabilities | Reusability in Redesign |
|---|---|---|
| [`AudioWaveform.tsx`](file:///d:/SIH/src/components/features/video-subtitle/AudioWaveform.tsx) | Canvas RMS waveform generation, playhead seeking, zoom levels | **Reuse**: Add semantic color-coded timeline regions (green = speech, purple = instrumental, gray = silence). |
| [`useSubtitleHistory.ts`](file:///d:/SIH/src/components/features/video-subtitle/useSubtitleHistory.ts) | Immutably tracks undo/redo stacks with debounce for typing | **Reuse As-Is**: Fully functional state machine for cue edits. |
| [`domain_glossary.py`](file:///d:/SIH/server/video/domain_glossary.py) | 5 domain glossaries (Education, Agriculture, Health, Govt, Community), number preservation | **Reuse As-Is**: High-value verified tribal terminology match. |
| [`ffmpeg_utils.py`](file:///d:/SIH/server/video/ffmpeg_utils.py) | Probing, 16kHz mono extraction, ASS generation with font/style options, MP4 subtitle burning | **Reuse & Extend**: Keep robust FFmpeg wrappers, add aspect-ratio metadata extraction. |
| [`formatters.py`](file:///d:/SIH/server/video/formatters.py) | Standard WebVTT and SubRip (.SRT) text generation | **Reuse As-Is**: Compliant timestamp formatting (`HH:MM:SS,mmm` and `HH:MM:SS.mmm`). |
| [`FixPreviewModal.tsx`](file:///d:/SIH/src/components/features/video-subtitle/FixPreviewModal.tsx) | Before/after diff preview for automated safe corrections | **Reuse As-Is**: Excellent QA tool for bulk line-wrapping and overlap fixes. |
| [`PublishModal.tsx`](file:///d:/SIH/src/components/features/video-subtitle/PublishModal.tsx) | Export presets (Web, Social, Educational), ASS burning job dispatch | **Reuse & Extend**: Add Readiness Gate check preventing export of unresolved critical items. |
| [`SubtitleStyleEditor.tsx`](file:///d:/SIH/src/components/features/video-subtitle/SubtitleStyleEditor.tsx) | Presets, font families (Ol Chiki, Sans, Serif), size, weight, alignment, background, effects | **Reuse As-Is**: Presentation state is clean and decoupled from AI cues. |
| [`AccessibilityPanel.tsx`](file:///d:/SIH/src/components/features/video-subtitle/AccessibilityPanel.tsx) | Contrast ratios, safe title area, line limits | **Reuse & Extend**: Separate presentation accessibility from linguistic verification. |

---

## 4. Files to Create

To implement the new pipeline without bloating existing files, the following modular files will be created:

### 4.1. Backend (`server/video/`)
1. **`server/video/media_classifier.py`**:
   - Implements `MediaClassifier` class and `MediaRegion` dataclass.
   - Classifies timeline regions into: `SPEECH`, `SINGING`, `INSTRUMENTAL`, `SILENCE`, `UNKNOWN`.
   - Uses acoustic energy (RMS, SNR), spectral zero-crossing rate, and ASR segment boundaries.
2. **`server/video/coverage.py`**:
   - Implements `MediaCoverageAnalyzer`.
   - Calculates: Total Media Duration, Speech/Lyrics Duration, Instrumental Duration, Subtitle Coverage (seconds & %), and Timeline Coverage ($100\%$).
3. **`server/video/quality.py`**:
   - Implements `WeightedReadinessScore`.
   - Weighted dimensions: Recognition (30%), Translation Verification (25%), Timing Sync (15%), Readability (10%), Unicode/Script (10%), Timeline Coverage (10%).
   - **Safety Invariant**: If recognition confidence is $< 40\%$, maximum overall status is capped at `Needs Review` (never `Excellent`).
4. **`server/video/tts/__init__.py`**:
   - Package initialization.
5. **`server/video/tts/base.py`**:
   - Abstract base class `TTSProvider` and data structures (`TTSRequest`, `TTSResponse`, `TTSVoiceOption`).
6. **`server/video/tts/browser_fallback.py`**:
   - Metadata and parameter resolver for browser client fallback ("Pronunciation Approximation").
7. **`server/video/tts/native_santali.py`**:
   - Provider implementation architecture for native Santali models (evaluating AI4Bharat Indic Parler-TTS) with graceful fallback.

### 4.2. Frontend (`src/components/features/video-subtitle/`)
1. **`src/components/features/video-subtitle/OlChikiWorkspace.tsx`**:
   - **View A**: Dedicated primary workspace for Santali Ol Chiki native subtitle creation, source transcript verification, and line wrapping.
2. **`src/components/features/video-subtitle/LatinVoiceWorkspace.tsx`**:
   - **View B**: Dedicated workspace for Santali Latin phonetic editing, pronunciation fine-tuning, and AI voice playback.
3. **`src/components/features/video-subtitle/SubtitleReviewQueue.tsx`**:
   - Categorized review queue grouping issues by category (Recognition, Translation, Timing, Readability, Script) rather than 9 duplicate warning cards.
4. **`src/components/features/video-subtitle/SubtitleQualityPanel.tsx`**:
   - Comprehensive readiness dashboard with weighted score, safety caps, and linguistic verification status.
5. **`src/components/features/video-subtitle/SubtitleExportPanel.tsx`**:
   - Final export screen with pre-export checklist, unresolved review warnings, and multi-format download.

### 4.3. Documentation (`docs/`)
1. `docs/video-subtitle-architecture.md`
2. `docs/video-subtitle-review-workflow.md`
3. `docs/video-subtitle-timeline.md`
4. `docs/video-subtitle-tts.md`
5. `docs/video-subtitle-testing.md`

---

## 5. Files to Modify

| File | Component | Specific Modifications |
|---|---|---|
| [`server/video/timeline.py`](file:///d:/SIH/server/video/timeline.py) | Data Model | Add to `SubtitleCue`: `media_type`, `recognition_confidence`, `review_status`, `translation_status`, `verification_status`, `cps`, `line_count`, `char_count`, `tts_text`, `is_stale`. Add `MediaRegion` serialization. |
| [`server/video/job_manager.py`](file:///d:/SIH/server/video/job_manager.py) | Pipeline Orchestrator | Insert `MEDIA_CLASSIFICATION` stage, execute `MediaClassifier`, map `media_regions` onto job response, populate extended cue fields. |
| [`server/video/validator.py`](file:///d:/SIH/server/video/validator.py) | Quality Invariants | Add CPS check ($\le 20$ cps), min/max duration checks ($0.8\text{s} \le \text{dur} \le 7.0\text{s}$), gap warnings, Unicode script verification. |
| [`server/video/translator.py`](file:///d:/SIH/server/video/translator.py) | Translation Engine | Encapsulate Google Translate behind `TranslationProvider` interface; add `stale_translation` handling; label output `"Machine Generated"` / `"Not Human Verified"`. |
| [`server/api/video_routes.py`](file:///d:/SIH/server/api/video_routes.py) | API Layer | Add endpoints: `/cue/update-source` (invalidates translation), `/cue/regenerate-translation`, `/tts/synthesize`, `/media-regions`. |
| [`src/services/videoSubtitleService.ts`](file:///d:/SIH/src/services/videoSubtitleService.ts) | Client API | Update interfaces for `SubtitleCue`, `MediaRegion`, `CoverageSummary`, `ReadinessScore`; add client methods for source update and translation regen. |
| [`src/components/features/video-subtitle/types.ts`](file:///d:/SIH/src/components/features/video-subtitle/types.ts) | Type Contracts | Add enums/types for `MediaType`, `ReviewStatus`, `TranslationStatus`, `VerificationStatus`, `TTSStatus`, `MediaRegion`, `ReadinessScore`. |
| [`src/components/features/video-subtitle/subtitleUtils.ts`](file:///d:/SIH/src/components/features/video-subtitle/subtitleUtils.ts) | Calculations & QA | Implement `calculateCPS()`, `calculateWeightedReadiness()`, `validateScriptIntegrity()` (`U+1C50`–`U+1C7F`), and linguistic audit helpers. |
| [`src/components/features/video-subtitle/SubtitleVideoPlayer.tsx`](file:///d:/SIH/src/components/features/video-subtitle/SubtitleVideoPlayer.tsx) | Video Layout | Dynamic aspect-ratio container (16:9, 9:16, 1:1), `object-fit: contain`, `max-height: calc(100vh - 280px)`, no vertical stretching. |
| [`src/components/features/video-subtitle/SubtitlePreviewMonitor.tsx`](file:///d:/SIH/src/components/features/video-subtitle/SubtitlePreviewMonitor.tsx) | Monitor Container | Connect responsive sizing, subtitle overlay styling, and active mode switching. |
| [`src/components/features/video-subtitle/SubtitleTimeline.tsx`](file:///d:/SIH/src/components/features/video-subtitle/SubtitleTimeline.tsx) | Timeline View | Render 3 stacked lanes: Lane 1 (Media Classification: speech, music, silence), Lane 2 (Subtitle Cues), Lane 3 (Review Flags). 100% media duration span. |
| [`src/components/features/video-subtitle/SubtitleCueList.tsx`](file:///d:/SIH/src/components/features/video-subtitle/SubtitleCueList.tsx) | Cue Navigator | Clean card layout, de-duplicated categorized summary, media type badge, review status pills, "+ Add Cue" with types (Dialogue, Lyrics, Instrumental, SFX). |
| [`src/components/features/video-subtitle/SubtitleCueEditor.tsx`](file:///d:/SIH/src/components/features/video-subtitle/SubtitleCueEditor.tsx) | Inspector | 6 clean sections (Recognition, Translation, Latin, Voice, Timing, Validation), source transcript edit with `STALE` warning and "Regenerate" button. |
| [`src/components/features/video-subtitle/SubtitleStudio.tsx`](file:///d:/SIH/src/components/features/video-subtitle/SubtitleStudio.tsx) | Master Studio | Coordinate View A (Ol Chiki) vs View B (Latin & Voice), render Coverage Summary (Total 35.9s, Speech 24.0s, Instrumental 11.9s, Timeline 100%). |
| [`src/pages/features/VideoSubtitlePage.tsx`](file:///d:/SIH/src/pages/features/VideoSubtitlePage.tsx) | Upload & Ingestion | Expose granular pipeline stages (`ANALYZING_AUDIO`, `CLASSIFYING_MEDIA`, `TRANSCRIBING`, `TRANSLATING`, `VALIDATING`). |

---

## 6. Proposed API Enhancements

All changes will be additive to maintain backwards compatibility with existing clients:

### 6.1. GET `/api/video/subtitle-job/{job_id}`
**Response Extension**:
```json
{
  "job_id": "...",
  "status": "COMPLETED",
  "video_duration_sec": 35.804,
  "timeline_coverage_pct": 100.0,
  "subtitle_coverage_sec": 24.0,
  "media_coverage": {
    "total_sec": 35.804,
    "speech_sec": 24.0,
    "instrumental_sec": 11.804,
    "silence_sec": 0.0,
    "timeline_coverage_pct": 100.0
  },
  "media_regions": [
    {
      "id": "reg-1",
      "start_sec": 0.0,
      "end_sec": 24.0,
      "type": "singing",
      "confidence": 0.88,
      "label": "Vocals / Lyrics"
    },
    {
      "id": "reg-2",
      "start_sec": 24.0,
      "end_sec": 35.804,
      "type": "instrumental",
      "confidence": 0.94,
      "label": "Instrumental Outro"
    }
  ],
  "readiness_score": {
    "score": 68,
    "status": "NEEDS_REVIEW",
    "cap_reason": "Low acoustic ASR confidence (34%) requires human verification before publishing.",
    "breakdown": {
      "recognition": 34,
      "translation": 70,
      "timing": 100,
      "readability": 100,
      "unicode": 100,
      "coverage": 100
    }
  },
  "preview_segments": [ /* SubtitleCue objects with extended metadata */ ]
}
```

### 6.2. POST `/api/video/cue/update-source`
Updates the original speech transcript. Automatically transitions translation status to `STALE` so outdated translations are never displayed or exported.
```json
// Request
{
  "job_id": "...",
  "cue_id": "cue_1",
  "updated_source_text": "corrected transcript text"
}
// Response
{
  "cue_id": "cue_1",
  "source_text": "corrected transcript text",
  "translation_status": "STALE",
  "needs_regeneration": true
}
```

### 6.3. POST `/api/video/cue/regenerate-translation`
Re-runs the verified translation provider on the updated source transcript.
```json
// Request
{
  "job_id": "...",
  "cue_id": "cue_1",
  "target_lang": "sat"
}
// Response
{
  "cue_id": "cue_1",
  "translated_text": "...",
  "romanized_text": "...",
  "tts_text": "...",
  "translation_status": "MACHINE_TRANSLATED",
  "provenance": "Google Online (sat + sat-Latn)"
}
```

---

## 7. Risks & Mitigation Matrix

| # | Identified Risk | Severity | Mitigation Strategy |
|---|---|---|---|
| **R1** | Accidentally modifying frozen Speech-to-Speech (S2S) files | **CRITICAL** | Strict zero-touch rule for `src/services/s2s/**`, `src/pages/features/SpeechToSpeechPage.tsx`, and `server/asr/**`. Automated verification via `scripts/test_s2s_phase4_autostop.cjs` (32/32 tests pass). |
| **R2** | Fabricating subtitles or dialogue across instrumental music regions | **HIGH** | Strict media classification: regions classified as `instrumental` generate zero dialogue subtitles. Optional cues default strictly to `[🎵 Instrumental Music]` or `[🎵 Instrumental Outro]`. |
| **R3** | Falsely presenting browser speech synthesis as native Santali TTS | **HIGH** | Explicit UI labelling: if native neural Santali TTS model is unavailable, label synthesis as *"Pronunciation Approximation (Browser Indian Acoustic Route)"*. |
| **R4** | Distorting video layout when playing portrait (9:16) or square videos | **MEDIUM** | Remove hardcoded `aspect-video` container; calculate aspect ratio dynamically from video metadata; set `object-fit: contain` and viewport-bounded `max-height`. |
| **R5** | Exporting unverified, low-confidence translations silently | **MEDIUM** | Readiness Gate: The Publish/Export modal detects unresolved critical review items and explicitly warns the user, requiring confirmation before exporting unverified machine translations. |
| **R6** | Performance lag during real-time cue editing | **LOW** | Decouple presentation styling (fonts, colors, effects) from AI processing; leverage existing immutable history stack in `useSubtitleHistory.ts` with 250ms debounce. |

---

## 8. Conclusion & Phase Progression

Phase 0 Audit is **COMPLETE**. The architecture, reusable assets, protected boundaries, and risk mitigations are rigorously documented. We are ready to proceed incrementally into **Phase 1: Data Model & Media Content Classification**.
