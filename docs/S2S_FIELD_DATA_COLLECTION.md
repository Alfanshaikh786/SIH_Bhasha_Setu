# Bhasha Setu — S2S Field Pilot Data Collection Plan

**Document Version:** 1.0  
**Phase:** Phase 7 — Controlled Field Pilot & Production Evidence  
**Status:** PROSPECTIVE FIELD PROTOCOL & TARGET DESIGN  
**Ethical Principle:** Transparent Disclosure. All deployment venues listed herein are **TARGET PILOT LOCATIONS**, not claims of pre-existing completion.

---

## 1. Pilot Scope & Target Cohorts

### 1.1 Target Venue A: Primary Education (Target: 2 Government Tribal Schools)
- **Proposed Locations:** Dumka district, Jharkhand (Santhal Pargana division).
- **Target Participants:**
  - 4 Primary School Teachers (Bilingual in Hindi/Santali).
  - 20 Native Santali Students (Grades 3 to 6).
- **Session Goals:**
  - 10 structured classroom sessions (15–20 minutes per session).
  - 50 total conversational dialogue turns per session.
- **Linguistic Focus:** Classroom management, story comprehension, math word problems, attendance, daily questions.

### 1.2 Target Venue B: Primary Healthcare (Target: 1 Supervised PHC / CHC)
- **Proposed Location:** Community Health Centre / PHC in East Singhbhum or Dumka.
- **Target Participants:**
  - 2 Supervised Medical Officers / Nurses.
  - 3 ASHA Community Health Workers.
  - 15 Outpatient Adult Patients (Santali native speakers).
- **Session Goals:**
  - 8 supervised triage sessions (15–30 minutes each).
  - Minimum 40 turns per session.
- **Linguistic Focus:** Symptom elicitation, fever/pain descriptions, dosage instructions, sickle cell screening questions, emergency transport requests.
- **Clinical Supervision:** System is strictly an assistive communication aid; human clinicians verify all advice prior to clinical action.

---

## 2. Participant Anonymization & Demographic Balancing

All participants will be cataloged strictly via random token identifiers:
$$\text{Speaker Token Scheme:} \quad \text{SPK-}[DOMAIN]-[INDEX] \quad (\text{e.g. } \text{SPK-EDU-001}, \text{SPK-HLT-004})$$

### Demographic Target Distribution
| Category | Target Ratio | Notes |
| :--- | :---: | :--- |
| **Gender** | 50% Female / 50% Male | Critical for acoustic pitch balance in VAD |
| **Age: Children (8–12)** | 25% | Education domain |
| **Age: Adults (18–50)** | 55% | Healthcare and education teachers |
| **Age: Elders (55+)** | 20% | Healthcare domain (monolingual Santali dialectal speakers) |
| **Speaking Speed** | 30% Slow, 50% Conversational, 20% Rapid | Tests auto-stop hesitation resilience |

---

## 3. Acoustic Condition & Microphone Distance Testing

### 3.1 Qualitative Noise Classification
If calibrated sound meters are absent, field observers record qualitative noise tiers:
1. `LEVEL_1_QUIET`: Closed room, no fan, distant murmur ($< 45\text{ dBA}$).
2. `LEVEL_2_FAN_INDOOR`: Steady ceiling fan on medium/high ($45 - 60\text{ dBA}$).
3. `LEVEL_3_CLASSROOM_CHATTER`: Multiple children whispering, page turning ($55 - 70\text{ dBA}$).
4. `LEVEL_4_OUTDOOR_ROAD`: Distant motorcycle, wind draft, roadside ($65 - 80\text{ dBA}$).
5. `LEVEL_5_HOSPITAL_BABBLE`: Crowded clinic waiting room, crying infant, overlapping voices ($70 - 85+\text{ dBA}$).

### 3.2 Microphone Distance Test Matrix
To determine the acoustic degradation threshold, field researchers record the distance between speaker mouth and device microphone:
- **5 cm:** Extreme close-up / quiet whisper.
- **10 cm:** Standard handheld smartphone conversation.
- **20 cm:** Comfortable one-handed conversational distance.
- **30 cm:** Desk placement (tablet / laptop in front of user).
- **50 cm:** Classroom podium / across-the-table distance.

Field researchers record whether ASR word accuracy drops or if background noise is mistakenly captured at each distance band.

---

## 4. End-to-End Turn Success Evaluation

Every conversational turn is recorded in the field log and scored across the complete 7-stage pipeline:
$$\text{MIC} \longrightarrow \text{VAD} \longrightarrow \text{ASR} \longrightarrow \text{TRANSLATION} \longrightarrow \text{SAFETY} \longrightarrow \text{TTS} \longrightarrow \text{PLAYBACK}$$

### Turn Outcome Definitions:
- `END_TO_END_SUCCESS`: Utterance was accurately captured, transcribed, translated without semantic alteration, cleared safety, and vocalized clearly to the listener.
- `TURN_FAILURE`: A critical failure occurred in one or more pipeline stages, requiring the user to repeat the turn or seek manual fallback.

---

## 5. Failure Taxonomy Classification

When a failure occurs, it must be assigned exactly one primary root category:
1. `MICROPHONE_FAILURE`: Permission blocked, hardware audio HAL failure, or device disconnection.
2. `VAD_FAILURE`: False speech trigger from background noise, or failure to detect quiet speech.
3. `ASR_FAILURE`: Word substitution, character error, or deletion producing incomprehensible text.
4. `TRANSLATION_FAILURE`: Inaccurate translation, missing semantic concept, or incorrect entities.
5. `SAFETY_REVIEW`: Utterance demoted to `needs_review` due to medical risk, dosage mismatch, or negation inversion.
6. `TTS_FAILURE`: Speech synthesis threw error, audio graph crashed, or chime fallback triggered.
7. `PLAYBACK_FAILURE`: Voice played too softly, cut off mid-word, or was unintelligible to listener.
8. `NETWORK_FAILURE`: Offline sync queue error or timeout during cloud fallback attempt.
9. `DEVICE_FAILURE`: Mobile browser crashed, tab backgrounded, or OS thermal throttling suspended task.
10. `PERFORMANCE_FAILURE`: Total turn latency exceeded $4000\text{ ms}$, breaking conversational pacing.
11. `USER_WORKFLOW_FAILURE`: Speaker spoke before tapping mic, or tapped wrong speaker card.
