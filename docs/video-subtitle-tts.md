# Bhasha Setu — Video Subtitle TTS Architecture & Phonetic Bridge

## 1. Why Latin Text and TTS Pronunciation Text Are Logically Separate

In Santali (and other low-resource Indian languages), the Latin representation serves two fundamentally different purposes:

1. **Human Visual Romanization (`romanizedText`)**:
   - Designed for human readability and diacritic precision.
   - May contain special phonetic orthographies (such as Santali Latin diacritics: `ā`, `ī`, `ṛ`, `ñ`, `ṅ`, apostrophes for glottal stops).
   - Intended for subtitles and on-screen transliteration.

2. **Acoustic Synthesis Text (`ttsText`)**:
   - Designed for acoustic text-to-speech synthesizers.
   - Requires phonemic expansion, silence anchors, and phonetic substitutions tailored to the specific voice model.
   - For fallback Indian acoustic engines, words may be rewritten into Devanagari/Hindi phonetic approximations to produce natural Indian cadence rather than American/British mispronunciations.

Decoupling `romanized_text` from `tts_text` ensures that formatting adjustments for audio synthesis never corrupt human-facing Latin subtitles.

---

## 2. Modular TTS Provider Architecture (`server/video/tts/`)

```
               POST /api/video/tts/synthesize
                             │
                             ▼
                        TTSManager
                             │
            ┌────────────────┴────────────────┐
            │ Check SHA-256 Audio Cache       │
            │ (Hit -> Instant Cached Audio)   │
            └────────────────┬────────────────┘
                             │ (Miss)
                             ▼
                    Provider Resolution
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
NativeSantaliTTSProvider          BrowserFallbackTTSProvider
(AI4Bharat Indic Parler-TTS)     (Indian Acoustic Cadence Bridge)
- High-fidelity Santali phonemes  - High availability fallback
- Deep neural synthesis           - Zero GPU requirement
- Truth Label:                    - Truth Label:
  "Native Santali Voice"            "Pronunciation Approximation"
```

---

## 3. Truth-in-Labeling Standards

Never deceive the user regarding voice authenticity:
- If synthesis is generated using a fallback browser voice or Indian acoustic bridge, the UI explicitly labels the player:
  > ⚠️ **Pronunciation Approximation (Indian Cadence)**
  > Approximates Santali Latin phonetics via Indian acoustic cadence. Native neural voice synthesis is unavailable on this device.
- If synthesis is generated using a validated Santali neural model, the UI displays:
  > ✨ **Native Santali Voice (Indic Parler-TTS)**

---

## 4. Spoken Translation vs. Synthetic Singing

For musical videos or songs (such as `AUDIO SONG.mp4`):
- The subtitle studio provides **Spoken Translated Audio**.
- The UI explicitly clarifies:
  > **Singing detected.** Spoken translation available. Translated singing is not currently generated.
- Synthetic singing requires melodic pitch tracking and rhythm matching that is not currently reliable for low-resource tribal languages. Bhasha Setu does not attempt fake singing.

---

## 5. Deterministic Audio Caching

To prevent unnecessary GPU/CPU load and latency, audio outputs are deterministically cached using a SHA-256 key:

$$\text{Key} = \text{SHA256}(\text{language} + \text{script} + \text{ttsText} + \text{voice} + \text{speed} + \text{provider})$$

All synthesized audio files are written to `server/data/tts_cache/` as compressed MP3/WAV files and served via high-performance streaming responses.
