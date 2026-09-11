# Bhasha Setu (भाषा | SETU) — Translation Correctness, Provider Isolation & Script Integrity Audit

**Document Classification:** Post-Validation Correctness Investigation & Root-Cause Remediation  
**Date:** September 11, 2026  
**Status:** Remediated & Verified  

---

## 1. Root Cause
During UI testing with input `"Good Morning Students"`, the system exhibited multiple compounding bugs:
1. **Loose Substring / Prefix Fuzzy Matching**: `findSantaliMatch` in `santaliDataset.ts` and `queryTranslationFromDb` in `sqliteService.ts` evaluated a substring match (`normTarget.includes(cleanQuery)` and `LIKE '%good morning students%'`). This improperly matched a 13-word classroom sentence (Row #723: *"Good morning students; welcome to school for a new day of learning."*), promoting a 3-word query to an unrelated paragraph.
2. **Script Contamination via String Interpolation**: Both `SantaliDatasetProvider` and `sqliteService.ts` were injecting `${row.santali} (${row.santali_roman})` directly into the canonical `text` property. This contaminated the Ol Chiki output with Latin alphabet characters, causing `detectOutputScript` to flag the output as `"Mixed (Ol Chiki + Latin)"`.
3. **Contradictory UI Metadata Badges**: In `TextToTextPage.tsx`, static language-pair capabilities (`Google Translate Web Bridge (Unofficial)` and `Full Sentence Supported`) were rendered above the output box unconditionally, while result-level metadata badges below the box displayed `Dataset Translation` and `100% Offline`. This resulted in contradictory provenance.

---

## 2. Exact Problematic Input
- **Input Text**: `"Good Morning Students"`
- **Language Direction**: English $\to$ Santali
- **Requested Output Script**: Ol Chiki (Native)

---

## 3. Original Behavior
- **Output Displayed**:
  `ᱥᱟᱹᱜᱩᱱ ᱥᱮᱛᱟᱜ ᱯᱟᱹᱴᱷᱩᱣᱟᱹ ᱠᱚ; ᱪᱮᱫᱚᱜ ᱨᱮᱭᱟᱜ ᱱᱟᱶᱟ ᱢᱟᱦᱟᱸ ᱞᱟᱹᱜᱤᱫ ᱟᱥᱲᱟ ᱨᱮ ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ᱾ (Johar macet, ale tehenj chanach re tahen kate adi raska le aykaw eda.)`
- **Simultaneous Badges**:
  - `✓ Full Sentence Supported` (from static pair capability)
  - `Offline Dataset Support` (from static pair capability)
  - `Google Translate Web Bridge (Unofficial)` (from static pair capability)
  - `✓ Dataset Translation` (from result reliability)
  - `Script: Mixed (Ol Chiki + Latin)` (from contaminated text detection)
  - `✓ 100% Offline` (from result evidence)

---

## 4. Actual Provider That Produced the Original Output
- **Actual Origin**: In-memory `SantaliDatasetProvider` via `findSantaliMatch()` (NOT Google Translate!).
- **Why Google Was Listed**: The static pair registry in `translationCapabilities.ts` listed `provider: 'Google Translate Web Bridge (Unofficial)'` for the pair, which was rendered in the top header card regardless of the actual translation provider.

---

## 5. Dataset Lookup Result for This Exact Input
- Exact lookup for `"Good Morning Students"` in `Santhali-Words.csv`: **NOT PRESENT** as an exact standalone 3-word sentence.
- Available near-entries in dataset:
  - Row #666: `"Good morning, kids!"` $\to$ `ᱥᱟᱹᱜᱩᱱ ᱥᱮᱛᱟᱜ, ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ!`
  - Row #667: `"good Morning teacher!"` $\to$ `ᱥᱟᱹᱜᱩᱱ ᱥᱮᱛᱟᱜ ᱢᱟᱪᱮᱛ!`
  - Row #723: `"Good morning students; welcome to school for a new day of learning."` $\to$ `ᱥᱟᱹᱜᱩᱱ ᱥᱮᱛᱟᱜ ᱯᱟᱹᱴᱷᱩᱣᱟᱹ ᱠᱚ; ᱪᱮᱫᱚᱜ ᱨᱮᱭᱟᱜ ᱱᱟᱶᱟ ᱢᱟᱦᱟᱸ ᱞᱟᱹᱜᱤᱫ ᱟᱥᱲᱟ ᱨᱮ ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ᱾`

---

## 6. Corrected Provider Priority
Strict hierarchy enforced:
1. **Exact Local Dataset**: Normalized exact sentence match from in-memory Map (`santaliDataset.ts`) or SQLite WASM (`translations.db`).
2. **Verified Phrase Bank**: Exact match from curated phrase dictionary.
3. **Approved Online Provider**: Only when local sentence is unavailable AND online network is accessible. Result is strictly labeled `Online Web Bridge`, `Status: ONLINE ONLY`, `Experimental Translation`.
4. **Vocabulary Fallback**: When offline and no exact sentence exists, report `"No verified offline sentence translation available"` and provide word-level glossary assistance.
5. **Zero Fabrication**: Never promote a 13-word sentence to match a 3-word query.

---

## 7. Script Issue Remediated
- **Root Cause**: `SantaliDatasetProvider` and `sqliteService.ts` concatenated `${sat} (${roman})`.
- **Fix**: Canonical target text returns pure script only (`resultText = exact.sat`). Roman transliteration is stored exclusively in `transliteration: exact.roman`.
- **Script Integrity Validator**: Implemented `validateScriptIntegrity(text, targetScript)` in `translationCapabilities.ts`. Verifies 0 Latin letters in Ol Chiki output, and 0 Ol Chiki glyphs in Roman/Devanagari outputs.

---

## 8. Provenance Issue Remediated
- Removed static pair badges above output textarea that conflicted with actual results.
- Implemented a single, authoritative **Translation Source & Provenance Card** in `TextToTextPage.tsx`:
  - `Translation Source`: `LOCAL VERIFIED DATASET` | `ONLINE WEB BRIDGE` | `LOCAL VOCABULARY`
  - `Status`: `✓ OFFLINE AVAILABLE` | `🌐 ONLINE ONLY`
  - `Match`: `EXACT SENTENCE (Row #ID)` | `ONLINE NEURAL TRANSLATION` | `VOCABULARY ONLY`
  - `Provider`: Real provider name (e.g. `Classroom SQLite Dataset` or `Google Translate Web Bridge`).
  - `Script`: Validated output script name.

---

## 9. Offline Issue Remediated
- Online results (Google Web Bridge / MyMemory) **NEVER** display `"100% Offline"`. They display `Status: ONLINE ONLY`, `Internet Requirement: Internet Required`.
- Offline results from SQLite / in-memory dataset display `Status: OFFLINE AVAILABLE`, `100% Offline`.

---

## 10. Tests Added
Created `scripts/test_translation_correctness.cjs` with 31 automated assertions:
1. Script integrity validation across clean and contaminated text.
2. Exact known sentence verification (Row #169 "I am going to school.").
3. Problematic input audit ("Good Morning Students" strictly rejected from fuzzy matching Row #723).
4. Fuzzy near-match protection across variants.
5. Online vs offline provider isolation and truthful evidence objects.
6. Unsupported Mundari and Ho sentence gating (0 fabrication).
7. UI badge consistency guard.

---

## 11. Test Results
- `scripts/test_translation_correctness.cjs`: **31 Passed, 0 Failed**.
- `npm test`: **83 Passed, 0 Failed**.
- `npm run evaluate:santali`: **280 samples, 98.93% exact En $\to$ Sat, 100.00% Sat $\to$ En**.
- `npm run test:hallucination`: **33 Passed, 0 Failed, Unsupported Sentence Fabrication: 0**.
- `npm run audit:evidence`: **38 Passed, 0 Failed**.
- `npm run validate:device`: **15 Passed, 0 Failed**.
- `npm run check:regression`: **Entry JS: 68.51 kB (< 120 kB threshold)**.
- `cmd /c npm run build`: **Compiled in 3.99s, 0 errors**.
- **Interactive Browser Verification**: Verified in live Chrome session for both "Good Morning Students" (Online Web Bridge, pure Ol Chiki, no dual attribution) and "I am going to school." (Local Verified Dataset, Row #169, instant script switching to Roman and Devanagari).

---

## 12. Remaining Limitations
1. Standalone phrase `"Good Morning Students"` is not part of the 6,780 parallel Santali records. When offline, it safely defaults to word-level vocabulary assistance rather than fabricating a sentence.
2. Online translation bridge requires external internet access; when offline, only in-distribution sentences from the verified dataset are translated at the sentence level.
