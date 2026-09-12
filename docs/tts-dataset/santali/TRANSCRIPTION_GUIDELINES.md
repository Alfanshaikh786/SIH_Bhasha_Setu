# Bhasha Setu — Santali Speech Transcription Guidelines

**Document Version:** 1.0.0  
**Target Script:** Ol Chiki (Primary), Roman Santali (Secondary Reference)  
**Date:** September 2026  

---

## 1. Transcription Lifecycle States

Every audio recording in the corpus must undergo rigorous linguistic review before admission into the training manifests:

```text
       [ UNREVIEWED ]
             │
             ▼
      [ TRANSCRIBED ]  <-- Drafted via expert native transcriber or assisted draft
             │
             ├──(Ambiguity / Noise / Dialect Discrepancy)──► [ REVIEW_REQUIRED ]
             │                                                         │
             ▼                                                         ▼
       [ VERIFIED ]  <-- Signed off by accredited native linguist (Admitted to Training)
             │
             ▼ (If unrecoverable mismatch, speech error, or consent issue)
       [ REJECTED ]  <-- Excluded from model manifests
```

> [!WARNING]
> **ASR Ground Truth Prohibition:**  
> Machine-generated speech-to-text transcriptions must **NEVER** be automatically marked as `VERIFIED`. An unreviewed automated transcript is classified as `TRANSCRIBED` and must pass human verification before training inclusion.

---

## 2. Ol Chiki Orthographic Standards

Transcripts must adhere to the standardized **Ol Chiki** writing system established by Pandit Raghunath Murmu:

### 1. Checked Consonants & Deglottalization (Ahad)
* The four checked consonants (`ᱚᱛ` *ot*, `ᱚᱜ` *og*, `ᱚᱪ` *och*, `ᱚᱯ` *op*) naturally carry an unreleased glottal catch.
* When softened into their voiced released counterparts (*d*, *g*, *j*, *b*), the **Ahad (ᱼ)** diacritic must be explicitly written:
  - Example: `ᱫᱟᱜᱼᱟ` (*daga* - to rain) vs `ᱫᱟᱜ` (*daag* - water).

### 2. Nasalization (Mu-Tuda)
* Nasal vowels must be marked with **Mu-Tuda (ᱸ)**:
  - Example: `ᱦᱟᱸ` (*hã*).

### 3. Vowel Modification (Gahla-Tuda)
* Deep/low vowels must carry **Gahla-Tuda (ᱹ)**:
  - Example: `ᱟᱹ` (*ă*), `ᱮᱹ` (*ĕ*).

### 4. Sentence Boundaries (Mucad)
* Single **Mucad (᱾)** corresponds to a full stop / comma boundary.
* Double **Mucad (᱿)** marks paragraph or terminal discourse conclusions.
* Standard Latin punctuation (`?`, `!`, `,`) is permitted in interrogative or exclamatory pedagogical phrases, but standard Santali literature prioritizes Mucad.

---

## 3. Roman Santali Transcription Protocol

Where parallel Roman Santali layers are provided:
1. **No Single Universal Roman Standard:** Recognize that Roman Santali has varying historic missionary and modern academic orthographies (e.g. Bodding notation vs Campbell vs ASCII).
2. **Explicit Scheme Tagging:** Transcripts must declare their `romanizationScheme`:
   - `'bodding_standard'` (diacritic vowels *ạ*, *ẽ*, *ã*, retroflex *ḍ*, *ṛ*)
   - `'bhasha_setu_phonetic'` (ASCII-compatible phoneme bridge)
3. **No English Phonetic Distortion:** Do not transliterate Santali into pseudo-English approximations (e.g. do not write "sh" for unvoiced "s").

---

## 4. Code-Switched & Loan Word Policy

In tribal classrooms, migrant teachers and students frequently code-switch:
* **Naturalized Loans:** Loan words with accepted Ol Chiki orthography should be written in Ol Chiki:
  - Example: `ᱰᱟᱠᱛᱟᱨ` (*daktar* - doctor), `ᱦᱟᱥᱯᱟᱛᱟᱞ` (*haspatal* - hospital), `ᱤᱥᱠᱩᱞ` (*iskul* - school).
* **Unadapted Technical English:** In bilingual pedagogic prompts where English words appear unaltered, maintain script separation:
  - Example: `ᱟᱢ classroom ᱛᱮ ᱪᱟᱞᱟᱣ ᱢᱮ ᱾`
  - Transcribe exactly as spoken without inventing fictitious Ol Chiki phonetic transliterations for unadapted terms.
