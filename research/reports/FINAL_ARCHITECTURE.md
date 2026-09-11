# Bhasha Setu (भाषा | SETU) — Final Architecture Specification
**Document Version:** 1.0.0  
**Phase:** Final Engineering Freeze & SIH Demo Lock  
**Date:** September 11, 2026  
**System Classification:** Offline-First Tribal Language Translation & Script Accessibility Platform  

---

## 1. Primary Translation Pipeline

The core operational flow for supported languages (Santali ↔ English / Hindi) executes completely on-device without network dependencies:

```
[ User ]
   │
   ▼
[ Input: Speech / Audio / Text ]
   │
   ▼
[ Language & Script Detection Engine ] (languageDetector.ts)
   │ Detects ISO-639 codes and orthographic scripts:
   │ - Ol Chiki (U+1C50–U+1C7F)
   │ - Devanagari (U+0900–U+097F)
   │ - Latin / Roman Phonetics
   │
   ▼
[ Translation Orchestrator Router ] (translationProviders.ts)
   │ Coordinates provider execution order & domain weighting
   │
   ▼
[ L1 In-Memory LRU Cache ] (2.2 µs latency)
   │
   ▼ (Cache Miss)
[ Layer 1: In-Memory Santali Dataset ] (santaliDataset.ts)
   │ 6,780 Verified Parallel Records in O(1) Hash Map (2.4 µs)
   │ Contextual Domain Weighter (+0.08 Boost & Collision Guard)
   │
   ▼ (Dataset Miss)
[ Layer 2: On-Device SQLite WASM Database ] (sqliteService.ts)
   │ translations.db (4,034,560 bytes) via sql.js WebAssembly (0.31 ms)
   │
   ▼
[ Translation Evidence & Provenance Assembly ] (translationEvidence.ts)
   │ Attaches Metadata: Row ID, Provider, Retrieval Method,
   │ Offline Status (100% Offline), and Audit Reliability Badge
   │
   ▼
[ Script Conversion & Transliteration Layer ] (translationService.ts)
   ├─► Native Ol Chiki Unicode (24px prominent mobile typography)
   ├─► Roman Phonetic Pronunciation Guide (e.g. /Iny asra senog kanany./)
   └─► Devanagari Matra Transliteration (Dependent vowel signs & digits ०–९)
   │
   ▼
[ TTS & Speech Playback Layer ] (Web Speech API)
   │ Synthesizes pronunciation using Roman transliteration via Indian English/Hindi voice
   │ Displays transparent non-native disclosure banner
```

---

## 2. Unsupported Language Safety Architecture (Mundari & Ho)

To prevent hallucination in low-resource tribal languages without verified parallel sentence data, Bhasha Setu enforces a hard architectural capability gate:

```
[ User Input: Sentence in Mundari or Ho ]
   │
   ▼
[ Language Capability Registry Gate ] (translationCapabilities.ts)
   │ Checks target language pair capability matrix:
   │ - Mundari: { fullSentence: false, provider: null }
   │ - Ho:      { fullSentence: false, provider: null }
   │
   ▼
[ Capability Gate Interceptor ]
   │ Full-Sentence Generation: STRICTLY BLOCKED
   │ Fabrication Counter: 0 (Zero Hallucinations)
   │
   ▼
[ Transparent User Notification ]
   │ Displays Status: "Model Pending (Full-Sentence Translation Unavailable)"
   │
   ▼
[ Fallback: Word-Level Vocabulary Assistance ]
   │ Queries curated lexical dictionaries for isolated terms
   │ (e.g. school → ᱟᱥᱲᱟ / आश्रम, water → ᱫᱟᱜ / दाः)
```

---

## 3. Optional Online Fallback Architecture (Layer 4)

When internet connectivity is available, the orchestrator provides an optional convenience bridge for terms outside the local corpus:

```
[ Translation Orchestrator ]
   │
   ├── (Is Device Offline or Simulation Mode Active?)
   │     YES ──► Online Provider Completely Disabled (0 Bytes Transmitted)
   │     NO  ──► Check if Core Layer 1 or 2 Matched
   │               HIT  ──► Satisfied On-Device (0 Network Calls)
   │               MISS ──► Fallback to Layer 4
   │
   ▼
[ Layer 4: Online Web Bridge (Unofficial) ]
   ├─► Google Translate Web Bridge (sl=auto, tl=sat/hi/en)
   ├─► MyMemory Web Bridge (Secondary Fallback)
   │
   ▼
[ Provenance Warning Attached ]
   Displays: "Source: Online Web Bridge (Internet Required) — Experimental"
```

---

## 4. Human-in-the-Loop Review Architecture

```
[ Translation Studio Output ]
   │
   ▼
[ "Linguist Review" Action Button ]
   │
   ▼
[ Human Evaluation Review Modal ] (HumanEvaluationModal.tsx)
   │ Records Reviewer Decision:
   │ - Rating: CORRECT | PARTIALLY_CORRECT | INCORRECT | UNSURE
   │ - Nuance Tag: DIALECT_DIFFERENCE | HONORIFIC_MISMATCH |
   │               ALTERNATIVE_VALID | ARCHAIC_TERM |
   │               GRAMMATICAL_FLAW | GLYPH_RENDERING_ISSUE
   │ - Suggested Ol Chiki Correction & Reviewer Notes
   │
   ▼
[ Local Review Storage ] (feedbackService.ts)
   │ Persisted under: status: 'pending_review'
   │ Zero unvetted data mutations to production dataset
   │
   ▼
[ Review Log & JSON Export ]
   │ Downloadable structured JSON for linguist review logs
```

---

## 5. Architectural Invariants (Non-Negotiables)
1. **Zero Entry Loss**: The 6,780 Santali records are immutable and read-only during execution.
2. **Zero Hallucination**: Mundari and Ho full-sentence translations must never return synthetic text.
3. **Zero Ol Chiki Leakage**: When Devanagari script is selected, all Ol Chiki glyphs are converted or sanitized.
4. **Zero Silent Network Traffic**: Offline-supported translations never dispatch external telemetry or data packets.
