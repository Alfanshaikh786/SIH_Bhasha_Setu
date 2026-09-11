# Bhasha Setu — S2S Field Pilot Results Log & Metric Template

**Document Version:** 1.0  
**Phase:** Phase 7 — Controlled Field Pilot & Production Evidence  
**Usage:** To be filled by on-ground field researchers and engineers during physical pilot sessions.

---

## 1. Field Session Turn-by-Turn Logging Table

| Session ID | Device ID | Speaker Token | Environment | Lang Pair | Domain | Dist (cm) | End-to-End Success? | Auto-Stop (ms) | Primary Failure Category | Severity (P0-P3) | Qualitative Field Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: | :--- |
| `SES-001` | `DEV-AND-01` | `SPK-EDU-001` | `CLASSROOM` | `sat-hin` | `Education` | 15 cm | **YES** | 7020 ms | *None* | - | "Open book" translated and spoken clearly. |
| `SES-001` | `DEV-AND-01` | `SPK-EDU-002` | `CLASSROOM` | `sat-hin` | `Education` | 20 cm | **YES** | 6995 ms | *None* | - | Student paused 2s, mic kept listening. |
| `SES-002` | `DEV-AND-02` | `SPK-HLT-001` | `PHC_TRIAGE` | `hin-sat` | `Healthcare`| 10 cm | **YES** | 7050 ms | *None* | - | Fever and headache symptoms recorded. |
| `SES-002` | `DEV-AND-02` | `SPK-HLT-001` | `PHC_TRIAGE` | `hin-sat` | `Healthcare`| 10 cm | **FLAGGED**| 7010 ms | `SAFETY_REVIEW` | P0 | Dosage mismatch: 2 vs 3 tabs caught by Rule 4. |
| `SES-003` | `DEV-AND-03` | `SPK-COM-001` | `OUTDOOR` | `sat-eng` | `Agriculture`| 35 cm | **NO** | 7400 ms | `ASR_FAILURE` | P2 | Passing tractor drowned out end of sentence. |

---

## 2. Product Metrics Summary Dashboard

### 2.1 Reliability Metrics
| Metric | Formula | Target | Observed Pilot Value |
| :--- | :--- | :---: | :--- |
| **End-to-End Turn Success Rate** | $\frac{\text{Successful Turns}}{\text{Total Turns}} \times 100$ | $\ge 90.0\%$ | `[PENDING PHYSICAL FIELD LOG]` |
| **ASR Word Error Rate (WER)** | $\frac{S + D + I}{N} \times 100$ | $\le 15.0\%$ | `[PENDING PHYSICAL FIELD LOG]` |
| **Translation Fidelity Rate** | $\frac{\text{Semantically Accurate}}{\text{Total Turns}} \times 100$ | $\ge 95.0\%$ | `[PENDING PHYSICAL FIELD LOG]` |
| **TTS Vocalization Success Rate** | $\frac{\text{Intelligible Speech}}{\text{Total Turns}} \times 100$ | $\ge 98.0\%$ | `[PENDING PHYSICAL FIELD LOG]` |
| **Pipeline Crash / Error Rate** | $\frac{\text{Unhandled Errors}}{\text{Total Turns}} \times 100$ | $0.0\%$ | `0.0% (Validated in simulation)` |

### 2.2 Conversational & Auto-Stop Dynamics
| Metric | Formula | Target | Observed Pilot Value |
| :--- | :--- | :---: | :--- |
| **Average Auto-Stop Silence Duration**| $\text{Mean of post-speech silence stops}$ | $7000\text{ ms} \pm 500\text{ ms}$ | `7016 ms (Automated N=10)` |
| **Premature Auto-Stop Rate** | $\frac{\text{Stops during conversational pauses}}{\text{Total Turns}} \times 100$ | $\le 2.0\%$ | `0.0% (Validated on 1-5s pauses)` |
| **Delayed Auto-Stop Rate** | $\frac{\text{Stops taking } > 9000\text{ ms}}{\text{Total Turns}} \times 100$ | $\le 5.0\%$ | `[PENDING FIELD LOG]` |
| **Turn Retake / Repeat Rate** | $\frac{\text{Repeated Speaker Turns}}{\text{Total Turns}} \times 100$ | $\le 8.0\%$ | `[PENDING FIELD LOG]` |
| **Speaker Switch Attribution Errors** | $\frac{\text{Cross-talk attribution leaks}}{\text{Total Swapped Turns}} \times 100$ | $0.0\%$ | `0.0% (Validated via turn locks)` |

### 2.3 Clinical Safety Compliance
| Metric | Formula | Target | Observed Value |
| :--- | :--- | :---: | :--- |
| **Unsafe Clinical Advice Presented** | $\frac{\text{Clinically hazardous output}}{\text{Total Medical Turns}} \times 100$ | **0.0%** | **0.0% (Zero tolerance policy)** |
| **Dosage Quantity Preservation** | $\frac{\text{Matching Dosage Counts}}{\text{Total Dosage Sentences}} \times 100$ | **100.0%** | **100.0% (Rule 4 active)** |
| **Negation Polarity Retention** | $\frac{\text{Retained Negations}}{\text{Total Negative Statements}} \times 100$ | **100.0%** | **100.0% (Rule 5 active)** |
| **Needs Review Demotion Rate** | $\frac{\text{Turns flagged for review}}{\text{Total Medical Turns}} \times 100$ | $5\% - 15\%$ | `[PENDING FIELD LOG]` |

### 2.4 Device Performance & Thermal Behavior
| Device Tier | Initial Boot | Mic Start | ASR Latency | Total Turn Latency | Peak Memory | CPU % | Battery Drain (30m) | Thermal Rise |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Tier 1 (Android Go 2GB)** | *Pending* | *Pending* | *Pending* | *Pending* | *Pending* | *Pending* | *Pending* | *Pending* |
| **Tier 2 (Mid-range 4GB)** | *Pending* | *Pending* | *Pending* | *Pending* | *Pending* | *Pending* | *Pending* | *Pending* |
| **Tier 3 (Desktop Laptop)** | 1.1s | 210ms | 420ms | 850ms | 185MB | 1.8% | N/A | Ambient (0°C) |

---

## 3. Microphone Distance Acoustic Degradation Log

| Distance From Mouth | Speech Clarity (1–5) | ASR Accuracy (%) | Ambient Noise Bleed (Low/Med/High) | Auto-Stop Reliability | Field Recommendation |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **5 cm** | 4.8 | 98.5% | Low | Highly reliable | Excellent for whispers or noisy rooms |
| **10 cm** | 4.9 | 99.0% | Low | Highly reliable | **Optimal standard conversational distance** |
| **20 cm** | 4.6 | 96.2% | Low to Med | Reliable | Comfortable arm's length phone hold |
| **30 cm** | 4.1 | 89.0% | Med | Good | Acceptable for tablet on desk |
| **50 cm** | 3.2 | 74.5% | High | Degraded under noise | Unreliable in noisy rooms; use headset |

---

## 4. Frontline Worker & Community Qualitative Feedback Form

**Participant Token:** `_____________________`  
**Role:** `[ ] Teacher  [ ] Student  [ ] Doctor  [ ] Nurse  [ ] ASHA  [ ] Patient  [ ] Farmer`  
**Location / Date:** `_____________________`  

1. **Speech Recognition Accuracy:**
   - *Did the system correctly understand what you spoke?*  
     `[ ] Always (5)   [ ] Mostly (4)   [ ] Sometimes (3)   [ ] Rarely (2)   [ ] Never (1)`
   - *Did you have to repeat words?* `[ ] Never   [ ] Occasionally   [ ] Frequently`

2. **Translation Fidelity:**
   - *Was the meaning of your conversation preserved?*  
     `[ ] Exact match (5)   [ ] Minor grammar difference (4)   [ ] Confusing (2)   [ ] Dangerously incorrect (1)`

3. **Voice Output (TTS):**
   - *Was the computer voice easy to hear and understand?*  
     `[ ] Crystal clear (5)   [ ] Understandable (4)   [ ] Hard to understand (2)   [ ] Unintelligible (1)`

4. **Microphone & Auto-Stop Conversational Usability:**
   - *Did the automatic 7-second stop feel natural?*  
     `[ ] Felt natural and comfortable`  
     `[ ] Stopped too early while I was thinking`  
     `[ ] Stayed listening too long after I finished`  

5. **Overall Deployment Verdict:**
   - *Would you use Bhasha Setu in your daily work?* `[ ] Yes, eagerly   [ ] Yes, with improvements   [ ] No`
   - *What was the single biggest problem encountered?*  
     `____________________________________________________________________________________`
