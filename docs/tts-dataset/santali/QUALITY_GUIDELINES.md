# Bhasha Setu — Speech Dataset Audio Quality Guidelines & Verification Standards

**Document Version:** 1.0.0  
**Status:** Deterministic Quality Gate Standard  
**Date:** September 2026  

---

## 1. Objective Audio Quality Thresholds

All incoming recordings must pass automated inspection by the `AudioValidator` engine before admission:

| Acoustic Metric | Target Standard | Warning Threshold | Rejection Threshold |
| :--- | :--- | :--- | :--- |
| **Duration** | $2.0\text{ s} - 10.0\text{ s}$ | $0.5\text{ s} - 2.0\text{ s}$ or $10.0\text{ s} - 20.0\text{ s}$ | $< 0.5\text{ s}$ or $> 20.0\text{ s}$ |
| **Peak Amplitude** | $-3.0\text{ dBFS} \pm 1.0\text{ dBFS}$ | $>-0.2\text{ dBFS}$ or $<-24.0\text{ dBFS}$ | $> 0.0\text{ dBFS}$ or $<-30.0\text{ dBFS}$ |
| **RMS Energy** | $-22.0\text{ dBFS} \pm 3.0\text{ dBFS}$ | $-28\text{ dBFS} \text{ to } -12\text{ dBFS}$ | $<-35.0\text{ dBFS}$ or $>-10.0\text{ dBFS}$ |
| **Digital Clipping** | $0.00\%$ | $> 0.01\% \text{ and } \le 0.05\%$ | $> 0.05\%$ clipped samples |
| **Noise Floor** | $\le -55.0\text{ dBFS}$ | $-55.0\text{ dBFS} \text{ to } -45.0\text{ dBFS}$ | $> -40.0\text{ dBFS}$ (Audible hum/hiss) |
| **Leading Silence** | $30\text{ ms} - 80\text{ ms}$ | $80\text{ ms} - 300\text{ ms}$ | $> 500\text{ ms}$ or $< 10\text{ ms}$ |
| **Trailing Silence**| $50\text{ ms} - 150\text{ ms}$ | $150\text{ ms} - 400\text{ ms}$ | $> 800\text{ ms}$ |
| **Channels** | 1 (Mono) | 2 (Stereo - requires downmix) | $> 2$ channels |
| **Sampling Rate** | $22,050\text{ Hz}$ or $24,000\text{ Hz}$ | $16,000\text{ Hz}$ or $44,100\text{ Hz}$ | Non-standard arbitrary rates |

---

## 2. Verdict Categorization & Remediation

Each recorded sample receives a deterministic categorization:

### 1. `PASS`
* Audio satisfies all target acoustic metrics.
* Transcript is verified (`VERIFIED`).
* Consent is active and verified.
* Sample is immediately eligible for training manifests.

### 2. `WARNING`
* Minor acoustic blemish (e.g. slight stereo recording, trailing silence slightly long, peak near -0.2 dBFS).
* Non-destructive preprocessing can remediate the issue (e.g. automated silence trimming, mono downmixing).
* Admitted to training only after automated remediation passes validation.

### 3. `REJECT`
* Severe digital clipping ($> 0.05\%$).
* Truncated utterance (speaker cut off mid-syllable).
* Intrusive acoustic interference (honking, barking, loud fan hum).
* Corrupted RIFF header or truncated data chunk.
* Revoked or missing consent record.
* Hard-blocked from training manifests.

---

## 3. Composite Internal Quality Score (IQS)

In compliance with **Rule 26**, Bhasha Setu establishes a deterministic internal quality metric calculated as:

$$\text{IQS} = 0.35 \cdot Q_{\text{audio}} + 0.25 \cdot Q_{\text{transcript}} + 0.20 \cdot Q_{\text{orthography}} + 0.20 \cdot Q_{\text{consent}}$$

Where:
* $Q_{\text{audio}}$: Acoustic score (derived from clipping ratio, SNR, and RMS bounds).
* $Q_{\text{transcript}}$: Verification status (`VERIFIED` = 1.0, `TRANSCRIBED` = 0.5, `UNREVIEWED` = 0.0).
* $Q_{\text{orthography}}$: Ol Chiki orthography score (zero malformed diacritics = 1.0).
* $Q_{\text{consent}}$: Consent completeness (active verified training permission = 1.0).

> [!CAUTION]
> **Strict Scientific Disclosure:**  
> This composite index is an **internal data engineering quality score**, NOT a "pronunciation accuracy score" or "native MOS rating". True pronunciation accuracy can only be scored through blinded native-speaker human listening evaluations.
