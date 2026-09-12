# Bhasha Setu — S2S Field Deployment Pre-Flight Checklist

**Document Version:** 1.0  
**Phase:** Phase 8 — Deployment Engineering & Field-Pilot Execution Support  
**Target Environment:** Primary Health Centres (PHCs), Sub-Centres, Ashram Shalas, Rural Classrooms  
**Mandatory Rule:** Every box must be physically verified and checked off before conducting any field sessions.

---

## 1. Pre-Flight Verification Checklist

| Item | Checklist Verification Item | Verification Criteria | Status | Sign-off |
| :---: | :--- | :--- | :---: | :---: |
| 1 | **[ ] Device charged** | Battery level $\ge 85\%$; external 10,000 mAh power bank packed for field sessions. | PENDING | [ ] |
| 2 | **[ ] Chrome installed** | Google Chrome $\ge$ v100.0 (or Edge $\ge$ v100.0) verified in Android app manager. | PENDING | [ ] |
| 3 | **[ ] PWA installed** | PWA installed to Android home screen; launches in standalone mode without browser URL bar. | PENDING | [ ] |
| 4 | **[ ] Microphone permission granted** | Android system permission set to *"Allow while using app"*; first mic tap captures audio without prompt. | PENDING | [ ] |
| 5 | **[ ] Models downloaded** | Backend edge server has `ai4bharat-indicconformer-sat-onnx` cached; SQLite DB ($4.03\text{ MB}$) precached in PWA. | PENDING | [ ] |
| 6 | **[ ] Offline mode tested** | Device placed in Airplane Mode; app launches from home screen and translates offline words with 0 errors. | PENDING | [ ] |
| 7 | **[ ] Storage verified** | Android storage shows $\ge 150\text{ MB}$ free space; Bhasha Setu cache $< 12\text{ MB}$. | PENDING | [ ] |
| 8 | **[ ] Language verified** | Santali (Ol Chiki $\leftrightarrow$ Hindi $\leftrightarrow$ English) selected; Mundari and Ho verified as gated. | PENDING | [ ] |
| 9 | **[ ] Speaker workflow tested** | Turn 1 (Santali $\to$ Hindi) and Turn 2 (Hindi $\to$ Santali) complete sequentially with turn locking active. | PENDING | [ ] |
| 10 | **[ ] Auto-stop tested** | Speaker speaks 3 words and stops; system detects 7s silence (`AUTO_STOP_SILENCE_MS = 7000`) and finalizes turn. | PENDING | [ ] |
| 11 | **[ ] TTS tested** | Audio output clear; media volume at $\ge 80\%$; phonetic bridge pronounces Santali text cleanly. | PENDING | [ ] |
| 12 | **[ ] Recovery tested** | Mid-turn lock/unlock and incoming call simulated; app returns cleanly to `IDLE` without freezing. | PENDING | [ ] |
| 13 | **[ ] Data governance reviewed** | Operator confirms: Zero raw audio saved; zero PII logged; session history cleared at end of day. | PENDING | [ ] |
| 14 | **[ ] Emergency/manual fallback understood** | Operator knows how to use pre-verified quick phrases and text input mode if noise $> 85\text{ dBA}$. | PENDING | [ ] |

---

## 2. Step-by-Step Operator Verification Protocol

### Step 1: Physical Battery & Hardware Check
- Verify device has $\ge 85\%$ charge. If traveling more than 2 hours from electricity grid, connect or carry an external power bank.
- Inspect microphone port on the bottom of the device. Ensure no pocket lint or dust obstructs the acoustic port.

### Step 2: Airplane Mode Offline Verification
1. Swipe down the Android notification drawer.
2. Tap the **Airplane mode** tile (all Wi-Fi, 4G, and Bluetooth turn off).
3. Tap the **Bhasha Setu** icon on the home screen.
4. Confirm the app launches to the home screen within 1.5 seconds.
5. Navigate to **Speech-to-Speech** (`/speech-to-speech`).
6. Verify the UI renders without blank screens or network error dialogs.

### Step 3: Turn-Taking & Auto-Stop Verification
1. Tap Speaker A microphone button.
2. Speak a simple phrase (e.g. *"ᱡᱚᱦᱟᱨ"* or *"How are you"*).
3. Stop talking completely.
4. Watch the progress bar or count silently: at exactly 7 seconds of sustained silence, the microphone must stop automatically.
5. Verify translation appears on the partner speaker's card and speech synthesis plays aloud.

### Step 4: Interruption Recovery Check
1. Tap Speaker A microphone button to start listening.
2. Press the power button to lock the device screen.
3. Wait 3 seconds, then unlock the device.
4. Verify Bhasha Setu is in a clean `IDLE` state with the microphone safely closed and no spinning spinners stuck forever.

### Step 5: End-of-Session Data Hygiene
1. At the conclusion of all patient or classroom interactions, navigate to **Settings** or session history.
2. Tap **Clear History** to purge in-memory and IndexedDB diagnostic logs.
3. Verify that zero audio recordings or participant names are stored on the device.

---

## 3. Escalation Contact Matrix

- **Technical Pilot Lead:** Contact via designated on-ground field radio / WhatsApp group.
- **Linguistic Consultant (Santali):** Available for Ol Chiki orthographic and dialect verification.
- **Medical Supervisor (PHC In-Charge):** Available for all clinical escalation questions.
