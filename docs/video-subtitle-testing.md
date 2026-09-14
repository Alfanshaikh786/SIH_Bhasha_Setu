# Bhasha Setu — Video Subtitle Quality & Regression Testing

## 1. Automated Verification Suite Overview

The Bhasha Setu localization engine includes a multi-tiered test suite ensuring full acoustic coverage, linguistic validation, regression prevention, and strict preservation of frozen features.

---

## 2. Test Execution Commands & Expected Results

### Test Suite 1: Protected Speech-to-Speech (S2S) Regression
Ensures the frozen S2S system (`src/services/s2s/**`, `src/pages/features/SpeechToSpeechPage.tsx`, `server/asr/**`) remains 100% intact and unaffected.
```powershell
node scripts/test_s2s_phase4_autostop.cjs
```
**Expected Result**:
```
PHASE 4 TEST SUITE RESULTS: 32 / 32 PASSED (100%)
```

---

### Test Suite 2: Video Subtitling Core Pipeline
Verifies 16 kHz audio extraction, timeline preservation across gaps, Unicode Ol Chiki script preservation, and error handling for missing audio streams.
```powershell
.venv\Scripts\python.exe scripts/test_video_subtitles_suite.py
```
**Expected Result**:
```
[PASS] Test A: FFmpeg extraction output is verified 16 kHz mono WAV.
[PASS] Test B: Timeline preserved! Speech 1: 0.2s->2.9s, Speech 2: 7.1s->9.8s
[PASS] Test C: Validation accurately accepts valid cues and rejects invalid/overlapping cues.
[PASS] Test D: Ol Chiki characters (U+1C50-U+1C7F) survived SRT and WebVTT generation intact.
[PASS] Test E: Invalid video cleanly rejected: ValueError
[PASS] Test F: Video without audio cleanly rejected: 'The provided video file does not contain an audio track.'
ALL 6 AUTOMATED TESTS (A, B, C, D, E, F) PASSED!
```

---

### Test Suite 3: Media Classification, Full Timeline Coverage & Safety Gating
Verifies acoustic energy analysis, singing vs instrumental classification, 100% timeline preservation on `AUDIO SONG.mp4`, low-confidence score capping, pure music handling, and stale translation invalidation.
```powershell
.venv\Scripts\python.exe scripts/test_video_media_classification.py
```
**Expected Result**:
```
--- Test 1: Media Classifier & Full Timeline Coverage ---
[PASS] Test 1: Full timeline preserved and media classified into vocal and instrumental regions.
  Total Duration: 35.8s | Vocals: 24.0s | Instrumental Outro: 11.8s | Timeline Coverage: 100.0%

--- Test 2: Low ASR Confidence Caps Status to NEEDS_REVIEW ---
[PASS] Test 2: Low ASR confidence properly capped to NEEDS_REVIEW with review requirement.
  Score: 68 | Status: NEEDS_REVIEW | Reason: Low acoustic ASR confidence (34%) requires human verification before publishing

--- Test 3: Pure Instrumental Media Handling ---
[PASS] Test 3: Pure instrumental media has 100% timeline coverage and zero fake dialogue.

--- Test 4: Source Editing Marks Translation STALE ---
[PASS] Test 4: Stale translation invalidation verified.
ALL 4 ADVANCED PIPELINE TESTS PASSED!
```

---

### Test Suite 4: TypeScript Build & Type Safety
Verifies that all components, service calls, and state models adhere to strict TypeScript types with zero implicit `any`.
```powershell
node node_modules/typescript/bin/tsc --noEmit
```
**Expected Result**:
```
Exit code: 0 (Zero errors)
```

---

## 3. Mandatory Acceptance Criteria Verification Checklist

| Criterion | Requirement | Status | Verification Reference |
|---|---|---|---|
| **Timeline Coverage** | Entire video duration visible; 100% timeline coverage | ✅ PASSED | `server/video/coverage.py`, `SubtitleTimeline.tsx` |
| **Instrumental Detection** | Instrumental sections explicitly identified | ✅ PASSED | `server/video/media_classifier.py` |
| **No Fake Dialogue** | No phantom subtitle text generated for music | ✅ PASSED | `scripts/test_video_media_classification.py` Test 3 |
| **ASR Confidence Gate** | Low ASR confidence (<40%) blocks automatic trust | ✅ PASSED | `server/video/quality.py`, `SubtitleQualityPanel.tsx` |
| **Editable Source** | Source transcript editable before translation | ✅ PASSED | `POST /api/video/cue/update-source`, `SubtitleCueEditor.tsx` |
| **Stale Invalidation** | Source edit marks translation as STALE | ✅ PASSED | `scripts/test_video_media_classification.py` Test 4 |
| **Script Separation** | Ol Chiki treated as script, Santali as language | ✅ PASSED | `server/video/timeline.py`, `src/components/features/video-subtitle/types.ts` |
| **Latin vs TTS Separation**| Romanized text separate from TTS pronunciation text | ✅ PASSED | `server/video/tts/manager.py`, `LatinVoiceWorkspace.tsx` |
| **TTS Provider** | Abstract provider architecture with truth-in-labeling | ✅ PASSED | `server/video/tts/base.py`, `BrowserFallbackTTSProvider` |
| **Video Layout** | Dynamic aspect ratio (16:9, 9:16, 1:1), `object-fit: contain` | ✅ PASSED | `SubtitleVideoPlayer.tsx` |
| **Multi-Lane Timeline** | Time ruler, media classification lane, cue lane | ✅ PASSED | `SubtitleTimeline.tsx` |
| **CPS Validation** | CPS calculated and validated per cue | ✅ PASSED | `server/video/validator.py`, `SubtitleCueEditor.tsx` |
| **Export Safe Guards** | SRT, VTT, MP4 export with review warnings | ✅ PASSED | `SubtitleExportPanel.tsx` |
| **S2S Feature Freeze** | 32/32 existing S2S regression tests pass | ✅ PASSED | `scripts/test_s2s_phase4_autostop.cjs` |
| **TypeScript Build** | Zero compile errors across all source files | ✅ PASSED | `tsc --noEmit` exit code 0 |
