# Santali Neural Text-to-Speech (TTS) Data & Architecture Requirements

**Document Version:** 1.0  
**Status:** PREREQUISITE SPECIFICATION & FEASIBILITY ASSESSMENT  
**Current Milestone:** Phase 6 — Field Deployment Pilot & Acoustic Hardening  

---

## 1. Executive Summary & Current Feasibility Status

> [!IMPORTANT]
> **OFFICIAL ARCHITECTURAL STATUS:**  
> $$\textbf{NATIVE SANTALI NEURAL TTS: STATUS = NOT YET FEASIBLE}$$  
> **Current Active Solution:** `PhoneticTTSAdapter` (Phonetic Romanization Speech Bridge through high-clarity Indian phonetic acoustics).  
> **Future Prepared Adapter:** `NeuralSantaliTTSAdapter` (Pluggable on-device neural voice interface awaiting validated acoustic dataset).

Training or deploying a native neural voice for Santali without an ethically sourced, professionally recorded, and phonetically aligned corpus leads to catastrophic pronunciation errors, glottal stop distortion (*ahad*, *mu-tuda*), and cultural misrepresentation. 

Bhasha Setu maintains an absolute policy: **Zero Fabricated Voices**. We establish the exact technical, acoustic, linguistic, and legal prerequisites below.

---

## 2. Quantitative Dataset Requirements

| Parameter | Single-Speaker Model (Studio Quality) | Multi-Speaker / Conversational Model |
| :--- | :--- | :--- |
| **Minimum Audio Duration** | 15 – 20 hours of clean audio | 40 – 60 hours across multiple speakers |
| **Total Sentences / Utterances** | 10,000 – 15,000 unique sentences | 25,000 – 40,000 unique sentences |
| **Average Utterance Duration** | 3 – 10 seconds | 2 – 12 seconds |
| **Silence Ratio** | Leading/trailing silence $\le 50\text{ ms}$; no internal dead air $> 300\text{ ms}$ | Natural conversational pause boundaries |
| **Phonetic Balance** | 100% coverage of all 30 Ol Chiki letters + 5 diacritics | Balanced representation of phonotactic combinations |

---

## 3. Acoustic & Recording Specifications

1. **Acoustic Environment:**
   - Professionally treated acoustic booth with background noise floor $\le -55\text{ dBFS}$ (NR-15 / NC-20 compliant).
   - Zero room flutter, room reverberation RT60 $\le 0.15\text{ seconds}$.
2. **Hardware Chain:**
   - Large-diaphragm condenser microphone with flat cardioid frequency response ($20\text{ Hz} - 20\text{ kHz}$).
   - High-fidelity preamplifier with low equivalent input noise ($\le -128\text{ dBu}$).
   - Pop filter positioned $7 - 10\text{ cm}$ from capsule; fixed mouth-to-mic distance ($15\text{ cm}$).
3. **Digital Encoding:**
   - Native uncompressed capture: **48 kHz / 24-bit PCM WAV**.
   - Delivery format for model training: **22.05 kHz or 24 kHz / 16-bit Mono PCM WAV**.
   - Peak normalization: $-1.0\text{ dBFS}$; integrated LUFS: $-23\text{ LUFS} \pm 1.0\text{ LUFS}$.

---

## 4. Linguistic, Transcript & Alignment Requirements

1. **Orthographic Integrity:**
   - All text strictly authored in standard Ol Chiki Unicode (U+1C50 – U+1C7F).
   - Zero Romanized or Devanagari transliteration artifacts in training transcripts.
2. **Diacritic & Glottal Precision:**
   - Explicit labeling and acoustic validation of:
     - **Mu-Tuda** (U+1C74 - nasalization)
     - **Gahla-Tuda** (U+1C75 - baseline vowel rounding)
     - **Relo** (U+1C76 - vowel prolongation)
     - **Ahad** (U+1C78 - checked glottal consonants $\tilde{k}, \tilde{c}, \tilde{t}, \tilde{p}$)
3. **Alignment & Segmentation:**
   - Phone-level or character-level forced alignment (e.g. via Montreal Forced Aligner with customized Ol Chiki acoustic dictionary).
   - Word boundaries verified by native Ol Chiki linguistic experts.

---

## 5. Speaker Diversity & Demographic Representation

To prevent synthetic bias, the corpus must satisfy strict diversity splits:
- **Gender Representation:** 50% Female, 50% Male native Santali voices.
- **Age Cohorts:**
  - Young adults ($18 - 35$): 40%
  - Middle-aged adults ($36 - 55$): 40%
  - Senior native speakers ($56+$): 20%
- **Dialectal Inclusivity:**
  - Standard / Northern Santali (Dumka, Santhal Pargana): 45%
  - Mayurbhanj / Southern Santali (Odisha): 35%
  - Purulia / Western Bengali Santali (West Bengal): 20%

---

## 6. Licensing, Ethics & Community Consent

1. **Free, Prior, and Informed Consent (FPIC):**
   - Explicit written and recorded consent from native speakers for speech synthesis modeling.
   - Clear contract terms stating voice rights, usage boundaries, and protection against unauthorized voice cloning.
2. **Open Access / Permissive Governance:**
   - Data must be licensed under Creative Commons Attribution 4.0 (CC-BY 4.0) or Open Data Commons (ODC-BY) for open educational and public health deployment.
   - Proprietary or closed datasets that forbid public health offline compilation are disqualified.

---

## 7. Dataset Partitioning & Evaluation Methodology

- **Split Ratio:**
  - **Training Set:** 80% (speaker-balanced, phonetically rich)
  - **Validation Set:** 10% (loss convergence & hyperparameter tuning)
  - **Evaluation Test Set:** 10% (**Speaker-Disjoint & Utterance-Disjoint**)
- **Evaluation Metrics for Model Graduation:**
  1. **Mel-Cepstral Distortion (MCD):** Target $\le 5.5\text{ dB}$.
  2. **Character Error Rate (CER) of Synthesized Audio:** Synthesized audio passed through trained IndicConformer ASR must achieve $\text{CER} \le 8.0\%$.
  3. **Human Mean Opinion Score (MOS):** $\ge 4.2 / 5.0$ rated by native Santali speakers across:
     - Naturalness
     - Intelligibility
     - Dialectal acceptance.

---

## 8. Current Publicly Available Corpus Audit

| Public Source | Hours Available | Script / Text | Audio Quality | Status for Neural TTS |
| :--- | :---: | :---: | :---: | :--- |
| **Common Voice Santali** | $< 2$ hours | Mixed | Varied crowdsourced phone audio | Insufficient duration & SNR |
| **AI4Bharat IndicTTS** | In development | Ol Chiki | Studio / Semi-clean | Not yet public for commercial on-device export |
| **OpenSLR Santali** | $\approx 4$ hours | Bengali / Roman script | Radiophonic | Orthographic mismatch (not Ol Chiki aligned) |

### Formal Conclusion
Because no open-source, studio-grade, Ol-Chiki-aligned dataset of $\ge 15\text{ hours}$ with verified community licensing currently exists in the public domain:
$$\textbf{NATIVE SANTALI NEURAL TTS = NOT YET FEASIBLE}$$

The S2S architecture will continue using the high-clarity **Phonetic Romanization TTS Bridge** (`PhoneticTTSAdapter`) with zero disruption to conversational turn-taking, while keeping `NeuralSantaliTTSAdapter` ready as a drop-in component once compliant weights are synthesized.
