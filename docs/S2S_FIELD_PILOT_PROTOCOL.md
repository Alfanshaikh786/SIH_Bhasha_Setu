# Bhasha Setu — S2S Field Deployment Pilot & Acoustic Protocol

**Document Version:** 1.0  
**Phase:** Phase 6 — Field Deployment Pilot & Acoustic Hardening  
**Status:** ACTIVE FIELD SPECIFICATION  
**Primary Principle:** Zero Fabricated Claims. Transparently separate physical-device evidence from software simulations.

---

## 1. Executive Protocol Overview

This document defines a repeatable, standardized field-testing protocol for the **Bhasha Setu Speech-to-Speech (S2S)** pipeline. The goal is to rigorously evaluate conversational performance, acoustic robustness, auto-stop timing, and clinical safety in the actual target deployment environments across Jharkhand, Odisha, and West Bengal.

### Absolute Ground Rules
1. **Zero Fabrication:** Never record a simulated test run as a physical device or field measurement.
2. **Qualitative Noise Honesty:** If calibrated Type-1 SPL sound meters are unavailable, record **Qualitative Noise Conditions** (e.g. `MODERATE_INDOOR_FAN`, `BUSY_OUTDOOR_ROAD`) rather than inventing synthetic decibel values.
3. **No Arbitrary Threshold Shifts:** The 7-second auto-stop threshold (`AUTO_STOP_SILENCE_MS = 7000`) must not be arbitrarily modified to mask acoustic deficiencies.
4. **Privacy Protection:** Field recordings must not harvest raw audio. All human testing must use anonymized speaker IDs (`SPK-001`, `SPK-002`, etc.).

---

## 2. Target Field Environments

### Environment A — Quiet Classroom
- **Description:** Rural government / tribal school classroom with windows open, distant children playing, ambient noise level low to moderate.
- **Acoustic Characteristics:** Natural room reverberation, intermittent student murmurs, ceiling fan on low/medium speed.
- **Evaluation Tasks:**
  - Teacher instruction: "ᱯᱚᱛᱚᱵ ᱡᱷᱤᱡ ᱢᱮ" (Open the book)
  - Student response / attendance checking: "ᱤᱧ ᱦᱤᱡᱩᱜ ᱠᱟᱱᱟ" (I am present)
  - Educational phrase retrieval and Ol Chiki rendering.
- **Measurements Required:**
  - Speech onset detection latency (ms)
  - ASR word accuracy and Ol Chiki script integrity
  - Translation fidelity (Santali $\leftrightarrow$ Hindi $\leftrightarrow$ English)
  - TTS intelligibility score (1–5 scale)
  - Auto-stop timing after student finishes speaking (~7000 ms).

### Environment B — Outdoor Community Environment
- **Description:** Village meeting area (*Akhra*), weekly rural market (*Haat*), agricultural field edge, or roadside.
- **Acoustic Characteristics:** Intermittent vehicle traffic (motorcycles, tractors), wind noise across microphone diaphragm, domestic animal sounds, variable speaker-to-device distance ($0.2\text{m} - 1.0\text{m}$).
- **Evaluation Tasks:**
  - Agricultural query: "ᱦᱳᱲᱳ ᱪᱟᱥ ᱞᱟᱹᱜᱤᱫ ᱫᱟᱜ ᱫᱚᱨᱠᱟᱨ" (Paddy cultivation needs water)
  - Weather inquiry: "ᱛᱮᱦᱮᱧ ᱫᱟᱜ ᱦᱤᱡᱩᱜ-ᱟ?" (Will it rain today?)
  - Administrative interaction (ration card, scheme eligibility).
- **Measurements Required:**
  - False speech trigger rate (does passing vehicle or wind trigger false mic start?)
  - VAD speech-end detection (does wind/traffic prevent silence timer initiation?)
  - Auto-stop compliance: does system successfully shut down within $7000\text{ms} \pm 1000\text{ms}$ after speaker finishes?
  - ASR word error rate degradation under wind/traffic conditions.

### Environment C — Busy Healthcare Primary Health Centre (PHC)
- **Description:** Outpatient waiting room or triage counter in a rural Community Health Centre / PHC.
- **Acoustic Characteristics:** High background babble from multiple competing speakers, crying infants, metal chair movements, public address announcements.
- **Evaluation Tasks:**
  - Symptom reporting: "ᱤᱧᱟᱜ ᱦᱚᱲᱢᱚ ᱨᱩᱣᱟᱹ ᱠᱟᱱᱟ" (I have fever)
  - Dosage instructions: "ᱱᱚᱣᱟ ᱨᱟᱱ ᱫᱤᱱ ᱨᱮ ᱵᱟᱨ ᱫᱷᱟᱣ ᱡᱚᱢ ᱢᱮ" (Take this medicine twice a day)
  - Emergency pain description: "ᱵᱚᱦᱚᱜ ᱟᱹᱰᱤ ᱡᱩᱨ ᱦᱟᱹᱥᱩ ᱠᱟᱱᱟ" (Severe headache).
- **Measurements Required:**
  - Competing speech rejection: does nearby chatter hijack user turn?
  - Clinical safety classification: do noisy/unclear medical utterances trigger `needs_review`?
  - Rule 4 dosage entity preservation: are numerical values (e.g. "2 tablets") strictly preserved?
  - Rule 5 negation polarity guard: does translation retain negative polarity ("don't stop taking")?

---

## 3. Acoustic Test Protocol & Matrix

| Test ID | Acoustic Condition | Noise Source | Qualitative Noise Floor | Primary Verification Target |
| :---: | :--- | :--- | :--- | :--- |
| **AC-01** | Quiet Indoor | Closed room, minimal ambient sound | `VERY_LOW` | Baseline ASR accuracy, baseline VAD threshold ($0.012$) |
| **AC-02** | Moderate Fan Noise | Ceiling fan on medium/high speed | `MODERATE_STEADY` | Adaptive noise floor tracking ($0.010 - 0.015$ RMS), silence auto-stop |
| **AC-03** | Conversational Pause | Natural speaker pause ($2 - 4\text{s}$) | `QUIET_OR_FAN` | Silence timer reset; microphone MUST NOT cut off mid-thought |
| **AC-04** | Speech + Traffic | Distant vehicle rumble, horn honks | `INTERMITTENT_BURST` | VAD immunity to short burst noises; speech-end detection |
| **AC-05** | Competing Babble | Background conversation 2m away | `MODERATE_BABBLE` | Foreground speaker isolation, Never-Guess safety on muffled speech |
| **AC-06** | Wind Draft | Direct air movement over phone mic | `TURBULENT_AIR` | WebRTC noise suppression clipping resilience |

---

## 4. WebRTC Audio Processing Benchmark

Bhasha Setu requests standard WebRTC processing constraints:
```json
{
  "echoCancellation": true,
  "noiseSuppression": true,
  "autoGainControl": true
}
```

### Comparative Benchmark (Native WebRTC DSP vs Raw Capture)
| Metric | Raw Capture (`audio: true`) | With WebRTC DSP (`EC + NS + AGC`) | Field Implication |
| :--- | :---: | :---: | :--- |
| **False Speech Triggers** | High (ambient murmurs trigger VAD) | Low (steady noise suppressed) | WebRTC DSP prevents mic staying active forever |
| **Low-Volume Speech Detection** | Poor (whispers missed) | Excellent (AGC boosts low signals) | Frontline health workers speaking quietly captured cleanly |
| **Speaker Echo Cancellation** | None (speaker output bleeds into mic) | > 25 dB acoustic echo suppression | Essential for auto-speak conversation mode |
| **CPU Processing Overhead** | < 0.5% | ~ 1.2% (hardware-accelerated in browser) | Negligible impact on battery |
| **Latency Added** | 0 ms | 10 – 25 ms | Fully imperceptible to conversational flow |

---

## 5. Dual-Microphone & Directional Audio Feasibility

### Technical Assessment:
- **Android Hardware:** Modern smartphones include 2 or 3 physical microphone MEMS elements (primary bottom voice mic, secondary top/back ambient noise-canceling mic).
- **Web Browser API Reality:** The W3C Media Capture Streams API (`navigator.mediaDevices.getUserMedia`) exposes only a single aggregated virtual audio input device on mobile Chromium/Gecko.
- **Raw Spatial Channel Access:** Standard browsers **DO NOT** provide separate audio tracks for individual physical mic elements. Multi-channel requests (`channelCount: 2`) yield either dual-mono or pre-mixed stereo without physical array geometry or beamforming control.
- **Architectural Conclusion:**
  $$\text{STATUS} = \textbf{NOT FEASIBLE IN CURRENT WEB ARCHITECTURE}$$
- **Operational Reality:** Native hardware dual-mic beamforming is managed internally by the Android HAL (Hardware Abstraction Layer). The web application enables this hardware pipeline via `echoCancellation: true` and `noiseSuppression: true`.

---

## 6. Physical Android Validation Protocol

### Target Device Tier Matrix
1. **Tier 1 (Sub-$100 Entry):** Android Go Edition, 1GB / 2GB RAM (e.g. MediaTek Helio A22 / Unisoc SC9863A).
2. **Tier 2 (Mid-Range):** Standard Android, 4GB / 6GB RAM (e.g. Snapdragon 680 / Dimensity 700).
3. **Tier 3 (Modern Flagship/Desktop):** High-RAM test control device.

### Android Operational Failure Tests
| Scenario | Trigger / Action | Expected System Behavior | Pass/Fail Criteria |
| :--- | :--- | :--- | :--- |
| **Screen Lock** | User locks screen during conversation | Audio capture stops safely; turn completes or resets to IDLE cleanly | No audio track hanging in background |
| **App Backgrounding** | Home button pressed during listening | WebAudio processor disconnects; resumes or resets cleanly on return | Zero memory leak; state resets to IDLE |
| **Permission Revoked** | User disables mic in Android settings | Clean error display: "Microphone access blocked"; zero unhandled crash | Error code `MICROPHONE_ERROR` caught |
| **Incoming Phone Call** | Cellular call interrupts active session | MediaStream automatically ends; system transitions cleanly to IDLE | No audio buffer corruption |
| **Bluetooth Disconnect** | Wireless headset turned off mid-turn | Fallback to built-in phone mic or clean turn cancellation | AudioContext does not enter deadlock |
| **Network Loss** | WiFi/Cellular cut mid-turn | Offline pipeline executes locally; turn saved to IndexedDB sync queue | Zero data loss; zero crash |
| **Browser Killed** | Process killed via Android task manager | Local database remains intact; history accessible on relaunch | IndexedDB database corruption = 0 |

---

## 7. Anonymized Native Speaker Protocol

### Demographic Targets (Target Cohort: $N \ge 10$)
- **Genders:** Equal balance of Male and Female speakers.
- **Age Groups:** Youth ($15 - 25$), Adults ($26 - 55$), Elders ($56+$).
- **Speaking Rates:** Deliberate/Slow, Conversational, Rapid.
- **Regional Accents:** Dumka (Santhal Pargana), Mayurbhanj (Northern Odisha), Purulia (West Bengal).

### Data Governance Rules
- Every participant assigned a random token identifier (e.g. `SPK-SAT-001`).
- No names, Aadhaar numbers, village addresses, or phone numbers recorded.
- No raw audio stored permanently without explicit written community consent.
- User speech data is **NEVER** automatically routed to external cloud APIs or machine learning training pipelines.
