# Bhasha Setu (भाषा | SETU) — Final Engineering Freeze Report
**Document Classification:** Engineering Baseline Frozen for SIH Presentation  
**Document Version:** 5.1.0  
**Date:** September 11, 2026  
**Git Baseline Commit:** `c509604d5282baee48ca15f611c5e0b44d50ff99`  
**Repository:** `Alfanshaikh786/SIH_Bhasha_Setu`  

---

## 1. Final Dataset Size
- **Total Verified Parallel Records**: Exactly **6,780 parallel Santali records** (zero records dropped, altered, or fabricated).
- **Unique English Source Terms**: **6,693**.
- **Multi-Entry English Keys**: **87 keys (174 rows)** completely audited and categorized into valid variants, polysemy, and gendered distinctions.
- **Corpus Formats**:
  - `Santhali-Words.csv`: Master curated parallel dataset (1.94 MB).
  - `src/data/santaliDataset.ts`: In-memory pre-indexed Map (2.19 MB isolated chunk).
  - `public/data/translations.db`: Relational indexed SQLite WASM database (4,034,560 bytes).
- **Missing / Null Values**: **0 (Zero Nulls)** across all columns.

---

## 2. Final Architecture
The system employs an on-device, offline-first orchestration pipeline:
```
User Input (Text / Speech)
   ↓
Language & Script Detection Engine (Ol Chiki, Devanagari, Latin)
   ↓
Translation Orchestrator Router (Domain Weighting & Capability Guard)
   ↓
L1 In-Memory LRU Cache (2.2 µs)
   ↓
Layer 1: In-Memory Santali Dataset (6,780 Records, O(1) Map, 2.4 µs)
   ↓
Layer 2: On-Device SQLite WASM Database (translations.db, 0.31 ms warm)
   ↓
Layer 3: Colloquial Phrase Bank
   ↓
Translation Evidence & Provenance HUD (Row ID, Provider, Offline status)
   ↓
Orthographic & Transliteration Layer:
  - Ol Chiki Native Unicode (U+1C50–U+1C7F)
  - Roman Phonetic Pronunciation Guide
  - Devanagari Matra Transliteration Engine
   ↓
Speech Guidance Layer (Web Speech API with transparent non-native disclosure)
```

For unsupported languages (Mundari, Ho):
```
User Input (Sentence in Mundari / Ho)
   ↓
Capability Gate Interceptor (fullSentence: false)
   ↓
UNSUPPORTED / MODEL PENDING
   ↓
Zero Fabricated Sentences + Verified Word-Level Vocabulary Assistance
```

---

## 3. Supported Languages & Capabilities
- **Santali Full-Sentence Translation**: Bidirectional (English ↔ Santali and Hindi ↔ Santali) backed by 6,780 verified records.
- **Multi-Script Representation**: Instant toggling across Ol Chiki native, Roman phonetic guide, and Devanagari matra script.
- **On-Device Zero-Network Querying**: In-memory hash map lookup in 2.4 µs; SQLite WASM database query in 0.31 ms.
- **Translation Evidence Provenance**: Displays database Row ID, provider layer, retrieval method, and offline confidence.
- **Contextual Domain Disambiguation**: +0.08 domain bonus and collision guards for polysemous terms.
- **PWA Standalone Execution**: Service worker cache-first precaching with responsive mobile layout (360×800 to 412×915).
- **Human Evaluation Lifecycle**: Reviewer rating, nuance tagging, and structured JSON export.

---

## 4. Unsupported Capabilities (Strictly Gated with Zero Hallucination)
- **Mundari Full-Sentence Translation**: Gated to `null` with `"Model Pending"` notice. Word-level vocabulary assistance active.
- **Ho Full-Sentence Translation**: Gated to `null` with `"Model Pending"` notice. Word-level vocabulary assistance active.
- **Native Tribal Neural Voice Synthesis**: Browser engines lack native Ol Chiki acoustic models. Pronunciation is synthesized via Roman phonetic guides using Indian system voices.
- **On-Device Neural Model Weights**: Contract interface ready (`onnxModelService.ts`); active weights not bundled to maintain 68.5 kB bundle size.

---

## 5. Benchmark Results
Evaluated using `scripts/evaluate_santali_translation.cjs` over **280 authentic held-out domain items**:
- **Dataset Retrieval Accuracy (En $\to$ Sat)**: **277 / 280 (98.93%)**
  - Education (50 items): **100.0%**
  - Healthcare (30 items): **100.0%**
  - Greetings (25 items): **100.0%**
  - Family (20 items): **100.0%**
  - Agriculture (40 items): **92.5%**
  - Government (25 items): **100.0%**
  - Emergency (20 items): **100.0%**
  - Numbers (20 items): **100.0%**
  - Daily Conversation (50 items): **100.0%**
- **Dataset Retrieval Accuracy (Sat $\to$ En)**: **280 / 280 (100.00%)**
- **Dataset Retrieval Accuracy (Hi $\to$ Sat)**: **278 / 280 (99.29%)**
- **Ol Chiki Script Integrity Rate**: **280 / 280 (100.00%)** in Unicode block `U+1C50–U+1C7F`.
- **Roman Phonetic Guide Coverage**: **280 / 280 (100.00%)**.
- **Automated Semantic Evaluation**: Reported as `"Automatic semantic evaluation unavailable."`
- **Neural Translation Generation Rate**: Reported as `"NOT MEASURED (On-device neural weights not deployed)"`.

---

## 6. Three Mismatch Analysis (Agriculture Domain)
The 3 non-identical samples in Agriculture (92.5%) are documented in detail in `reports/SANTALI_LINGUISTIC_AUDIT.md`:
1. **"This is a buffalo."** (Row 4 vs Row 5):
   - *Expected (Row 5)*: `ᱱᱩᱭ ᱫᱚ ᱠᱟᱰᱟ ᱠᱟᱱᱟᱭ ᱾` (*Kada* = male bull buffalo)
   - *Returned (Row 4)*: `ᱱᱩᱭ ᱫᱚ ᱵᱤᱴᱠᱤᱞ ᱠᱟᱱᱟᱭ ᱾` (*Bitkil* = female water buffalo)
   - *Analysis*: Santali gender concord vs English generic blanket term. Both rows have identical English source. Both translations are 100% grammatically authentic Santali.
2. **"This is a calf."** (Row 3 vs Row 6):
   - *Expected (Row 6)*: `ᱱᱩᱭ ᱫᱚ ᱠᱟᱰᱟ ᱦᱚᱯᱚᱱ ᱠᱟᱱᱟᱭ ᱾` (*Kada hopon* = buffalo calf)
   - *Returned (Row 3)*: `ᱱᱩᱭ ᱫᱚ ᱢᱤᱦᱩ ᱠᱟᱱᱟᱭ ᱾` (*Mihu* = cow calf)
   - *Analysis*: Santali species distinction vs English generic term.
3. **"This is a monkey."** (Row 23 vs Row 24):
   - *Expected (Row 24)*: `ᱱᱩᱭ ᱫᱚ ᱦᱟᱹᱱᱩ ᱠᱟᱱᱟᱭ ᱾` (*Hanu* = gray langur / लंगूर)
   - *Returned (Row 23)*: `ᱱᱩᱭ ᱫᱚ ᱜᱟᱹᱲᱤ ᱠᱟᱱᱟᱭ ᱾` (*Gari* = rhesus macaque / बंदर)
   - *Analysis*: Primate species distinction in Santali & Hindi vs English generic term.

*Conclusion: None of these are data corruption errors. All three distinguish EXACT STRING RETRIEVAL from LINGUISTIC / SEMANTIC EQUIVALENCE.*

---

## 7. Devanagari Status
- **Matra Engine Complete**: Ol Chiki vowels following consonants emit proper Devanagari dependent vowel signs (`का`, `से`, `ड़ा`, `सेनॉग`).
- **Numeral Mapping Complete**: Ol Chiki digits `᱐–᱙` mapped to Devanagari numerals `०–९` and Roman `0–9`.
- **All Three Conversion Paths Tested**:
  1. English $\to$ Santali $\to$ Devanagari: Verified (`"इञ आसड़ा सेनॉग कानाञ ।"`).
  2. Santali Ol Chiki $\to$ Devanagari: Verified (`transliterateOlChikiToDevanagari`).
  3. Santali Roman $\to$ Devanagari: Verified (`transliterateRomanSantaliToDevanagari`).
- **Zero Ol Chiki Leakage**: Strict regex sanitization guarantees that 0 Ol Chiki glyphs leak into Devanagari output.

---

## 8. Offline Testing Status
- **Methodology**: Evaluated via 12-stage protocol in `reports/OFFLINE_VALIDATION_REPORT.md`.
- **Service Worker**: Cache-First worker (`bhasha-setu-pwa-v3`) precaches application shell, icons, WASM binary, and SQLite database.
- **Cold Reload**: Loads from local CacheStorage in **~48 ms** under zero network connectivity.
- **Lookups**: In-memory lookup executes in **0.0024 ms** and SQLite WASM in **0.31 ms** with **0 bytes transmitted**.
- **External Endpoints**: Deactivated when offline, ensuring zero unauthorized network calls.

---

## 9. Physical Android Testing Status
> [!IMPORTANT]
> **Strict Non-Fabrication Disclosure**:
> - **Physical Android Testing**: **NOT PERFORMED**. No physical Android device or `adb` USB/Wi-Fi bridge was connected to the development host during this run (`scripts/real_device_validation.cjs` confirmed 0 physical devices).
> - **Mobile Viewport Testing**: **PERFORMED via Chromium Viewport Emulation** across 360×800 (budget Android), 390×844 (iPhone 14), and 412×915 (Pixel 7) viewports with automated touch-target (`min-h-[44px]` / `btn-mota`) and text overflow assertions.

---

## 10. Hallucination Testing
- Tested via `scripts/test_hallucination_and_fuzzy.cjs` across common sentences, long sentences, unknown vocabulary, and mixed-language inputs.
- Result: **Unsupported Translation Fabrication Count is strictly 0**.

---

## 11. Provenance Testing
- Tested via `scripts/audit_translation_evidence.cjs` across all 5 provider paths.
- Result: **38 Passed, 0 Failed**. Every translation displays real Row IDs, provider names, and offline flags.

---

## 12. TTS Status
- Labeled honestly as **Phonetic Speech Synthesis (Web Speech API)**.
- Includes prominent disclosure banner explaining that native tribal neural voice models are unavailable in browser engines, and pronunciations are synthesized via Roman phonetic guides through Indian English and Hindi system voices.

---

## 13. Security Status
- Audited in `reports/SECURITY_PRIVACY_FINAL.md`.
- **API Keys / Secrets Leaked**: **0 (Zero)**.
- **Offline Data Leakage**: **0 bytes transmitted**.
- **Storage Hygiene**: Client-side LocalStorage only; clear history feature available.

---

## 14. Performance Status
- **In-Memory Fast Lookup**: **0.0024 ms (2.4 µs)**.
- **L1 Cache Lookup**: **0.0022 ms (2.2 µs)**.
- **SQLite WASM Database Query**: **0.31 ms (warm)**.
- **Devanagari Transliteration**: **0.012 ms (12 µs)**.
- **In-Memory Dataset Heap Footprint**: **5.06 MB**.
- **Total Engine Heap Footprint**: **9.26 MB**.

---

## 15. Bundle Status
- Audited via `scripts/check_bundle_regression.cjs`:
  - **Initial Entry JS**: **68.51 kB** (gzip: **13.92 kB**) — well under 120 kB budget.
  - **Santali Dataset Chunk**: **2,139.35 kB** (gzip: **234.29 kB**) — isolated on-device chunk.
  - **Text-to-Text Studio**: **47.04 kB** (gzip: **12.28 kB**) — well under 80 kB budget.

---

## 16. ONNX Status
- Abstract runtime contract interface implemented in `src/services/onnxModelService.ts`.
- Model weights are not bundled in the client build to preserve the 68.5 kB initial bundle size.

---

## 17. Known Limitations
1. Vocabulary is bounded by the 6,780 parallel Santali records.
2. Full-sentence translation is active only for Santali (Mundari and Ho are vocabulary-assisted).
3. Browser speech engines lack native Ol Chiki acoustic models; Roman phonetic pronunciation guides serve as the verified accessible alternative.
4. Physical Android hardware validation was not conducted on a physical device in this test run (validated via Chromium mobile emulation).

---

## 18. Exact Final Test Commands
```bash
npm test
npm run evaluate:santali
npm run test:hallucination
npm run audit:evidence
npm run validate:device
npm run check:regression
cmd /c npm run build
```

---

## 19. Exact Final Test Results
- `npm test`: **83 Passed, 0 Failed**.
- `npm run evaluate:santali`: **280 samples, 98.93% exact En $\to$ Sat, 100.00% Sat $\to$ En, 99.29% Hi $\to$ Sat, 100% Ol Chiki, 100% Roman**.
- `npm run test:hallucination`: **33 Passed, 0 Failed, Unsupported-language sentence fabrication count: 0** (tested across ordinary, unknown, long, fuzzy, mixed, and transliterated inputs for Mundari and Ho).
- `npm run audit:evidence`: **38 Passed, 0 Failed**.
- `npm run validate:device`: **15 Passed, 0 Failed**.
- `npm run check:regression`: **All chunk thresholds respected** (Entry JS: 68.51 kB).
- `cmd /c npm run build`: **Built in 4.18s, 0 errors**.

---

## 20. Final Claim Wording (Approved Reference)

| Category | Approved Wording | Disapproved / Disqualified Wording |
| :--- | :--- | :--- |
| **Accuracy** | "98.93% exact retrieval on a 280-sample English→Santali benchmark." | "98.93% AI translation accuracy." |
| **Offline** | "Verified 6,780-entry parallel corpus and SQLite WASM sandbox run 100% offline." | "Fully offline neural AI translation." |
| **Neural Models** | "On-device neural model interface prepared; neural weights are not currently deployed." | "AI neural models run offline in the browser." |
| **Unsupported Languages** | "Mundari and Ho are currently unsupported and protected against fabricated sentence translations." | "Mundari and Ho translation supported." |
| **Speech** | "Phonetic speech synthesis guidance via Roman transliteration guides and Web Speech API." | "Native HD Neural Santali TTS." |
| **Hardware** | "Validated via Chromium mobile viewports (360×800, 390×844, 412×915); physical Android hardware testing not performed." | "Tested fully offline on physical Android phones." |

---

## Confirmation of Freeze
**"Engineering baseline frozen for SIH presentation."**
