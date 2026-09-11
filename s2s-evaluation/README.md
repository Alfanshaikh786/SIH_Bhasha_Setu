# Bhasha Setu — S2S Real Audio Evaluation Repository

This directory contains the golden audio evaluation dataset infrastructure for validating Speech-to-Speech (S2S) speech recognition, translation accuracy, pronunciation, and end-to-end semantic preservation across tribal and national languages.

---

## 1. Directory Structure

```
s2s-evaluation/
├── manifest.schema.json         # JSON schema for evaluation manifests
├── santali/                     # Santali (sat) speech recordings
│   ├── clean/                   # Quiet room, studio mic, high SNR (>25dB)
│   ├── noisy/                   # Fan noise, background chatter, office ambiance (10-20dB SNR)
│   └── field/                   # Rural village, PHC, market, outdoor mobile mic (<10dB SNR)
├── hindi/                       # Hindi (hin) speech recordings
│   ├── clean/
│   ├── noisy/
│   └── field/
└── english/                     # Indian English (eng) speech recordings
    ├── clean/
    ├── noisy/
    └── field/
```

---

## 2. Real Audio Evaluation Governance Rules

1. **Strict Anonymization:**
   - Speaker identifiers must be anonymized (e.g., `spk_sat_001`, `spk_hin_042`).
   - Never record or store Personally Identifiable Information (PII) such as full legal names, Aadhaar numbers, phone numbers, or residential addresses.
2. **Informed Consent Protocol:**
   - Any physical recordings from native speakers must be obtained with voluntary informed consent for academic and open-source evaluation.
3. **No Automatic Training:**
   - Real speech samples collected for evaluation are **never** automatically injected into model training pipelines. They exist solely for objective WER/CER benchmarking, pronunciation auditing, and human verification.
4. **Data Isolation:**
   - Evaluation recordings are strictly isolated from production conversation storage (`bhasha_setu_s2s_db`).
5. **Real Audio Validation Status:**
   - Where actual recordings are pending field collection, the manifest clearly designates:
     `REAL AUDIO VALIDATION PENDING`.
