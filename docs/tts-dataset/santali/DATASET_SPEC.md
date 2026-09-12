# Bhasha Setu — Santali Speech Dataset Technical Specification

**Specification Version:** 1.0.0  
**Dataset Identifier:** `santali-tts`  
**Dataset Semantic Version:** `v0.1.0`  
**Schema Version:** `2026.1`  
**Date:** September 2026  

---

## 1. Dataset Directory Architecture

The dataset repository and storage volume are organized into strict non-destructive layers:

```text
santali-tts/
├── dataset_manifest.json          # Dataset-level metadata, versioning, and summary stats
├── speakers.json                  # Privacy-preserving speaker demographic records
├── consent_ledger.json            # Cryptographically mapped consent registry
├── manifests/
│   ├── train.jsonl                # Machine-readable training partition
│   ├── validation.jsonl           # Validation partition (speaker disjoint)
│   └── test.jsonl                 # Benchmark test partition (speaker disjoint)
├── audio/
│   ├── raw/                       # Immutable master recordings (original capture format)
│   └── canonical/                 # Preprocessed, peak-normalized 22.05kHz/24kHz 16-bit PCM WAV
├── transcripts/
│   ├── raw/                       # Original prompt text as authored or recorded
│   └── normalized/                # Linguistically validated Ol Chiki NFC text
└── quality_reports/
    └── audit_latest.json          # Automated audio and transcript verification outputs
```

---

## 2. Speech Sample Record Schema

Each recording unit within the corpus conforms to the following schema:

```json
{
  "$schema": "https://bhashasetu.org/schemas/speech-sample-v1.json",
  "sampleId": "SAT_REC_000142",
  "speakerId": "SAT_SPK_004",
  "language": "sat",
  "script": "ol_chiki",
  "text": "ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ • ᱟᱵᱚᱣᱟᱜ ᱫᱤᱥᱚᱢ ᱫᱚ ᱵᱷᱟᱨᱚᱛ ᱠᱟᱱᱟ ᱾",
  "normalizedText": "ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ ᱟᱵᱚᱣᱟᱜ ᱫᱤᱥᱚᱢ ᱫᱚ ᱵᱷᱟᱨᱚᱛ ᱠᱟᱱᱟ ᱾",
  "audioPath": "audio/canonical/SAT_REC_000142.wav",
  "duration": 4.12,
  "sampleRate": 22050,
  "channels": 1,
  "bitDepth": 16,
  "dialect": "Mayurbhanj",
  "recordingEnvironment": "quiet_indoor",
  "microphone": "usb_condenser",
  "consentId": "CNS_SAT_2026_004",
  "consentStatus": "ACTIVE",
  "transcriptionStatus": "VERIFIED",
  "qualityStatus": "PASS",
  "reviewStatus": "EXPERT_APPROVED",
  "datasetVersion": "v0.1.0",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "notes": "Verified native checked plosive on 'ᱫᱤᱥᱚᱢ'"
}
```

---

## 3. Speaker Record Schema & Strict Privacy Policy

To protect community members, **unnecessary personal identifying information (PII) is strictly prohibited from collection or storage**:
* ❌ **Prohibited Fields:** Full personal names, phone numbers, email addresses, home addresses, Aadhaar/government IDs, passwords, biometric face data, financial data.
* ✅ **Permitted Fields:** Pseudonymous ID, broad age ranges, self-identified gender, district/region, native language status.

```json
{
  "speakerId": "SAT_SPK_004",
  "language": "sat",
  "dialect": "Mayurbhanj",
  "ageRange": "26-40",
  "gender": "female",
  "region": "Mayurbhanj, Odisha",
  "nativeLanguage": "Santali",
  "recordingExperience": "occasional",
  "consentId": "CNS_SAT_2026_004"
}
```

---

## 4. Canonical Audio Standards

1. **Format:** Uncompressed linear Pulse-Code Modulation (PCM) RIFF/WAVE.
2. **Channel:** Single-channel Mono.
3. **Sampling Rate:** `22,050 Hz` or `24,000 Hz` (matching modern neural acoustic backbones).
4. **Bit Depth:** `16-bit signed integer` (archival raw capture allows `24-bit PCM`).
5. **Peak Normalization:** Normalized to `$-1.0\text{ dBFS}$` peak amplitude.
6. **Integrated Loudness:** `$-23.0\text{ LUFS} \pm 1.0\text{ LUFS}$` per ITU-R BS.1770-4.
7. **Silence Trimming:** Leading silence bounded to `$\le 100\text{ ms}$`; trailing silence bounded to `$\le 200\text{ ms}$`.

---

## 5. Future Model Architecture Compatibility

The dataset manifest and audio outputs are intentionally model-agnostic, supporting immediate export to:

* **Piper / VITS:** Generates `metadata.csv` (`filename|transcript|normalized_transcript`).
* **FastSpeech2 / HiFi-GAN:** Generates text transcripts, phoneme alignment manifests, and mel-spectrogram arrays.
* **Glow-TTS / Matcha-TTS:** Ingests character-level sequence representations.
* **SPRING_F5 / F5-TTS:** Compatible with flow-matching prompt audio pairing (`ref_audio_path` + `ref_text`).
