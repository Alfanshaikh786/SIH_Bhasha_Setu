# Bhasha Setu — Santali Speech Dataset Real-World Recording Pilot Protocol

**Document Version**: `v1.0.0`  
**Dataset Version**: `pilot-v0.1.0`  
**Pipeline Stage**: `PILOT_STAGE_1`  
**Training Readiness State**: `TRAINING_READY: NO` (Pilot evaluation and collection infrastructure validation)

---

## 1. Pilot Purpose & Scope
This pilot protocol defines the operational, linguistic, and acoustic procedures required to validate the end-to-end speech collection workflow for the Bhasha Setu Santali Text-to-Speech (TTS) dataset.

The pilot is **intentionally small and controlled**. Its purpose is to uncover and resolve:
1. Participant communication and plain-language consent workflow friction.
2. Prompt clarity, script legibility, and pronunciation ambiguities in Ol Chiki.
3. Acoustic environment consistency, microphone calibration, and digital gain staging.
4. Human transcription verification, phonetic variation tagging, and ASR alignment.
5. Pseudonymous speaker tracking, multi-take selection, and cascading withdrawal mechanisms.

> [!IMPORTANT]
> This pilot does **NOT** attempt full-scale dataset collection or model training. Training readiness remains **NO** until complete linguistic review and full-scale recording collection are fulfilled.

---

## 2. Participant Eligibility Criteria
To ensure ethical validity and acoustic consistency, voice contributors must satisfy the following objective criteria:
1. **Linguistic Competence**: Native or highly proficient Santali speaker.
2. **Script Proficiency**: Comfortable reading and pronouncing standard Ol Chiki script fluently without coaching.
3. **Informed Consent**: Willingly reviews, understands, and signs the Plain-Language Informed Consent Form.
4. **Acoustic Suitability**: Free of acute vocal strain, severe hoarseness, or respiratory illness during recording sessions.
5. **No Discriminatory Exclusions**: Participant selection strives for gender parity (50% Female / 50% Male) and cross-generational balance (18–30, 31–50, 51+), without fabricating demographic quotas.

---

## 3. Privacy & Decoupled Identity Architecture
In compliance with international ethical data standards and strict PII protection:
* **Pseudonymous Identifiers**: Contributors are assigned opaque identifiers (e.g., `SAT-SPK-0001`, `SAT-SPK-0002`).
* **Strict Separation of Storage**:
  ```text
  [Administrative Identity Store] (Encrypted, Restricted Access, Non-Dataset)
          │
          │ (Opaque Key Mapping Only)
          ▼
  [Pseudonymous Speaker ID] (e.g. SAT-SPK-0001)
          │
          ▼
  [Speech Pilot Manifests & Training Records] (Zero PII: no names, phones, addresses)
  ```
* Under no circumstances may participant names, contact numbers, national identity numbers, or residential addresses be embedded in manifests, filenames, or model training metadata.

---

## 4. Acoustic Environment & Studio Specifications
To eliminate reverberation, comb filtering, and electrical interference:
* **Room Acoustic Treatment**: Enclosed recording space with minimum NRC 0.75 acoustic absorption or dedicated whisper-booth.
* **Ambient Noise Floor**: $\le -45\text{ dBFS}$ (measured across 10 seconds of ambient silence).
* **Microphone Hardware**: Cardioid studio condenser microphone (e.g., large-diaphragm condenser with pop filter).
* **Microphone Positioning**: 15–20 cm from speaker's mouth, angled 15° off-axis to eliminate plosive air bursts.
* **Digitization Standards**:
  * Sampling Rate: **48,000 Hz** (or 44,100 Hz broadcast minimum).
  * Bit Depth: **24-bit PCM** (lossless uncompressed RIFF/WAVE).
  * Channels: **1 Channel (Mono)**.
  * Headroom: Target peak between **-6.0 dBFS and -3.0 dBFS** (zero digital clipping).

---

## 5. Step-by-Step Recording Procedure
Every recording session must follow this exact linear protocol:

```text
1. Confirm Participant Identity & Plain-Language Signed Consent
                           ↓
2. Verify Pseudonymous Speaker ID (e.g. SAT-SPK-0001)
                           ↓
3. Load Approved Pilot Prompt Set (Version pilot-v0.1.0)
                           ↓
4. Acoustic Equipment Check & Gain Staging
                           ↓
5. Record Short Acoustic Calibration Sample (10s ambient + 5s test speech)
                           ↓
6. Automated Calibration QA (Clipping = 0%, Noise <= -45dB, RMS [-28, -14]dBFS)
       ├── Fails: Halt session, adjust gain/environment, recalibrate
       └── Passes: Proceed to pilot prompt sequence
                           ↓
7. Record Prompts (Seeded PRNG Order, Max 3 Takes per Prompt)
                           ↓
8. Real-Time Acoustic & Transcription QA Check
                           ↓
9. Session Completion or Rest Break (Enforce 45-min Continuous Cap)
```

---

## 6. Calibration Recording Specification
Before recording pilot prompts, the operator must record a **Calibration Sample** (`CAL-SPK-XXXX`):
* **Phase 1 (10s Silence)**: Measures room acoustic noise floor.
* **Phase 2 (5s Speech)**: Standard phonetically balanced count (`᱑, ᱒, ᱓, ᱔, ᱕`) to verify preamp gain.
* **Pass Criteria**:
  * Sample Rate: 48kHz or 44.1kHz.
  * Channels: Mono.
  * Clipping: Exactly 0.00%.
  * Peak Level: $\le -1.0\text{ dBFS}$ and $\ge -20.0\text{ dBFS}$.
  * RMS Level: Between $-28\text{ dBFS}$ and $-14\text{ dBFS}$.
  * Noise Floor: $\le -40\text{ dBFS}$.

---

## 7. Natural Speech & Ol Chiki Delivery Guidelines
* **Natural Cadence**: Speakers must speak in their natural conversational rhythm and pitch.
* **No Imitation**: **DO NOT** instruct speakers to imitate the robotic browser fallback synthesizer or exaggerate articulation.
* **No Modifying Prompts**: Operators must never alter prompts during a take. If an orthographic or lexical defect is identified, the prompt must be flagged as `REVIEW_REQUIRED` and returned to the linguistic review queue.
* **Take Limit**: Maximum 3 takes per prompt to avoid vocal fatigue and unnatural repetition.

---

## 8. Speaker Fatigue & Contribution Limits
* **Maximum Continuous Duration**: **45 minutes**.
* **Mandatory Rest Interval**: **15 minutes** after each 45-minute block.
* **Pilot Contribution Cap**: Maximum 50 prompts per speaker during the pilot phase (to ensure multi-speaker balance).
* **Fatigue Triggers**: If the speaker exhibits frequent throat clearing, increasing stutter, or declining signal-to-noise ratio, the operator must immediately halt the session.

---

## 9. Audio QA & Human Listening QA
Each recorded take undergoes dual validation:
1. **Automated Audio QA** (via `audioValidator.ts`):
   * Verifies format header, sample rate, bit depth, channels.
   * Quantifies peak amplitude, RMS energy, clipping percentage, and trailing silence.
   * Assigns deterministic status: `PASS`, `WARNING`, `REJECT`.
2. **Human Listening QA** (by qualified Native Santali Reviewer):
   * Evaluates pronunciation naturalness, phonetic clarity, and intelligibility.
   * Verifies absence of mouth clicks, clothes rustle, or room echo.
   * Assigns rating: `EXCELLENT`, `ACCEPTABLE`, `NEEDS_RETAKE`, `UNUSABLE`.

---

## 10. Human Transcription QA
A native reviewer compares the recorded audio against the approved prompt:
* `EXACT_MATCH`: Spoken content matches approved prompt verbatim.
* `MINOR_VARIATION`: Non-semantic phonetic variation or minor natural hesitation.
* `REVIEW_REQUIRED`: Substituted words, missing words, or dialectal divergence.
* `REJECTED`: Severe misreading, hallucination, or truncation.

---

## 11. Immutability, Hashing & Pilot Dataset Structure
* **Raw Audio Immutability**: All original recorded takes are written to `pilot/raw/` and marked **read-only**. Raw takes are never overwritten, truncated, or lossy-compressed.
* **Cryptographic Hashing**: Every raw audio take is fingerprinted using **SHA-256**.
* **Directory Structure**:
  ```text
  docs/tts-dataset/santali/pilot/
  ├── PILOT_PROTOCOL.md
  ├── INFORMED_CONSENT_FORM.md
  ├── raw/               <- Immutable original 24-bit PCM WAV recordings
  ├── processed/         <- Trimmed / normalized training-ready audio
  ├── manifests/         <- pilot_manifest.json and pilot_manifest.jsonl
  ├── reports/           <- Machine-readable audit and quality reports
  └── consent/           <- Pseudonymous consent status logs
  ```

---

## 12. Participant Withdrawal Mechanism
Participants retain an unconditional right to withdraw their voice data:
* Upon withdrawal request, the speaker's consent record is marked `WITHDRAWN`.
* All audio samples and metadata linked to that `speakerId` are cascadingly purged from dataset manifests and future training builds.
* The withdrawal procedure is validated in automated tests using synthetic test fixtures (`SYNTHETIC_TEST_DATA`).
