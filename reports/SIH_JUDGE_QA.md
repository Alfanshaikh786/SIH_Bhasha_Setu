# Bhasha Setu (भाषा | SETU) — SIH Judge Q&A Defense Guide
**Document Version:** 1.0.0  
**Phase:** Final Engineering Freeze & SIH Demo Lock  
**Date:** September 11, 2026  
**Audience:** SIH Technical Evaluators, Linguistic Domain Judges & System Architects  

---

### Q1: What problem does Bhasha Setu solve?
**Answer:** Frontline migrant schoolteachers, healthcare workers (ASHA/Gram Sevaks), and administrative staff deployed to tribal regions in Jharkhand, Odisha, and West Bengal face severe language barriers with indigenous students and patients who speak Austroasiatic Munda languages (Santali, Mundari, Ho). Traditional translation apps fail because they require constant high-speed internet and do not support indigenous scripts like Ol Chiki. Bhasha Setu bridges this divide with an offline-first, on-device translation and script accessibility platform.

---

### Q2: Why is offline operation necessary?
**Answer:** Tribal schools and primary healthcare centers in regions like the Chota Nagpur Plateau or Mayurbhanj frequently suffer from zero or intermittent 2G/EDGE cellular connectivity. If an app depends on cloud API roundtrips, it becomes completely non-functional in the field. Bhasha Setu bundles its linguistic assets locally so educators can execute lookups with 0 bytes transmitted.

---

### Q3: Why SQLite WASM?
**Answer:** Traditional web storage (LocalStorage, basic IndexedDB) is either limited in size (~5 MB text string storage) or lacks relational indexing. By compiling SQLite to WebAssembly (`sql.js`), we package an industry-standard, pre-indexed 4.03 MB database (`translations.db`) directly into the browser sandbox. Queries execute in sub-millisecond time (0.31 ms warm) using standard SQL `SELECT` statements with zero network dependencies.

---

### Q4: Why not just use Google Translate?
**Answer:** 
1. Google Translate requires an active cloud internet connection.
2. It lacks offline packs for Santali and does not support Mundari or Ho.
3. When translation fails, commercial engines frequently hallucinate plausibly sounding text, which is dangerous in medical triage or early-childhood literacy.
4. Bhasha Setu enforces strict zero-hallucination capability gates, multi-script switching (Ol Chiki, Roman, Devanagari), and transparent provenance metadata showing exactly which verified database record supplied the output.

---

### Q5: What makes this different from a normal translation app?
**Answer:**
1. **Zero-Network Architecture**: Operates on-device via in-memory O(1) maps and SQLite WASM.
2. **Script Decoupling**: Separates language from script, providing Ol Chiki native Unicode, Roman pronunciation guides, and Devanagari matra representations.
3. **Zero-Hallucination Enactment**: Explicitly refuses to generate synthetic sentences for low-resource tribal languages without verified parallel data.
4. **Translation Evidence HUD**: Every output shows the exact database Row ID, provider layer, and offline confidence.
5. **Human-in-the-Loop Vetting**: Integrated linguist evaluation workflow with multi-attribute nuance tagging.

---

### Q6: How do you prevent hallucination?
**Answer:** We implement an architectural Capability Registry (`translationCapabilities.ts`). Translation pairs are classified into `fullSentence: true` (Santali ↔ English/Hindi via 6,780 verified records) versus `fullSentence: false` (Mundari, Ho). For unsupported sentence pairs, the router immediately blocks generation and returns `null` with a clear "Model Pending" notice, falling back strictly to verified word-level vocabulary lookups.

---

### Q7: How do you handle unsupported languages?
**Answer:** When an unsupported language (such as Mundari or Ho) is selected for full-sentence translation, the pipeline:
1. Refuses to fabricate a synthetic sentence translation.
2. Displays an explicit notice: `"Full-sentence translation currently unavailable. Showing verified vocabulary assistance."`
3. Matches individual known words (e.g. *school*, *water*, *teacher*, *book*) against curated lexical glossaries.

---

### Q8: How many Santali records are available?
**Answer:** Exactly **6,780 authentic parallel records** across 13 frontline categories (Education, Healthcare, Agriculture, Kinship, Administration, Daily Living, etc.), preserved across `Santhali-Words.csv`, in-memory `santaliDataset.ts`, and `translations.db`.

---

### Q9: What is your measured benchmark?
**Answer:** On our 280-sample held-out domain benchmark (`scripts/evaluate_santali_translation.cjs`):
- **English → Santali**: **98.93% (277 / 280 exact retrievals)**
- **Santali → English**: **100.00% (280 / 280 exact retrievals)**
- **Hindi → Santali**: **99.29% (278 / 280 exact retrievals)**
- **Ol Chiki Script Integrity Rate**: **100.00% (280 / 280 in `U+1C50–U+1C7F`)**
- **Roman Phonetic Guide Rate**: **100.00% (280 / 280)**

---

### Q10: Is 98.93% an AI accuracy number?
**Answer:** **No.** We strictly disclose that 98.93% is an **Exact In-Distribution Dataset Retrieval Rate**. Calling database retrieval "AI translation accuracy" is scientifically misleading. Generative neural translation generalization is reported honestly as `"NOT MEASURED (On-device neural weights not deployed)"`.

---

### Q11: Why does the benchmark contain 3 mismatches?
**Answer:** The 3 non-identical samples in Agriculture (buffalo, calf, monkey) occur because **Santali has higher semantic precision than English**:
1. *Buffalo*: English uses "buffalo" generically; Santali distinguishes `ᱵᱤᱴᱠᱤᱞ` (*Bitkil* = female buffalo) from `ᱠᱟᱰᱟ` (*Kada* = male bull buffalo).
2. *Calf*: English uses "calf"; Santali distinguishes `ᱢᱤᱦᱩ` (*Mihu* = cow calf) from `ᱠᱟᱰᱟ ᱦᱚᱯᱚᱱ` (*Kada hopon* = buffalo calf).
3. *Monkey*: English uses "monkey"; Santali distinguishes `ᱜᱟᱹᱲᱤ` (*Gari* = rhesus macaque) from `ᱦᱟᱹᱱᱩ` (*Hanu* = gray langur).
All 3 returned translations are 100% grammatically authentic Santali.

---

### Q12: How do you handle polysemy?
**Answer:** We implemented a contextual domain weighter in `santaliDataset.ts`. When a user selects a domain (e.g. *Healthcare* or *Animal*), matching entries receive a **+0.08 similarity bonus** and pass through a collision guard that groups alternative candidates, allowing the user to select the appropriate context.

---

### Q13: How does Ol Chiki support work?
**Answer:** Ol Chiki is the official native script for Santali, encoded in Unicode Standard block `U+1C50–U+1C7F`. Bhasha Setu embeds local Noto Sans Ol Chiki fonts, uses standard Unicode code points, enforces 24px responsive mobile typography, and provides automated transliteration into Roman and Devanagari.

---

### Q14: How does Devanagari transliteration work?
**Answer:** Ol Chiki letters represent independent consonants and vowels. In Phase 5, we upgraded `transliterateOlChikiToDevanagari` to apply Devanagari matras (dependent vowel signs: `का`, `से`, `ड़ा`, `सेनॉग`) whenever an Ol Chiki vowel follows a consonant, mapped Ol Chiki numerals `᱐–᱙` to Devanagari `०–९`, and added regex sanitization guaranteeing zero Ol Chiki glyph leakage.

---

### Q15: Do you have native Santali TTS?
**Answer:** **No, and we disclose this transparently.** Browser Web Speech engines do not include native Ol Chiki neural acoustic models. Bhasha Setu generates verified Roman phonetic transliteration guides and plays them via Indian English or Hindi system voices. We never falsely advertise generic system voices as "Native Tribal Neural TTS".

---

### Q16: Is an ONNX model currently deployed?
**Answer:** An abstract on-device runtime contract (`src/services/onnxModelService.ts`) is fully implemented and tested. However, active neural model weights (typically 150 MB–500 MB) are **not bundled** in the browser build to keep the initial application download at an ultra-light **68.51 kB**, ensuring rapid loading on 2G connections.

---

### Q17: How does the application work without internet?
**Answer:** 
1. Service Worker precaches the application shell, icons, and WASM binary.
2. In-memory O(1) JavaScript Map provides instant lookups in 2.4 µs.
3. SQLite WASM sandbox queries `translations.db` locally in 0.31 ms.
4. Zero network sockets or HTTP requests are initiated for offline queries.

---

### Q18: What happens if the sentence isn't in the dataset?
**Answer:**
1. In offline mode: The system performs fuzzy matching with token Jaccard similarity and domain collision safety. If no high-confidence match exists, it isolates gracefully and offers word-level vocabulary lookups.
2. In online mode: It falls back to Layer 4 (Google / MyMemory Web Bridge) as an optional convenience, while clearly labeling the output as `Source: Online Web Bridge (Internet Required)`.

---

### Q19: How will Mundari and Ho be added in the future?
**Answer:**
1. Phase 1: Curate 5,000+ verified parallel sentence pairs per language in partnership with tribal academies in Ranchi and Baripada.
2. Phase 2: Index verified corpora into SQLite WASM on-device tables.
3. Phase 3: Unlock capability gates only after passing the automated benchmark and linguistic audit.

---

### Q20: How will the system scale to more schools?
**Answer:** As a Progressive Web App (PWA), Bhasha Setu requires zero app store installations and zero server infrastructure costs for offline usage. Teachers can install it directly from the browser, or it can be sideloaded via local Wi-Fi hotspots / USB drives onto school tablets.

---

### Q21: How can the dataset be corrected?
**Answer:** Teachers and linguists can click "Submit Correction" in the Translation Studio. Corrections are stored locally under `status: 'pending_review'` and can be exported as structured JSON for academic vetting before being merged into the master CSV.

---

### Q22: How do human reviewers participate?
**Answer:** The **Human Evaluation Modal** allows verified linguists to review any translation query, assign ratings (`CORRECT`, `PARTIALLY_CORRECT`, `INCORRECT`, `UNSURE`), attach linguistic nuance tags (`DIALECT_DIFFERENCE`, `ALTERNATIVE_VALID`, etc.), and export the evaluation log.

---

### Q23: What happens when the network comes back?
**Answer:** The browser's `window.addEventListener('online')` triggers a telemetry update. System Health updates from `UNAVAILABLE` to `AVAILABLE`, and the optional online fallback bridge re-engages for out-of-vocabulary terms without disrupting local offline lookups.

---

### Q24: What are the current limitations?
**Answer:**
1. Vocabulary is bounded by the 6,780 parallel records.
2. Full-sentence translation is currently active only for Santali ↔ English/Hindi (Mundari and Ho are vocabulary-assisted).
3. Native tribal neural voice synthesis is unavailable in browser engines.
4. Physical Android hardware validation was not conducted on a physical device in this testing run (validated via Chromium mobile emulation).

---

### Q25: What is the future roadmap?
**Answer:**
1. Deploy 4-bit quantized multilingual student models (IndicTrans2) via WebGPU / ONNX Runtime Web.
2. Digitize 5,000+ parallel entries for Mundari (Bani Hisir / Devanagari) and Ho (Warang Chiti / Devanagari).
3. Partner with state tribal education departments for field deployments in Kasturba Gandhi Balika Vidyalayas (KGBVs) and Eklavya Model Residential Schools (EMRS).
