# Bhasha Setu — Video Subtitle Review & Verification Workflow

## 1. Why Speech and Singing Are Acoustically Different

In standard speech, vocal formants follow predictable cadence, conversational pauses, and standard phoneme durations. Automatic Speech Recognition (ASR) acoustic models (such as Whisper and Conformer) are trained primarily on conversational speech.

In vocal music (songs):
- **Vowel Prolongation**: Vowels are sustained across musical beats, distorting standard phoneme transitions.
- **Instrumental Masking**: Background orchestration, percussion, and accompaniment reduce the Signal-to-Noise Ratio (SNR).
- **Pitch Modulation**: Melodic variation alters fundamental frequency ($F_0$) contours away from spoken intonation.

As observed in test file `AUDIO SONG.mp4`, Whisper produces tokens with approximately **34% confidence** across the vocal region ($0.0\text{s} \to 24.0\text{s}$), and emits zero speech tokens during the instrumental outro ($24.0\text{s} \to 35.8\text{s}$).

Treating song lyrics as high-confidence conversational speech would produce severe transcription errors. Therefore, Bhasha Setu classifies regions with energy and low confidence as `singing` and mandates human review.

---

## 2. Why Low-Confidence Transcription Requires Review

When ASR confidence falls below 65%, phonetic hallucinations frequently occur:
- Phonemes from noisy or musical audio are misrecognized as real words.
- Unpunctuated streams cause poor subtitle segmentation.
- Feeding inaccurate source text into neural translation amplifies errors exponentially (garbage in, garbage out).

### Centralized Confidence Thresholds

| ASR Confidence | Level | Pipeline State | System Action |
|---|---|---|---|
| $\ge 85\%$ | **HIGH** | `AUTO_GENERATED` | Eligible for quick bulk verification if phrase-bank verified. |
| $65\% - 84\%$ | **MEDIUM** | `REVIEW_REQUIRED` | Marked with amber indicator; flagged in Review Queue. |
| $40\% - 64\%$ | **LOW** | `REVIEW_REQUIRED` | Flagged with prominent warning badge; human review strongly recommended. |
| $< 40\%$ | **CRITICAL** | `REVIEW_REQUIRED` | **Readiness Score Capped at 68 (NEEDS_REVIEW)**. Export requires explicit confirmation. |

---

## 3. Source Transcript Editing & Stale Invalidation Workflow

To ensure translation accuracy, the user must be able to correct the original transcript **before** finalizing subtitles.

```
       Original Audio
             │
             ▼
      AI ASR Transcript
             │
             ▼
 ┌───────────────────────┐
 │ USER EDITS TRANSCRIPT │
 └───────────┬───────────┘
             │
             ▼
   Source Text Updated
             │
             ▼
   Translation marked STALE
             │
             ▼
   UI displays: "SOURCE CHANGED"
   [Regenerate Translation]
             │
             ▼
   Fresh Neural Translation Dispatched
             │
             ▼
   Updated Ol Chiki & Latin Script Generated
```

### Technical Mechanism:
- When a cue's `source_text` is modified via the UI or `POST /api/video/cue/update-source`, the backend sets:
  ```python
  cue.is_stale = True
  cue.translation_status = "REVIEW_REQUIRED"
  cue.review_status = "HUMAN_EDITED"
  ```
- The Subtitle Studio immediately displays an amber warning banner:
  > **SOURCE CHANGED: Translation outdated**
  > Source transcript was modified. Click 'Regenerate Translation' to synchronize Ol Chiki and Latin subtitles.
- Clicking **[Regenerate Translation]** sends `POST /api/video/cue/regenerate-translation`, invoking the translation engine with fresh text, clearing the `is_stale` flag, and updating both Ol Chiki and Latin representations.

---

## 4. Subtitle Review Queue Categorization

Rather than overwhelming the user with a repetitive list of identical warnings, `SubtitleReviewQueue.tsx` aggregates issues into four actionable batches:

1. **Acoustic Recognition Issues** (Low ASR confidence, musical interference).
2. **Translation & Staleness Issues** (Unverified machine translations, stale translations needing regeneration).
3. **Readability & CPS Issues** (Subtitles exceeding 20 characters/sec or spanning $>2$ lines).
4. **Timing & Overlap Issues** (Gaps, boundary collisions, or cues $<0.8\text{s}$).

Each category provides a **[Review All]** or **[Approve High-Confidence Batch]** action, enabling rapid editorial workflow.

---

## 5. Subtitle Cue Lifecycle & Verification States

Each cue transitions through the following lifecycle:

```
[AUTO_GENERATED] ──(Low Confidence)──> [REVIEW_REQUIRED]
       │                                     │
  (Human Edit)                          (Human Edit)
       │                                     │
       ▼                                     ▼
 [HUMAN_EDITED] ◄────────────────────────────┘
       │
 (Approve Click)
       │
       ▼
 [HUMAN_VERIFIED / APPROVED]
```

- **Provenance Tracking**: Every cue records its creation method:
  - Recognition: `faster-whisper-large-v3`
  - Translation: `google` / `phrase_bank` / `domain_glossary` / `human`
  - Voice: `indic-parler-tts` / `browser-fallback`
