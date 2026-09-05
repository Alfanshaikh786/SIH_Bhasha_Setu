# Mundari MT Dataset Quality Report

**Target File:** `research\datasets\mundari\mundari-train.csv`  
**Audit Timestamp:** 2026-09-05  
**Data Source:** MMLoSo Language Challenge 2025 / AdiBhashaa (Ministry of Tribal Affairs, Govt of India)  

---

## 1. Executive Summary
- **Total Rows Audited:** 20,000
- **Valid Rows (non-empty):** 20,000
- **Empty Rows:** Hindi: 0 | Mundari: 0
- **Duplicate Pairs:** Exact: 0 (0.0%) | Normalized: 0 (0.0%)
- **Ol Chiki (Santali Contamination):** 0 rows flagged.
- **Predominant Script for Mundari:** Devanagari (18,942 rows, 94.71%).

---

## 2. Script Distribution (Mundari Column)

| Script Representation | Detected Rows | Percentage | Interpretation |
| :--- | :--- | :--- | :--- |
| **Devanagari (`Deva`)** | 18,942 | 94.71% | Standard orthography used in regional publications |
| **Nag Mundari (`Nagm`)** | 0 | 0.0% | Native script (Mundari Bani) - low digital representation |
| **Latin (`Latn`)** | 0 | 0.0% | Romanized Mundari |
| **Ol Chiki (`Olck`)** | 0 | 0.0% | Santali script (Contamination check) |
| **Mixed Script** | 1,058 | 5.29% | Combinations (e.g. Devanagari with Latin acronyms) |
| **Unknown / Punctuation** | 0 | 0.0% | Isolated symbols or numeric tokens |

---

## 3. Contamination & Linguistic Integrity
1. **Ol Chiki Contamination Check:**
   - Result: **0** occurrences detected.
   - Status: PASSED (Clean from Santali Ol Chiki script)
2. **Hindi Overlap / Orthography Signal:**
   - Mundari text in this authentic benchmark is written in Devanagari script.
   - While the alphabet overlaps with Hindi Devanagari, the lexicon and grammatical markers (e.g. `तना`, `रेयाः`, `हनिः`, `किमिनतेदो`, `जीकुकुरू`) reflect authentic Mundari Austroasiatic morphology, not Hindi sentences.
3. **Latin Contamination:**
   - **925** rows contain significant Latin characters (primarily English acronyms, proper names, or Roman loanwords).

---

## 4. Length Analysis

### Character Level
| Metric | Hindi (Source) | Mundari (Target) | Length Ratio (UNR / HI) |
| :--- | :--- | :--- | :--- |
| **Minimum** | 3.0 | 3.0 | 0.057692307692307696 |
| **25th Percentile** | 42.0 | 41.0 | 0.88 |
| **Median** | 66.0 | 65.0 | 1.01 |
| **Mean** | 79.1 | 78.71 | 1.03 |
| **75th Percentile** | 100.0 | 100.0 | 1.13 |
| **95th Percentile** | 180.0 | 178.0 | 1.4 |
| **Maximum** | 834.0 | 783.0 | 10.4 |

### Word Level
| Metric | Hindi (Source) | Mundari (Target) |
| :--- | :--- | :--- |
| **Mean Words** | 16.31 | 14.21 |
| **Median Words** | 14.0 | 12.0 |
| **Min / Max Words** | 1.0 / 158.0 | 1.0 / 144.0 |

---

## 5. Length Ratio & Alignment Diagnostic
- **Low Ratio (< 0.3):** 38 rows flagged. (Mundari translation significantly shorter than Hindi).
- **High Ratio (> 3.0):** 37 rows flagged. (Mundari translation significantly longer than Hindi).
- **Diagnostic Sample (Low Ratio):**
    - Row 519: Ratio 0.12 | HI: 'दूसरे दिन बच्चियों के जमा होने के बाद उनसे कह रहीं...' | UNR: 'एनते सोबेनको दुड़ुमजना।...'
  - Row 1171: Ratio 0.23 | HI: 'यह अचम्भे वाली बात है !’’ उड़ुगा-‘‘नाता है, लेकिन आ...' | UNR: 'चिलकाते इनिःलोः अबुअः नता होबओअ ?...'
  - Row 2063: Ratio 0.26 | HI: 'बा तेगे तोपाकना-सखूर की फूलो से ही डालियाँ ढकी हुई...' | UNR: 'बा तेगे तोपाकन...'
- **Diagnostic Sample (High Ratio):**
    - Row 275: Ratio 3.02 | HI: 'मेरी इच्छा है कि जैसे भी बन पड़े मेरे साथ उसका विवा...' | UNR: 'अड़ांदी होबा जन चि चुमन रे मोयोद काऊ आद् मोयोद सुकु...'
  - Row 640: Ratio 3.19 | HI: 'वह रोज भगवान के यहाँ जाता और उसकी पत्नी सूनी बुढ़िय...' | UNR: 'ओड़ोः ओते-दिसुम रअः राज्य चिलका चलौका मेनेअः संगीते...'
  - Row 2100: Ratio 3.07 | HI: 'बूढ़े के पास दो बैल थे, एक सफेद और एक काला।...' | UNR: 'इकिर बोंगा कींस जना ओड़ोः एन दंग्रड़ाए हसु रिका कि...'

*Note: These anomalies represent diagnostic markers for data cleaning before neural fine-tuning; they are preserved in raw auditing without destructive alteration.*

---

## 6. Unicode Normalization & Encodings
- **NFC Normalization Discrepancies:** 8546 rows have unnormalized combining diacritics. Normalizing to NFC eliminates all divergences.
- **Replacement Characters (`\uFFFD`):** 0 occurrences found.
