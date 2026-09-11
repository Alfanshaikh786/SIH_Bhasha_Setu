# Bhasha Setu — S2S Field Pilot Operations Runbook

**Document Version:** 1.0  
**Phase:** Phase 7 — Controlled Field Pilot & Production Evidence  
**Audience:** Field Researchers, Primary School Teachers, ASHA Healthcare Workers, On-Ground Pilot Engineers  
**Target Region:** Supervised pilot camps in Jharkhand, Odisha, and West Bengal  

---

## 1. Preparation & Setup

### 1.1 Device Prerequisites
- **Recommended Hardware:**
  - Android Smartphone (Android 10+, minimum 2GB RAM; Android Go supported).
  - Or Laptop / Chromebook with Chrome / Edge browser.
- **Audio Hardware:**
  - Integrated device microphone (held $10 - 20\text{ cm}$ from speaker's mouth).
  - Standard 3.5mm TRRS wired headset (recommended in noisy environments).
- **Browser:** Google Chrome (v100+) or Microsoft Edge. Web Speech API and Web Audio API enabled.

### 1.2 Offline Installation & PWA Pre-Caching
1. Connect the device to Wi-Fi or cellular data for initial provisioning.
2. Open Bhasha Setu URL (e.g. `http://localhost:5174/` or production domain).
3. In Chrome, tap the menu (three dots) $\to$ **"Install App"** or **"Add to Home screen"**.
4. Allow the Service Worker (Cache v3) to finish downloading all static assets and the 6,780-record Santali dataset.
5. Verify offline readiness:
   - Turn on Airplane Mode.
   - Reload the application from the home screen.
   - Verify that the app launches instantly with zero network errors.

### 1.3 Microphone Permissions Setup
1. When prompted upon opening Speech-to-Speech or Field Mode, tap **"Allow"** for microphone access.
2. If blocked accidentally:
   - Tap the lock icon in the browser address bar $\to$ **Site settings** $\to$ **Microphone** $\to$ select **Allow**.
   - Restart the browser.

---

## 2. Conversation & Turn-Taking Operating Procedures

### 2.1 Standard Speech-to-Speech Mode (`/speech-to-speech`)
1. **Language Selection:**
   - Speaker A card: Set primary native tongue (e.g. **Santali (Ol Chiki)**).
   - Speaker B card: Set conversational partner's tongue (e.g. **Hindi** or **English**).
2. **Speaker A Turn:**
   - Tap the microphone button on Speaker A's card.
   - The status changes to `"Listening..."`.
   - Speaker speaks naturally in Santali.
   - Speak clearly at normal conversational volume.
3. **Conversational Pauses & Auto-Stop:**
   - The speaker can pause for $1 - 4\text{ seconds}$ to gather thoughts; the microphone remains active.
   - When the speaker finishes their thought, they stop speaking.
   - The system detects continuous silence for **7 seconds** (`AUTO_STOP_SILENCE_MS = 7000`) and automatically finalizes the turn.
   - *Manual Override:* If the speaker finishes and wants an instant response, tap the microphone button again to stop immediately.
4. **Processing & Speech Output:**
   - ASR transcribes the audio into Ol Chiki script.
   - The Translation Decision Engine translates the text.
   - Voice output plays automatically through high-clarity speech synthesis.
5. **Speaker B Turn:**
   - Tap Speaker B's microphone button.
   - Speaker B responds in Hindi/English.
   - System translates and speaks back in Santali.

### 2.2 Field Mode (Walkie-Talkie / One-Handed Operation) (`/field-mode`)
- Designed for mobile field use by frontline health workers and teachers.
- Tap and hold or single-tap to speak.
- 7-second silence auto-stop operates identically in the background.

---

## 3. Operational Recovery Procedures

| Operational Event | Observed Symptom | Standard Recovery Action |
| :--- | :--- | :--- |
| **Incoming Phone Call** | Audio capture halts; screen transitions | Dismiss or finish call. Tap the microphone button to start a fresh turn. |
| **Accidental Screen Lock** | Audio stops capturing | Unlock phone. System resets safely to `IDLE`. Tap microphone to resume. |
| **Network Loss Mid-Turn** | No internet connection | System automatically executes local offline SQLite/dataset lookup. No action needed. |
| **Bluetooth Headset Disconnect** | Audio cuts out | System resets to `IDLE`. Tap microphone to re-initiate capture using phone mic. |
| **Ambient Fan Noise Spikes** | Background noise loud | Adaptive noise floor tracks fan. If mic does not auto-stop, tap mic button for manual stop. |
| **Unsafe Medical Translation** | Badge displays `"needs_review"` | Read source text aloud; consult human medical translator; do NOT rely on unverified advice. |

---

## 4. Manual Fallback Procedures

If ambient acoustics are too loud ($> 85\text{ dBA}$) for reliable speech recognition:
1. **Quick-Dial Verified Phrases:** Tap any pre-verified quick-phrase card on screen (e.g. *"Where is the clinic?"*, *"Take medicine twice daily"*).
2. **Text Input Mode:** Type or select text directly for deterministic 100% accurate offline translation.

---

## 5. Session Reset & Data Hygiene

- At the end of every testing session:
  - Verify that offline sync queue has zero pending unsynced records (if internet was re-established).
  - To clear local test conversation history: tap the history trash icon or clear browser storage.
  - No personal patient or student recordings are retained in device storage.
