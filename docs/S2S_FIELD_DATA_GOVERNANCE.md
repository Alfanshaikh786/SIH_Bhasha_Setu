# Bhasha Setu — S2S Field Data Governance & Privacy Policy

**Document Version:** 1.0  
**Phase:** Phase 7 — Controlled Field Pilot & Production Evidence  
**Status:** BINDING DATA GOVERNANCE POLICY  
**Core Mandate:** Protection of Indigenous & Marginalized Citizens. Absolute Prohibition on Exploitative Data Harvesting.

---

## 1. Fundamental Governance Principles

1. **Zero Exploitation:** Speech collected during community health camps or tribal classrooms will **NEVER** be converted into proprietary AI commercial assets without informed community ownership.
2. **Volatile In-Memory Processing:** Raw microphone audio buffers exist exclusively in volatile device RAM during live inference. They are immediately released upon turn finalization.
3. **No Automatic Training:** 
   $$\textbf{ABSOLUTE RULE: NO AUTOMATIC MODEL TRAINING FROM FIELD USER DATA.}$$
   Field conversations are never secretly fed into unsupervised model retraining pipelines.

---

## 2. Explicit Data Classification: Collected vs. Excluded

### 2.1 What IS Collected (Anonymized Diagnostic Telemetry)
- Session metadata: Session ID (e.g. `SES-001`), timestamp, qualitative environment tier (e.g. `CLASSROOM`).
- Device hardware tier (e.g. `Android Go 2GB`, `Desktop Chrome`).
- Anonymized speaker token (e.g. `SPK-EDU-001`).
- Operational pipeline milestones: Event names (`MIC_STARTED`, `SPEECH_DETECTED`, `MIC_AUTO_STOPPED`), duration in milliseconds.
- Error taxonomy categorization (e.g. `NUMBER_ERROR`, `VAD_FAILURE`).
- User voluntary structured feedback ratings ($1 - 5$ scale).

### 2.2 What is NEVER Collected (Strictly Excluded)
- ❌ **No Personal Identifiable Information (PII):** No names, Aadhaar numbers, phone numbers, home addresses, or school roll numbers.
- ❌ **No Raw Audio Files:** Raw PCM16 or WAV recordings of human voices are **NOT** persisted to disk, cloud servers, or device storage.
- ❌ **No Private Medical Records:** Diagnoses, clinical histories, or identifiable symptoms are never tied to patient identities.
- ❌ **No Biometric Voiceprints:** No acoustic speaker identification vectors or voiceprints are computed or saved.
- ❌ **No Background Audio Snooping:** Microphone capture is completely deactivated outside active listening turns.

---

## 3. Community Consent & Vernacular Communication

1. **Free, Prior, and Informed Consent (FPIC):**
   - Before testing begins in any school or Primary Health Centre, researchers must verbally explain the tool's purpose in **Santali** (*ᱥᱟᱱᱛᱟᱲᱤ*) or **Hindi** (*हिन्दी*).
   - Participants and parents (for minors) must understand that Bhasha Setu is a live translation assistant and does not record or broadcast their voices to the internet.
2. **Right to Withdraw:**
   - Any participant can halt their turn or request immediate deletion of their local session history at any time without penalty.

---

## 4. Local Storage, Retention & Deletion Policy

1. **Device-Local Storage:**
   - Turn history is saved exclusively within the browser's local **IndexedDB** on the user's physical device.
   - History survives browser reloads to support offline continuity, but is inaccessible to external third-party websites due to standard browser Same-Origin Policy (SOP).
2. **Data Purging:**
   - Field teams are instructed to execute **"Clear History"** at the conclusion of every field day.
   - Cached test records in IndexedDB are purged completely with zero lingering artifacts.
3. **Sync Queue Governance:**
   - Offline sync entries (used only for human-verified vocabulary corrections) contain only bilingual text phrases and confidence tags. They are sent over HTTPS and immediately purged from the local sync queue upon receipt.

---

## 5. Security & Access Control

- **Encryption in Transit:** All synchronization communication occurs exclusively over encrypted TLS (HTTPS / WSS).
- **Physical Device Security:** Mobile pilot devices must have Android PIN/biometric screen lock enabled to prevent unauthorized physical inspection of local test sessions.
- **Audit Logs:** All diagnostic telemetry logs are bounded in memory to a maximum of 100 entries to prevent memory bloat and unauthorized forensics.
