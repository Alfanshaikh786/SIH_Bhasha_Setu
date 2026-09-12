# Bhasha Setu — S2S Field Session Form
## Phase 9 | Per-Session & Per-Turn Capture Template

**Version:** Phase 9
**Evidence Standard:** REAL FIELD. Do not fill retrospectively from memory.
**Instruction:** Fill one SESSION HEADER per session. Fill one TURN RECORD per spoken turn.

---

## SESSION HEADER

`
Session ID:              [e.g. SESSION-001]
Date:                    [YYYY-MM-DD]
Time start:              [HH:MM]
Time end:                [HH:MM]
Device ID:               [e.g. DEV-001]
Operator:                [e.g. OPR-001  — anonymized]
Location description:    [e.g. government primary school, classroom, Jharkhand]
`

---

## 1. Environment Classification

Select all that apply:

`
[ ] QUIET
[ ] CLASSROOM
[ ] OUTDOOR
[ ] CROWDED
[ ] HEALTHCARE
[ ] OTHER: ________________

Noise classification:
  [ ] QUIET
  [ ] LOW_NOISE
  [ ] MODERATE_NOISE
  [ ] HIGH_NOISE
  [ ] MULTIPLE_SPEAKERS
  [ ] TRAFFIC
  [ ] FAN
  [ ] CLASSROOM
  [ ] WAITING_ROOM
  [ ] OUTDOOR

Sound meter reading (if available): _______ dBA
If sound meter not available: leave blank — do not estimate.
`

---

## 2. Device

`
Device ID:                [from PILOT_DEVICE_CHECK.md]
Browser name + version:   [e.g. Chrome 126]
Microphone type:          [ ] Built-in  [ ] Wired headset  [ ] External USB
Network during session:   [ ] Wi-Fi  [ ] Hotspot  [ ] OFFLINE
`

---

## 3. Speakers

`
Speaker A ID:    [e.g. SPK-001]
Speaker A role:  [ ] Teacher  [ ] ASHA  [ ] Gram Sevak  [ ] Administrator  [ ] Other
Speaker A lang:  [ ] Hindi  [ ] English  [ ] Other: _______

Speaker B ID:    [e.g. SPK-002]
Speaker B role:  [ ] Student  [ ] Patient  [ ] Farmer  [ ] Citizen  [ ] Other
Speaker B lang:  [ ] Santali (Ol Chiki)  [ ] Santali (Roman)  [ ] Other: _______
`

---

## 4. Domain

Select one primary domain for this session:

`
[ ] Education
[ ] Healthcare
[ ] Agriculture
[ ] Daily conversation
[ ] Administration
[ ] Mixed: ____________________
`

---

## 5. Auto-Stop Measurement

> Record timestamps from the clock on the device or a stopwatch.
> Do NOT estimate from memory after the session.

`
Turn ID:                   [e.g. TURN-001]
Speech ended timestamp:    [HH:MM:SS]
Mic stop timestamp:        [HH:MM:SS]
Observed auto-stop delay:  [seconds]   (= MicStop - SpeechEnd)

Premature stop?            [ ] YES  [ ] NO
  If YES — describe:       ________________________________________________

Delayed stop?              [ ] YES  [ ] NO
  If YES — describe:       ________________________________________________
`

> Target: approximately 7 seconds. Accept 5–10 seconds as reasonable.
> Flag anything below 3 seconds or above 15 seconds.

---

## 6. Per-Turn Result Record

Fill one block per spoken turn. Copy and duplicate as needed.

`
--- TURN: TURN-001 ---
Session ID:              SESSION-___
Speaker ID:              SPK-___
Source language:         [ ] Santali  [ ] Hindi  [ ] English
Domain:                  [ ] Education  [ ] Healthcare  [ ] Agriculture  [ ] Daily  [ ] Admin

Pipeline result:
  MIC:          [ ] SUCCESS  [ ] FAILURE
  VAD:          [ ] SUCCESS  [ ] FAILURE
  ASR:          [ ] SUCCESS  [ ] FAILURE
  TRANSLATION:  [ ] SUCCESS  [ ] FAILURE
  SAFETY:       [ ] SUCCESS  [ ] FAILURE
  TTS:          [ ] SUCCESS  [ ] FAILURE
  PLAYBACK:     [ ] SUCCESS  [ ] FAILURE
  END-TO-END:   [ ] SUCCESS  [ ] FAILURE

If any FAILURE — identify stage:
  [ ] MIC  [ ] VAD  [ ] ASR  [ ] TRANSLATION  [ ] SAFETY
  [ ] TTS  [ ] PLAYBACK  [ ] DEVICE  [ ] NETWORK
  Description: ____________________________________________

Santali ASR quality (if source=Santali):
  [ ] CORRECT  [ ] MINOR_ERROR  [ ] MAJOR_ERROR  [ ] EMPTY

Translation quality:
  [ ] CORRECT  [ ] MINOR_ERROR  [ ] MAJOR_ERROR  [ ] UNSAFE

TTS quality:
  [ ] UNDERSTANDABLE  [ ] DIFFICULT  [ ] UNINTELLIGIBLE

Auto-stop delay (seconds):   _______
Premature stop:              [ ] YES  [ ] NO
Delayed stop:                [ ] YES  [ ] NO

Critical content test:
  Content type tested:
    [ ] Numbers  [ ] Names  [ ] Locations  [ ] Dates  [ ] Quantities
    [ ] Negation  [ ] Medical terms  [ ] Agricultural terms  [ ] Education terms
  Expected:   _______________________________________________
  Actual:     _______________________________________________
  Severity (if error):  [ ] LOW  [ ] MEDIUM  [ ] HIGH  [ ] CRITICAL

Observer notes:
`

---

## 7. Android Interruption Record

For each interruption event during the session:

`
Turn ID at interruption:    TURN-___
Interruption type:
  [ ] Screen lock
  [ ] App backgrounded
  [ ] Incoming call
  [ ] Browser restarted
  [ ] Microphone permission changed
  [ ] Network lost
  [ ] Other: ___________________

System response:
  [ ] RECOVERED
  [ ] FAILED SAFELY
  [ ] FAILED UNSAFELY

Description:
`

---

## 8. Safety Event Record

> Only fill if a healthcare or critical-domain translation occurred.

`
Turn ID:                  TURN-___
Content category:
  [ ] Dosage  [ ] Emergency instruction  [ ] Allergy  [ ] Medication
  [ ] Pregnancy  [ ] Critical symptom  [ ] Other: ______________

Human verification performed:   [ ] YES  [ ] NO
Verified by (role, anonymized): [e.g. Healthcare supervisor OPR-___]
Outcome:
  [ ] Translation confirmed correct
  [ ] Translation corrected before use
  [ ] Translation discarded
  [ ] Escalated
Notes:
`

---

## 9. End of Session Summary

`
Session ID:
Total turns attempted:
Turns: END-TO-END SUCCESS:       ___
Turns: END-TO-END FAILURE:       ___
Auto-stop premature (count):     ___
Auto-stop delayed (count):       ___
Browser crash:                   YES / NO
App freeze:                      YES / NO
Battery start:                   ___%
Battery end:                     ___%
Battery consumed:                ___%
Thermal observation:             [ ] Normal  [ ] Warm  [ ] Very warm  [ ] Performance degradation
Offline test performed:          YES / NO
Offline test result:             [ ] PASS  [ ] FAIL  [ ] NOT TESTED
Operator notes:
User feedback (summary):
`

---

## Evidence Labels (mandatory for every entry)

Each completed session form must be labelled with one of:

`
PHYSICAL DEVICE   — real Android / iOS device, no emulator
REAL SPEAKER      — a real person speaking, not synthetic audio
REAL FIELD        — location matches environment classification above
DESKTOP           — tested on desktop browser only
AUTOMATED         — run by a test script
SIMULATED         — using pre-recorded or synthetic inputs
NOT TESTED        — skipped / blocked
`

> Never mix labels within a single turn record.
