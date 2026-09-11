# Bhasha Setu (भाषा | SETU) — Deterministic SIH Demo Dataset
**Document Version:** 1.0.0  
**Phase:** Final Engineering Freeze & SIH Demo Lock  
**Date:** September 11, 2026  
**Purpose:** Curated, 100% Reproducible 12-Sample Demonstration Suite for Hackathon Presentation  

---

## 12-Sample Deterministic Demonstration Matrix

| # | Demo Category | Exact Input Text | Language Direction | Expected Behavior | Actual Empirical Result | Provider & Row ID | Offline / Online | Provenance & Evidence | Known Limitation |
| :-: | :--- | :--- | :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| **1** | **Simple En $\to$ Sat** | `Please give me water.` | EN $\to$ SAT | Instantaneous exact Ol Chiki retrieval | `ᱤᱧ ᱫᱟᱜ ᱮᱢᱟᱹᱧ ᱢᱮ ᱾` | Local Santali Dataset (Row #197) | 🟢 100% Offline | `exact_match`, Verified Dataset | Fixed vocabulary corpus |
| **2** | **Reverse Sat $\to$ En** | `ᱱᱩᱭ ᱫᱚ ᱜᱟᱹᱭ ᱠᱟᱱᱟᱭ ᱾` | SAT $\to$ EN | Bidirectional exact reverse match | `this is a cow.` | Local Santali Dataset (Row #1) | 🟢 100% Offline | `bidirectional_reverse`, Verified | Lowercase source string |
| **3** | **Hindi $\to$ Santali** | `मैं स्कूल जा रहा हूँ।` | HI $\to$ SAT | Instant Hindi-to-Santali Ol Chiki retrieval | `ᱤᱧ ᱟᱥᱲᱟ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟᱹᱧ ᱾` | Local Santali Dataset (Row #169) | 🟢 100% Offline | `exact_match`, Row #169 | Requires standard Hindi spelling |
| **4** | **Native Ol Chiki Input** | `ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ` | SAT $\to$ EN | Recognition of native Unicode glyphs | `Welcome to our village` / `Greetings` | Phrase Bank / Colloquial Lexicon | 🟢 100% Offline | `phrase_bank`, Verified | Requires Ol Chiki keyboard or copy-paste |
| **5** | **Roman Phonetic Input** | `Johar` | SAT $\to$ EN | Auto-detect Romanized Santali token | `Salute` / `Greetings` | Roman Lexicon Matcher | 🟢 100% Offline | `roman_lexicon`, Verified | Dialectal spelling variations |
| **6** | **Devanagari Translit.** | `I am going to school.` | EN $\to$ SAT $\to$ DEVN | Clean Devanagari matras with zero Ol Chiki leakage | `इञ आसड़ा सेनॉग कानाञ ।` | Transliteration Engine + Row #169 | 🟢 100% Offline | `matra_translit`, 0 Ol Chiki glyphs | Open-mid [ɔ] vowel represented as `ॉ` |
| **7** | **Agriculture Domain** | `This is an ox.` | EN $\to$ SAT | Precise agricultural livestock terminology | `ᱱᱩᱭ ᱫᱚ ᱰᱟᱝᱜᱽᱨᱟ ᱠᱟᱱᱟᱭ ᱾` | SQLite WASM Sandbox (Row #2) | 🟢 100% Offline | `sqlite_indexed`, 0.31 ms warm | Specific to draught ox terminology |
| **8** | **Classroom Education** | `I am going to school.` | EN $\to$ SAT | Standard frontline teacher classroom prompt | `ᱤᱧ ᱟᱥᱲᱟ ᱥᱮᱱᱚᱜ ᱠᱟᱱᱟᱹᱧ ᱾` | Local Santali Dataset (Row #169) | 🟢 100% Offline | `exact_match`, Row #169 | Colloquial regional variation in Roman |
| **9** | **Polysemy & Ambiguity** | `This is a buffalo.` | EN $\to$ SAT | Animal domain boost with alternative candidates | `ᱱᱩᱭ ᱫᱚ ᱵᱤᱴᱠᱤᱞ ᱠᱟᱱᱟᱭ ᱾` (Female) / `ᱠᱟᱰᱟ` (Bull) | Santali Dataset + Domain Weighter | 🟢 100% Offline | `domain_boost`, Row #4 & #5 | English term lacks gender distinction |
| **10** | **Unsupported: Mundari** | `I am going to school.` | EN $\to$ UNR | Refuse full sentence fabrication; show vocabulary | Sentence: `null` (Model Pending); Vocab: `ᱟᱥᱲᱟ` | Capability Registry Interceptor | 🟢 100% Offline | `vocabulary_only`, isFullSentence: false | Full sentence awaiting 5,000 parallel entries |
| **11** | **Unsupported: Ho** | `Please give me water.` | EN $\to$ HOC | Refuse full sentence fabrication; show vocabulary | Sentence: `null` (Model Pending); Vocab: `ᱫᱟᱜ` | Capability Registry Interceptor | 🟢 100% Offline | `vocabulary_only`, isFullSentence: false | Full sentence awaiting 5,000 parallel entries |
| **12** | **Out-of-Vocabulary** | `Quantum teleportation in cryptography.` | EN $\to$ SAT | Offline: Graceful isolation without hallucination | Offline: `null` / Online: Experimental Bridge | Layer 4 Online Bridge (if connected) | 🟡 Online Only | `neural_bridge`, Experimental Flag | Zero offline hallucination |

---

## SIH Demo Script Execution Instructions
1. **Offline Challenge Setup**: Open `/features/text-to-text`. Click **"Test Offline Mode"** in the HUD to simulate zero internet.
2. **Execute Samples 1, 6, 7**: Demonstrate instant sub-millisecond retrieval, Ol Chiki native rendering, and Devanagari matra transliteration.
3. **Execute Sample 10 or 11**: Switch target to **Mundari** or **Ho**. Point out that Bhasha Setu **refuses to hallucinate a fake sentence**, showcasing technical integrity.
4. **Click "View Translation Evidence"**: Show judges the real Row ID (#169, #197), provider name, and `100% Offline` badge.
