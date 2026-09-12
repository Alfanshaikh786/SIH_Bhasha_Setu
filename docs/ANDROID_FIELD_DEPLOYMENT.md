# Bhasha Setu — Android Field Deployment Guide

**Document Version:** 1.0  
**Phase:** Phase 8 — Deployment Engineering & Field-Pilot Execution Support  
**Target Platform:** Android Smartphones & Tablets (Android 8.0+ / Android Go / Standard Android)  
**Primary Principle:** Zero Fabricated Claims. Honest demarcation between software-emulated checks and physical hardware testing.

---

## 1. Hardware & System Requirements

| Specification | Minimum Requirement | Recommended Specification |
| :--- | :--- | :--- |
| **Operating System** | Android 8.0 (Oreo) or Android Go Edition | Android 11+ (Standard or Go Edition) |
| **RAM** | 1.0 GB RAM (Android Go) | 3.0 GB – 4.0 GB RAM |
| **Available Storage** | 150 MB free disk space | 500 MB free disk space |
| **Processor** | Quad-core 1.5 GHz (e.g. MediaTek Helio A22 / Unisoc) | Octa-core 2.0 GHz (e.g. Snapdragon 680 / Dimensity 700) |
| **Audio Hardware** | Built-in microphone + loudspeaker | 3.5mm TRRS wired headset (for noisy environments) |
| **Connectivity** | Wi-Fi or 4G for initial install only | Offline flight mode capable post-install |

---

## 2. Browser Runtime Requirements

- **Supported Browsers:**
  - **Google Chrome:** Version 100.0 or higher (Recommended).
  - **Microsoft Edge Mobile:** Version 100.0 or higher.
  - **Brave for Android:** Version 1.40 or higher.
- **Required Web APIs:**
  - `navigator.mediaDevices.getUserMedia` (Web Audio input).
  - `window.AudioContext` or `window.webkitAudioContext` (16 kHz downsampling and VAD).
  - `window.speechSynthesis` (Text-to-Speech playback).
  - `window.indexedDB` (Offline storage and sync queue).
  - `navigator.serviceWorker` (PWA offline caching).
  - `WebAssembly` (In-browser SQLite engine).

---

## 3. Progressive Web App (PWA) Installation Procedure

1. **Initial Provisioning:**
   - Connect the Android device to the field local Wi-Fi, hotspot, or mobile data.
   - Open Chrome and navigate to the Bhasha Setu deployment URL:
     - Local Field Hotspot Gateway: `http://192.168.x.x:5174/` (or production host).
2. **Add to Home Screen:**
   - Chrome will show an automatic banner: **"Add Bhasha Setu to Home screen"**.
   - If the banner does not appear, tap the Chrome menu (three vertical dots in top-right) $\to$ select **"Install app"** or **"Add to Home screen"**.
3. **PWA Standalone Launch:**
   - Close the Chrome browser tab.
   - Locate the **Bhasha Setu** icon on the Android home screen or app drawer.
   - Tap the icon to launch in standalone window mode (runs without the browser URL address bar, identical to a native app).

---

## 4. Microphone Permissions Grant & Recovery

1. **First-Run Prompt:**
   - Upon navigating to **Speech-to-Speech** (`/speech-to-speech`) or **Field Mode** (`/field-mode`), tap the microphone button.
   - Android will display the permission dialog: *"Allow Bhasha Setu to record audio?"*
   - Select **"While using the app"** or **"Allow"**.
2. **If Permission Was Denied Accidentally:**
   - Open Android **Settings** $\to$ **Apps** $\to$ **Chrome** (or Bhasha Setu) $\to$ **Permissions** $\to$ **Microphone** $\to$ select **"Allow only while using the app"**.
   - Return to Bhasha Setu and refresh the app.

---

## 5. Offline Pre-Cache & Verification

1. **Automatic Background Pre-Cache:**
   - Upon first load, `sw.js` (Cache v3) automatically precaches:
     - Core web application bundle (`index.html`, JavaScript, CSS).
     - SQLite WebAssembly binary (`/sql-wasm.wasm`).
     - In-memory 6,780-word verified Santali parallel dataset (`/data/translations.db`).
     - App icons and fonts.
2. **Verification Test (Offline Airplane Mode Flight):**
   - Swipe down the Android notification shade and turn on **Airplane Mode** (disconnect all Wi-Fi and mobile data).
   - Close and relaunch Bhasha Setu from the home screen.
   - Open the **Dictionary** or **Speech-to-Speech** page.
   - Verify that the app loads instantly without dinosaur/offline error screens.
   - Execute an offline translation (e.g. *"hospital"*, *"water"*, *"book"*). Verify that the translation and Ol Chiki rendering appear instantly.

---

## 6. Model Download & Field Backend Architecture

- **Hindi & English Speech Recognition:** Handled natively by Android's on-device Web Speech recognition.
- **Santali Neural ASR (AI4Bharat IndicConformer ONNX Int8):**
  - Runs locally on the field deployment host (laptop, edge tablet, or local Raspberry Pi server on port 5000).
  - When the Android device is connected to the field host's Wi-Fi hotspot, the app dynamically routes WebSocket packets to `ws://<host-ip>:5000/api/asr/stream`.
  - No internet connection to external cloud providers is ever required.

---

## 7. Storage Footprint Budget (Actual Production Build)

| Component | Actual Measured Size | Storage Location |
| :--- | :---: | :--- |
| **Application Bundle (HTML, CSS, JS)** | $\approx 2.8\text{ MB}$ ($320\text{ kB}$ gzipped) | PWA Cache Storage |
| **SQLite WASM Binary (`sql-wasm.wasm`)** | $643\text{ kB}$ | PWA Cache Storage |
| **Offline Translations DB (`translations.db`)** | $3.84\text{ MB}$ | PWA Cache Storage |
| **In-Memory Bundled Lexicon Chunks** | $2.19\text{ MB}$ ($240\text{ kB}$ gzipped) | JavaScript Memory Heap |
| **App Icons & Static Assets** | $120\text{ kB}$ | PWA Cache Storage |
| **IndexedDB (Session History & Sync Queue)** | $< 500\text{ kB}$ (for 100 turns) | Local IndexedDB |
| **Diagnostic Telemetry Logs** | $< 50\text{ kB}$ (capped at 100 entries) | Volatile RAM |
| **Total Storage Required on Device** | **$< 10.5\text{ MB}$** | **Fits comfortably on any 1GB Go device** |

---

## 8. Low-End Android Physical Measurement Protocol

When testing on physical sub-$100 Android Go devices, field researchers record the following benchmarks:

1. **Memory Profiling:**
   - Baseline memory prior to launch.
   - Memory immediately after PWA launch.
   - Memory during active microphone listening with VAD running.
   - Memory after 10, 30, and 50 conversational turns.
   - Look for progressive heap accumulation or unreleased audio buffers.
2. **CPU & Thermal Profiling:**
   - Observe device casing temperature after 30 minutes of continuous conversational turns in warm ambient shade ($30 - 38^\circ\text{C}$).
   - Record whether Android OS initiates thermal CPU throttling or terminates the Chrome foreground task.
3. **Battery Drain:**
   - Charge device to 100%.
   - Execute 50 complete S2S turns over a 30-minute span.
   - Record ending battery percentage. Target: $\le 6\%$ drain per 30 minutes of continuous S2S operation.

---

## 9. Browser Interruption & Recovery Handling

- **Incoming Phone Call:** Android audio manager takes exclusive audio focus. Bhasha Setu detects the track pause/disconnect and cleanly transitions turn state to `IDLE`. Once the call ends, tapping the microphone initiates a fresh turn without page reload.
- **Screen Timeout / Lock:** Audio input safely disconnects; turn state resets to `IDLE`. Upon unlock, the UI is instantly ready for user interaction.
- **App Backgrounding:** Moving Bhasha Setu to background pauses the Web Audio processor node, preventing battery drain while not in active use.

---

## 10. Troubleshooting & Field Reset Procedures

| Problem | Root Cause | Resolution |
| :--- | :--- | :--- |
| **"Microphone error / not allowed"** | Android permission denied | Settings $\to$ Apps $\to$ Chrome $\to$ Permissions $\to$ Enable Microphone. |
| **"Offline translations not loading"** | Pre-cache incomplete | Reconnect to Wi-Fi briefly; reload page to let Service Worker Cache v3 complete install. |
| **"Speech auto-stop never triggers"** | Loud ceiling fan / noise | Adaptive noise floor tracks steady noise. If fan is extreme, move $1\text{m}$ back or tap mic button to stop manually. |
| **"Audio output silent"** | Media volume muted in Android | Press volume up button; ensure **Media Volume** is at $80\%+$. |
| **"App frozen or unresponsive"** | Memory pressure | Swipe away Bhasha Setu in Android app switcher and tap the icon to relaunch. |

### Complete Factory Reset Procedure (Data Purge):
1. Open Chrome $\to$ **Settings** $\to$ **Site settings** $\to$ **All sites**.
2. Search for the deployment domain.
3. Tap **"Clear & reset"** to purge all cached data, IndexedDB records, and service workers.
4. Relaunch URL to perform a clean, fresh install.
