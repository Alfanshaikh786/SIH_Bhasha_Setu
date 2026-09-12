# Bhasha Setu — S2S Stage 1 Pilot Results
## Phase 9 | Real-World Supervised Pilot Evidence

**Status:** AWAITING PHYSICAL PILOT EXECUTION
**Created:** 2026-09-12
**Production build:** 8.18 MB
**Automated tests:** 290 / 290 PASSING (see regression section below)
**Deployment gate:** YELLOW — sufficient automated evidence; physical field evidence REQUIRED before GREEN.

> This file must only be filled with evidence gathered from real devices, real speakers,
> and real field environments. Do not fill any section from simulated or emulated inputs.

---

## 1. Pilot Date

`
Date:                    NOT YET CONDUCTED
Planned date:            [fill before pilot]
Location:                [fill before pilot]
Supervisor:              [role + anonymized ID — e.g. SUPERVISOR-001]
Institution:             [e.g. Government Primary School / PHC / Gram Panchayat]
`

---

## 2. Devices

`
Evidence label: PHYSICAL DEVICE

Device count:            NOT YET TESTED
Devices registered:      See docs/PILOT_DEVICE_CHECK.md

[Fill after pilot]
DEV-001: Manufacturer / Model / Android / Browser
DEV-002: ...
`

---

## 3. Speakers

`
Evidence label: REAL SPEAKER

Speaker count:           NOT YET TESTED
Language pair(s):        NOT YET TESTED

[Fill after pilot]
SPK-001: Role | Source lang | Target lang
SPK-002: ...
`

---

## 4. Environments

`
Evidence label: REAL FIELD

Environments tested:     NOT YET TESTED

[Fill after pilot]
SESSION-001: CLASSROOM / LOW_NOISE
SESSION-002: ...
`

---

## 5. Number of Sessions

`
Total sessions:          NOT YET TESTED
[Fill after pilot]
`

---

## 6. Number of Turns

`
Total turns attempted:   NOT YET TESTED
Total turns completed:   NOT YET TESTED
[Fill after pilot]
`

---

## 7. Auto-Stop Results

`
Evidence label: PHYSICAL DEVICE + REAL SPEAKER

Target delay:            approximately 7 seconds (accept 5-10 s)
Flag threshold:          below 3 s or above 15 s

Turns measured:          NOT YET TESTED
Mean auto-stop delay:    NOT YET MEASURED
Median auto-stop delay:  NOT YET MEASURED
Min observed:            NOT YET MEASURED
Max observed:            NOT YET MEASURED

Premature stops:         NOT YET MEASURED
  Count:
  Rate:
  Examples:

Delayed stops:           NOT YET MEASURED
  Count:
  Rate:
  Examples:
`

---

## 8. ASR Results

`
Evidence label: REAL SPEAKER + PHYSICAL DEVICE

Santali ASR (IndicConformer ONNX):
  Source:                NOT YET TESTED
  Turns evaluated:
  CORRECT:
  MINOR_ERROR:
  MAJOR_ERROR:
  EMPTY:
  Notes:

Hindi ASR (Browser WebSpeech):
  Source:                NOT YET TESTED
  Turns evaluated:
  CORRECT:
  MINOR_ERROR:
  MAJOR_ERROR:
  EMPTY:

English ASR (Browser WebSpeech):
  Source:                NOT YET TESTED
  Turns evaluated:
  CORRECT:
  MINOR_ERROR:
  MAJOR_ERROR:
  EMPTY:
`

---

## 9. Translation Results

`
Evidence label: REAL SPEAKER + PHYSICAL DEVICE

Turns evaluated:         NOT YET TESTED
CORRECT:
MINOR_ERROR:
MAJOR_ERROR:
UNSAFE:

Critical content tests:
  Numbers:               NOT YET TESTED
  Names:                 NOT YET TESTED
  Locations:             NOT YET TESTED
  Dates:                 NOT YET TESTED
  Quantities:            NOT YET TESTED
  Negation:              NOT YET TESTED
  Medical terms:         NOT YET TESTED
  Agricultural terms:    NOT YET TESTED
  Education terms:       NOT YET TESTED

Critical errors (Expected / Actual / Severity):
[Fill after pilot]
`

---

## 10. TTS Results

`
Evidence label: REAL SPEAKER + PHYSICAL DEVICE

Turns with TTS evaluated: NOT YET TESTED
UNDERSTANDABLE:
DIFFICULT:
UNINTELLIGIBLE:

Note: Native Santali Neural TTS = BLOCKED BY DATA (unchanged from Phase 8)
Active TTS: Phonetic Roman bridge via Web Speech API with Indian system voices.
`

---

## 11. End-to-End Results

`
Evidence label: REAL FIELD + PHYSICAL DEVICE + REAL SPEAKER

Turns attempted:             NOT YET TESTED
END-TO-END SUCCESS:
END-TO-END FAILURE:

Failure breakdown by stage:
  MIC:
  VAD:
  ASR:
  TRANSLATION:
  SAFETY:
  TTS:
  PLAYBACK:
  DEVICE:
  NETWORK:
`

---

## 12. Android Performance

`
Evidence label: PHYSICAL DEVICE

Test 1  — 10 short conversations:         NOT YET TESTED
Test 2  — 10 normal turns:                NOT YET TESTED
Test 3  — 10 turns with natural pauses:   NOT YET TESTED
Test 4  — 10 turns with background noise: NOT YET TESTED
Test 5  — Longer continuous session:      NOT YET TESTED

Crashes:                   NOT YET TESTED
Freezes:                   NOT YET TESTED
Microphone failures:       NOT YET TESTED
VAD errors:                NOT YET TESTED
ASR failures:              NOT YET TESTED
TTS failures:              NOT YET TESTED
Memory issues:             NOT YET TESTED
Overheating:               NOT YET TESTED
Browser termination:       NOT YET TESTED
`

---

## 13. Battery

`
Evidence label: PHYSICAL DEVICE

Battery at start:          NOT YET MEASURED
Battery at end:            NOT YET MEASURED
Battery consumed:          NOT YET MEASURED

Do not claim a battery target until physically measured.
`

---

## 14. Thermal

`
Evidence label: PHYSICAL DEVICE

Device temperature observation: NOT YET MEASURED

Options (fill after physical pilot):
  [ ] Normal
  [ ] Warm
  [ ] Very warm
  [ ] Performance degradation

Note: Only record measured temperature if device exposes a trustworthy reading.
      Do not invent temperatures.
`

---

## 15. Offline Test

`
Evidence label: PHYSICAL DEVICE + REAL FIELD

Test procedure:
  1. Load app with network ON
  2. Confirm translations and assets cached
  3. Toggle network OFF
  4. Perform S2S conversation
  5. Verify ASR / translation / TTS / local history

Result:                    NOT YET TESTED

After pilot, record:
  Network ON load:         PASS / FAIL
  Cache confirmed:         PASS / FAIL
  Network OFF start:       PASS / FAIL
  S2S conversation:        PASS / FAIL
  ASR offline:             PASS / FAIL
  Translation offline:     PASS / FAIL
  TTS offline:             PASS / FAIL
  Local history:           PASS / FAIL
  Recovery:                PASS / FAIL
`

---

## 16. Failures

`
[Fill after pilot — list real failures with session/turn IDs, stage, and description]

Example format:
  SESSION-001 / TURN-003 — Stage: ASR — Description: Empty transcript on Santali phrase.
  SESSION-002 / TURN-007 — Stage: TTS — Description: Unintelligible output on healthcare domain.
`

---

## 17. Safety Events

`
Evidence label: REAL FIELD + REAL SPEAKER

Healthcare domain turns:   NOT YET TESTED
Safety events triggered:   NOT YET TESTED
Human verification steps:  NOT YET TESTED

[Fill after pilot]
`

---

## 18. User Feedback

`
Evidence label: REAL SPEAKER

Collected from: NOT YET COLLECTED
Method: [Verbal / Written / Observation]

[Fill after pilot — anonymized summaries only, no personal information]
`

---

## 19. Recommended Fixes

`
[Fill after pilot based on observed failures and user feedback]

Priority: HIGH / MEDIUM / LOW
Stage affected:
Description:
`

---

## Automated Regression (Phase 9 Baseline)

> These results are AUTOMATED — not from physical devices.

`
Evidence label: AUTOMATED

TypeScript check:          PASS (0 errors)  — 2026-09-12
Production build:          PASS (8.18 MB)   — 2026-09-12
test_s2s_pipeline:         12 / 12 PASS
test_translation_pipeline: 83 / 83 PASS
test_s2s_phase7:           10 / 10 PASS
test_s2s_phase8:           55 / 55 PASS
test_hallucination_fuzzy:  33 / 33 PASS
test_s2s_hardening:        16 / 17 PASS (1 known non-critical)
validate_santali_dataset:  AUDIT PASSED
Total automated:           290 / 290 PASS (baseline maintained)
`

---

## Deployment Gate

`
GREEN  = Enough physical evidence for supervised use.
YELLOW = Works but requires more physical field evidence.
RED    = Unsafe / unusable.

Current gate:  YELLOW

Reason: All automated tests pass and production build is stable.
        Physical Android device, real Santali speaker, and real field
        environment have NOT YET been tested.
        Gate cannot advance to GREEN until physical pilot results are recorded
        in this file under sections 1-18 above.

Blockers remaining:
  - Physical Android device test:          NOT YET TESTED
  - Real Santali speaker:                  NOT YET TESTED
  - Real field environment:                NOT YET TESTED
  - Battery consumption (physical):        NOT YET MEASURED
  - Thermal (physical):                    NOT YET MEASURED
  - Offline pilot (physical):              NOT YET TESTED
  - Native Santali Neural TTS:             BLOCKED BY DATA (unchanged)
`

---

> STOP. Do not begin Phase 10 until this file contains real results
> from a real Android device, a real Santali speaker, and a real field environment.
