# Bhasha Setu — Intelligent Low-Resource Subtitle Studio Architecture

## 1. Executive Summary

Bhasha Setu's **Intelligent Low-Resource Subtitle Studio** is an enterprise-grade, confidence-gated audiovisual localization platform specifically engineered for low-resource tribal and scheduled Indian languages (primarily Santali in Ol Chiki and Latin scripts).

Unlike traditional video subtitlers that treat all audio as continuous speech and blindly trust ASR tokens, Bhasha Setu establishes a **technically trustworthy, verification-first pipeline**. The system detects non-speech musical segments, measures acoustic confidence per token, enforces human review gates, protects script and phonetic representations, and enforces truth-in-labeling across machine translation and acoustic synthesis.

---

## 2. The 13-Stage Neural Localization Pipeline

```
VIDEO INGESTION
      │
      ▼
FFMPEG AUDIO EXTRACTION (16 kHz Mono PCM)
      │
      ▼
ACOUSTIC QUALITY & SNR ANALYSIS
      │
      ▼
MEDIA CONTENT CLASSIFICATION (MediaClassifier)
   ├── Speech
   ├── Singing / Lyrics
   ├── Instrumental / Music
   └── Silence
      │
      ▼
NEURAL RECOGNITION (Faster-Whisper / Conformer ASR)
      │
      ▼
CONFIDENCE ANALYSIS & THRESHOLDING
   ├── High (>= 85%): AUTO_GENERATED
   ├── Medium (65–84%): REVIEW_REQUIRED
   ├── Low (40–64%): REVIEW_REQUIRED + Warning
   └── Critical (< 40%): REVIEW_REQUIRED + Score Cap (<= 68)
      │
      ▼
HUMAN REVIEW GATE (Source Transcript Corrections)
      │
      ▼
TRANSLATION PROVIDER (TranslationProvider Interface)
   ├── Google Translation Provider (Live API / Fallback)
   ├── Verified Phrase Bank Provider
   └── Domain Glossary Provider
      │
      ▼
DUAL SCRIPT GENERATION
   ├── Santali Ol Chiki (Primary Unicode U+1C50–U+1C7F)
   └── Santali Latin (Phonetic Romanization)
      │
      ▼
TTS PROVIDER ARCHITECTURE (TTSProvider Interface)
   ├── NativeSantaliTTSProvider (Indic Parler-TTS)
   └── BrowserFallbackTTSProvider ("Pronunciation Approximation")
      │
      ▼
SUBTITLE & ACCESSIBILITY VALIDATION
   ├── Characters Per Second (CPS <= 20)
   ├── Maximum 2 Lines per Cue
   ├── Safe Title Area & Contrast
   └── Monotonic Non-Overlapping Timestamps
      │
      ▼
EXPORT READINESS & PACKAGING
   ├── SubRip (.SRT)
   ├── WebVTT (.VTT)
   └── Hardcoded / Burned MP4
```

---

## 3. Core Architectural Modules

### Backend (`server/video/`)

| Module | Responsibility |
|---|---|
| `media_classifier.py` | Segments the timeline into semantic acoustic regions (`speech`, `singing`, `instrumental`, `silence`, `unknown`). Computes RMS energy, speech probability, and music probability. |
| `coverage.py` | Analyzes 100% timeline coverage versus active subtitle coverage. Ensures instrumental outros are preserved and recognized as musical content. |
| `quality.py` | Evaluates weighted subtitle readiness (Recognition 30, Translation 25, Timing 15, Readability 10, Unicode 10, Coverage 10). Implements safety caps when ASR confidence is low. |
| `timeline.py` | Manages `SubtitleCue` and `TimelinePreserver`. Stores `media_type`, `review_status`, `translation_status`, `is_stale`, `cps`, `line_count`, and `provenance`. |
| `validator.py` | Enforces broadcast-grade subtitle constraints: maximum 2 lines, characters-per-second limits, minimum/maximum cue duration, Unicode Ol Chiki code page validation, and monotonic ordering. |
| `job_manager.py` | Asynchronous multi-stage job pipeline with atomic stage tracking, cue mutation endpoints (`update_source`, `regenerate_translation`, `approve_cue`), and error recovery. |
| `tts/base.py` | Abstract `TTSProvider` contract, `TTSRequest`, `TTSResponse`, and `TTSVoiceOption` schemas. |
| `tts/native_santali.py` | Native Santali neural synthesis adapter (prepared for AI4Bharat Indic Parler-TTS). |
| `tts/browser_fallback.py` | Indian acoustic phonetic bridge adapter, explicitly labeled as *"Pronunciation Approximation"*. |
| `tts/manager.py` | Centralized TTS dispatcher with deterministic SHA-256 caching across language, script, voice, and speed. |

---

### Frontend (`src/components/features/video-subtitle/`)

| Component | Responsibility |
|---|---|
| `SubtitleStudio.tsx` | Master studio workspace coordinating state, history (undo/redo), keyboard shortcuts, active tab routing, and real-time WebVTT regeneration. |
| `OlChikiWorkspace.tsx` | **View A**: Dedicated primary subtitle publishing workspace displaying responsive video, live Ol Chiki subtitle strip, audio waveform, multi-lane timeline, and cue inspector. |
| `LatinVoiceWorkspace.tsx` | **View B**: Dedicated phonetic and audio workspace displaying script comparison (Ol Chiki vs Latin), TTS voice synthesis transport, playback rate control, and truth-in-labeling badges. |
| `SubtitleVideoPlayer.tsx` | Responsive player with dynamic aspect ratio detection (`16:9`, `9:16`, `1:1`), `object-fit: contain`, subtitle overlay preview, and timecode transport. |
| `SubtitleTimeline.tsx` | Multi-lane timeline featuring Lane 1 (Media Classification: Speech/Lyrics, Instrumental, Silence) and Lane 2 (Subtitle Cues with review badges), interactive seeking, and snap-to-grid. |
| `SubtitleReviewQueue.tsx` | Categorized review queue grouping issues into Recognition, Translation, Readability (CPS), and Timing batches with single-click bulk approvals and regenerations. |
| `SubtitleQualityPanel.tsx` | Comprehensive Subtitle Readiness audit displaying 6 weighted scoring dimensions, safety cap explanations, and media coverage breakdown. |
| `SubtitleExportPanel.tsx` | Verified subtitle packager supporting SRT, WebVTT, and burned MP4 formats, with script selection (Ol Chiki vs Latin) and unverified/stale review blocking guards. |

---

## 4. Truth-in-Labeling Principles

1. **No Fake Dialogue**: Instrumental sections are classified as `🎵 Instrumental` or `Music detected`. The system never hallucinates dialogue to fill timeline gaps.
2. **Machine Translation Disclaimers**: All unverified translations are explicitly marked `Machine Generated` and `Human Review Pending`. Unverified scores like *"98% translation fidelity"* are strictly prohibited.
3. **TTS Phonetic Realism**: Browser TTS fallback is labeled `Pronunciation Approximation (Indian Cadence)`. Native Santali synthesis is reserved for validated neural models.
4. **Recognition Review Gate**: Low-confidence ASR ($< 40\%$) automatically caps overall readiness score at 68 (`NEEDS_REVIEW`), preventing users from unknowingly publishing unverified transcripts.
5. **Separation of Script and Language**: Santali is the language; Ol Chiki and Latin are distinct scripts. Mundari and Ho are isolated language profiles with independent script mappings.
