# Bhasha Setu — Santali Speech Recording Guidelines

**Document Version:** 1.0.0  
**Target Audience:** Field Engineers, Community Coordinators, Recording Technicians  
**Date:** September 2026  

---

## 1. Acoustic Recording Environment

High-quality neural speech synthesis requires dry, clean acoustics with minimal room reflections and low ambient noise.

### Environment Checklist
* **Noise Floor:** Ambient room noise must remain $\le -45\text{ dBFS}$ (ideally $\le -55\text{ dBFS}$).
* **Mechanical Noise Isolation:**
  - Turn off ceiling fans, air conditioners, coolers, and refrigerators during active recording.
  - Close all windows and doors facing streets or corridors.
* **Room Reflection / Flutter:**
  - Avoid rooms with bare concrete walls and tiled floors.
  - Hang heavy curtains, blankets, or acoustic foam around the recording perimeter to absorb reverberation ($RT60 \le 0.2\text{ seconds}$).
* **Interference:** Place mobile phones in Airplane Mode to eliminate cellular and RF interference pulses.

---

## 2. Accessible Microphone Categories

While commercial studios use multi-thousand-dollar gear, community-driven tribal language collection requires practical, accessible equipment standards:

| Category | Recommended Equipment Examples | Suitable Context | Rating |
| :--- | :--- | :--- | :---: |
| **A. USB Condenser Mic** | Rode NT-USB, Blue Yeti Nano, Samson Q2U, Audio-Technica ATR2100x | Community center, school office, quiet indoor room | **Recommended** |
| **B. Broadcast Dynamic Mic** | Shure SM7B, Shure MV7, Rode PodMic with audio interface | Studio or dedicated treated field booth | **Optimal** |
| **C. Smartphone Lavalier Mic** | Rode SmartLav+, Boya BY-M1, Sennheiser XS Lav Mobile | Remote village homes, school field visits | **Acceptable** |
| **D. Internal Phone Mic** | Bare smartphone built-in microphone | Casual testing only | **REJECTED for Corpus** |

---

## 3. Physical Placement & Pop Protection

* **Distance:** Maintain a constant distance of **$15\text{ cm} - 20\text{ cm}$** (approximately one handspan) between mouth and microphone capsule.
* **Angle:** Position the microphone at a **30° to 45° angle off-axis** relative to the speaker's mouth. This directs air blasts away from the diaphragm, eliminating plosive distortion (*p*, *b*, *t*, *k*).
* **Pop Filter:** Always use a dual-layer nylon or metal mesh pop filter positioned $5\text{ cm}$ in front of the microphone.
* **Shock Mount / Stand:** Mount the microphone on an isolated desk stand or boom arm to prevent desk taps, keyboard clicks, and floor vibrations from transmitting into the recording.

---

## 4. Gain Staging & Dynamic Levels

1. **Target Peak Amplitude:** Calibrate preamplifier gain so that peak speech levels register between **$-6\text{ dBFS}$ and $-3\text{ dBFS}$**.
2. **Hard Ceiling:** Levels must **never reach $0.0\text{ dBFS}$**. Any audio buffer with clipped samples ($> 0.05\%$) is automatically rejected by the automated quality checker.
3. **Noise Floor Ratio:** The speech signal should sit at least $30\text{ dB}$ above the ambient background noise floor.

---

## 5. Session Protocol & Speaker Well-Being

* **Vocal Warm-Up:** Allow the contributor 5 minutes to read through the Ol Chiki prompts silently before recording commences.
* **Hydration:** Provide room-temperature water. Avoid dairy or iced beverages immediately prior to sessions.
* **Fatigue Management:** Limit continuous recording sessions to a maximum of **45 minutes** to prevent vocal strain, pitch drift, and cognitive fatigue.
* **Natural Pacing:** Instruct speakers to read in their natural, conversational storytelling cadence. Do not force an unnaturally fast or exaggerated slow tempo.
