# Bhasha Setu — S2S Field Issue Log

**Document Version:** 1.0  
**Phase:** Phase 6 — Field Deployment Pilot & Acoustic Hardening  
**Status:** ACTIVE FIELD TRACKER  

### Severity Classification:
- **P0:** Safety hazard / data corruption / unrecoverable deadlock / unusable system.
- **P1:** Major functional failure (e.g. ASR completely drops out, mic never stops).
- **P2:** Significant performance degradation (e.g. high latency, poor audio in moderate noise).
- **P3:** Minor issue / UI cosmetic polish / non-blocking friction.

---

## 1. Resolved & Hardened Field Issues

### [P0] ISSUE-S2S-001: Clinical Dosage Number Mismatch in Healthcare Triage
- **Issue ID:** `ISSUE-S2S-001`
- **Environment:** Busy Healthcare PHC (Environment C)
- **Device:** Desktop & Mobile Browser
- **Language:** Hindi $\to$ Santali / English
- **Severity:** `P0` (Safety Hazard)
- **Observed Behavior:** In noisy clinical conversation, a prescription sentence such as *"Take 2 tablets after dinner"* was in risk of entity alteration (e.g. *"Take 3 tablets"* or dropping numerical quantity).
- **Expected Behavior:** Any numerical discrepancy between source utterance and target translation must immediately abort confident display and trigger human clinical review.
- **Reproduction Steps:**
  1. Speak medical phrase with dosage count: "Give 2 tablets".
  2. Simulate ASR/MT entity divergence where target produces "3 tablets" or alters numbers.
- **Root Cause:** Standard statistical/dataset retrieval engines treat numbers as generic lexical tokens rather than critical clinical quantities.
- **Fix:** Implemented Rule 4 in `DomainSafetyEngine.ts` to extract all integer entities from source and target; if digits do not match identically, the utterance is forcibly demoted to `needs_review`.
- **Validation:** Verified via automated regression test `Detected dangerous dosage number mismatch ("2 tablets" vs "3 tablets")` in `scripts/test_s2s_phase5_validation.cjs`.

---

### [P0] ISSUE-S2S-002: Negation Polarity Inversion in Emergency Instructions
- **Issue ID:** `ISSUE-S2S-002`
- **Environment:** Busy Healthcare PHC (Environment C)
- **Device:** Desktop & Mobile Browser
- **Language:** Santali $\leftrightarrow$ Hindi $\leftrightarrow$ English
- **Severity:** `P0` (Safety Hazard)
- **Observed Behavior:** Source instructions containing negative polarity (e.g. *"Do not stop taking the medicine"* or *"ᱵᱟᱝ ᱵᱟᱹᱜᱤ ᱢᱮ"*) risk dropping the negation particle in rapid speech, producing an affirmative instruction (*"Stop taking the medicine"*).
- **Expected Behavior:** Negative polarity in medical instructions must be strictly preserved; missing negative particle must be treated as `CLINICALLY_UNSAFE`.
- **Reproduction Steps:**
  1. Input: "Do not stop the medication".
  2. Translation produced without negative word: "দয়া করে ওষুধ বন্ধ করুন" / "दवा बंद करें".
- **Root Cause:** ASR deletion or MT omission of short negative particles (`not`, `nahi`, `baŋ`, `baɲ`).
- **Fix:** Implemented Rule 5 in `DomainSafetyEngine.ts` to detect negative polarity in source; if target lacks corresponding negation markers, the turn is immediately flagged as `needs_review`.
- **Validation:** Verified in `scripts/test_s2s_phase5_validation.cjs` Test 5.

---

### [P1] ISSUE-S2S-003: Continuous Ambient Fan Noise Inhibiting 7-Second Silence Auto-Stop
- **Issue ID:** `ISSUE-S2S-003`
- **Environment:** Rural Classroom with Ceiling Fan (Environment A) / Moderate Noise (AC-02)
- **Device:** Laptop & Android Chrome
- **Language:** Santali / Hindi
- **Severity:** `P1` (Major Functional Failure)
- **Observed Behavior:** When a speaker finished speaking under a loud ceiling fan (RMS ambient energy $\approx 0.014$), the microphone remained active indefinitely and never auto-stopped because the static VAD threshold was hardcoded at $0.012$.
- **Expected Behavior:** Once the speaker stops vocalizing, the system must detect that voice energy has ceased, even if steady ambient fan noise continues, and cleanly auto-stop after $\approx 7000\text{ ms}$.
- **Reproduction Steps:**
  1. Position microphone 1 meter from active ceiling fan (noise floor $0.014$).
  2. Speak: "Open page 12".
  3. Stop vocalizing.
  4. Observe whether microphone stops after 7 seconds.
- **Root Cause:** Fixed VAD energy threshold failed to account for elevated ambient room noise floors.
- **Fix:** Upgraded `S2SAudioPipeline.ts` with adaptive baseline noise floor tracking (`baselineNoiseRms`) and dynamic effective thresholding:
  $$\text{effectiveThreshold} = \max(0.012, \text{baselineNoiseRms} \times 2.0)$$
- **Validation:** Verified in `scripts/test_s2s_phase6_field_hardening.cjs` (VAD recognizes speech cessation under steady $0.014$ noise floor and triggers auto-stop).

---

### [P1] ISSUE-S2S-004: Rapid Alternating Turn-Taking Attribution Race Condition
- **Issue ID:** `ISSUE-S2S-004`
- **Environment:** Two-Speaker Field Conversation (Speaker A & B)
- **Device:** All platforms
- **Language:** All supported languages
- **Severity:** `P1` (Functional Integrity)
- **Observed Behavior:** Rapid alternating clicks between Speaker A and Speaker B could result in Speaker A's delayed ASR packet rendering on Speaker B's conversation card.
- **Expected Behavior:** Every turn must be strictly scoped to its unique `turnId`. In-flight packets from prior turns must be immediately rejected.
- **Reproduction Steps:**
  1. Click Speaker A, speak short phrase.
  2. Immediately click Speaker B before Speaker A network packet completes.
- **Root Cause:** Shared mutable state and lack of turn validation in asynchronous callback dispatch.
- **Fix:** Hardened `S2STurnController.ts` and `asrAdapter.ts` with strict `activeTurnId` guards and turn-locking mutexes.
- **Validation:** Verified in `scripts/test_s2s_phase5_validation.cjs` Test 9 (Zero cross-speaker attribution leakage).

---

### [P2] ISSUE-S2S-005: Android WebRTC Complex Constraint Failure on Older WebViews
- **Issue ID:** `ISSUE-S2S-005`
- **Environment:** Low-end Android Hardware (Tier 1)
- **Device:** Android Go / Older Chromium WebViews
- **Language:** System wide
- **Severity:** `P2` (Significant Degradation)
- **Observed Behavior:** Passing strict `{ sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true }` in `getUserMedia` caused `OverconstrainedError` on certain older Android web runtimes, completely blocking microphone access.
- **Expected Behavior:** If specialized audio constraints fail, the system must transparently fall back to standard `{ audio: true }` without crashing or throwing unhandled exceptions.
- **Reproduction Steps:**
  1. Emulate legacy Android browser with strict constraint rejection.
  2. Attempt microphone initialization.
- **Root Cause:** Hardware audio HAL on entry-level Android devices strictly enforces device-native sample rates (44.1 kHz / 48 kHz).
- **Fix:** Added nested `try...catch` fallback in `S2SAudioPipeline.start()` that gracefully downgrades constraints to `{ audio: true }` and lets the Web Audio `AudioContext` handle internal software resampling to 16 kHz.
- **Validation:** Verified in `scripts/test_s2s_phase6_field_hardening.cjs`.

---

### [P2] ISSUE-S2S-006: Bluetooth SCO Profile Audio Buffering Latency
- **Issue ID:** `ISSUE-S2S-006`
- **Environment:** Outdoor Community Field (Environment B)
- **Device:** Mobile Android with Bluetooth Single-Ear Headset
- **Language:** Santali
- **Severity:** `P2` (Performance Friction)
- **Observed Behavior:** When connected to low-cost Bluetooth headsets using the SCO (Synchronous Connection-Oriented) 8 kHz profile, microphone startup was delayed by $400 - 800\text{ ms}$, causing the first syllable of rapid speech to be truncated.
- **Expected Behavior:** Audio pipeline must maintain an initial safety buffer so the first phoneme is not lost during Bluetooth audio gateway handshake.
- **Reproduction Steps:**
  1. Connect mono Bluetooth headset.
  2. Immediately speak upon tapping mic button.
- **Root Cause:** Bluetooth RFCOMM and SCO link negotiation latency.
- **Fix:** Configured audio capture buffer ring with initial 300ms pre-roll retention.
- **Validation:** Documented in field protocol; verified in software harness.

---

### [P3] ISSUE-S2S-007: Lack of Visual Silence Countdown Indicator During Long Pauses
- **Issue ID:** `ISSUE-S2S-007`
- **Environment:** Classroom & Field Interaction
- **Device:** Mobile & Tablet
- **Language:** All
- **Severity:** `P3` (User Experience)
- **Observed Behavior:** During natural $3 - 5\text{s}$ conversational hesitations, users occasionally wonder whether the microphone has stopped or is still listening.
- **Expected Behavior:** System should give subtle visual feedback that the 7-second countdown is active.
- **Status:** Deferred to post-Phase 6 due to the absolute non-negotiable rule: **Zero UI Changes**.
- **Action Plan:** Add subtle progress ring indicator when design freeze is lifted in future UI phase.
