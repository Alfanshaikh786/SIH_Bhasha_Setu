# Bhasha Setu — Stage-1 Field Deployment Evaluation Gate

**Document Version:** 1.0  
**Phase:** Phase 8 — Deployment Engineering & Field-Pilot Execution Support  
**Gate Status:** GREEN FOR SUPERVISED FIELD PILOT / CONDITIONAL PHYSICAL SENSING  
**Core Directive:** Zero Fabricated Claims. Honest demarcation between GREEN, YELLOW, and RED readiness tiers.

---

## 1. Gate Classification Criteria

- **GREEN:** Fully implemented, automated/desktop tested, production-built, and safe for supervised field pilot sessions.
- **YELLOW:** Functionally implemented and working in laboratory/desktop environments, but awaiting on-ground physical hardware evidence (e.g. sub-$100 Android Go hardware or crowded PHC acoustic data).
- **RED:** Unsafe, failing critical guardrails, or unusable in the field.

---

## 2. 14-Point Architectural & Operational Assessment

| # | Evaluation Domain | Gate Status | Current Measured Status | Technical Rationale & Evidence |
| :---: | :--- | :---: | :--- | :--- |
| 1 | **Core Android Architecture** | <span style="color:goldenrod;font-weight:bold;">YELLOW</span> | Ready for install; pending physical test | PWA manifests, icons, service worker, and dynamic LAN IP routing completed; physical Android Go hardware testing not yet conducted. |
| 2 | **Microphone Hardware Interface** | <span style="color:green;font-weight:bold;">GREEN</span> | Desktop tested (Real Mic) | Web Audio 16 kHz pipeline, dynamic gain, TRRS headset compatibility verified on real desktop hardware. |
| 3 | **Voice Activity Detection (VAD)** | <span style="color:green;font-weight:bold;">GREEN</span> | Verified (235/235 tests) | Adaptive noise-floor energy VAD tracks ambient drift ($E_{\text{floor}}$); rejects steady acoustic humming. |
| 4 | **7-Second Silence Auto-Stop** | <span style="color:green;font-weight:bold;">GREEN</span> | Verified (`AUTO_STOP_SILENCE_MS = 7000`) | Deterministic auto-stop after 7 seconds of sustained silence; manual tap override operates cleanly. |
| 5 | **Santali Neural ASR (Ol Chiki)** | <span style="color:green;font-weight:bold;">GREEN</span> | Verified (IndicConformer Int8) | Authentic Ol Chiki (U+1C50–U+1C7F) transcription on local FastAPI server (`localhost:5000`); real native Santali audio verified. |
| 6 | **Translation Engine & Registry** | <span style="color:green;font-weight:bold;">GREEN</span> | Verified (83/83 regression tests) | Deterministic NMT lookup across 6,780 parallel corpus entries; never-guess policy active on OOV terms. |
| 7 | **Text-to-Speech (TTS)** | <span style="color:green;font-weight:bold;">GREEN</span> | Verified (`PhoneticTTSAdapter`) | High-clarity phonetic Romanization bridge active. Native Santali Neural TTS honestly gated as `BLOCKED BY DATA`. |
| 8 | **Healthcare Clinical Safety** | <span style="color:green;font-weight:bold;">GREEN</span> | Verified (5 Safety Rules) | Boundary-aware negation check, dosage pattern intercept, emergency keyword routing, and non-blocking verification flags active. |
| 9 | **Offline PWA Architecture** | <span style="color:green;font-weight:bold;">GREEN</span> | Verified (Service Worker Cache v3) | $8.18\text{ MB}$ total build footprint precaches all assets, SQLite WASM, and `translations.db` for full offline flight. |
| 10 | **Storage Budget Compliance** | <span style="color:green;font-weight:bold;">GREEN</span> | Measured: $8.18\text{ MB}$ (Target $< 25\text{ MB}$) | Exceeds efficiency budget by $67\%$; fits comfortably on any low-end 1GB Android Go smartphone. |
| 11 | **Privacy & Data Governance** | <span style="color:green;font-weight:bold;">GREEN</span> | Verified (Local-Only Architecture) | Zero cloud audio streaming; zero persistent PII logging; session history flushable on-device. |
| 12 | **Low-End Android Thermals** | <span style="color:goldenrod;font-weight:bold;">YELLOW</span> | Simulated; pending physical test | Desktop Chrome profiling indicates low CPU ($2.8\%$), but thermal throttling on physical Unisoc/MediaTek Go chipsets requires field logging. |
| 13 | **Battery Consumption** | <span style="color:goldenrod;font-weight:bold;">YELLOW</span> | Simulated; pending physical test | Target $< 6\%$ per 30 minutes continuous; physical battery drain on actual battery chemistry pending field pilot. |
| 14 | **Crowded Field Acoustics** | <span style="color:goldenrod;font-weight:bold;">YELLOW</span> | Lab simulated (Fan + Noise Floor) | Tested up to 65 dB ambient lab noise; acoustic validation in crowded rural PHC waiting rooms ($75 - 85\text{ dBA}$) pending Stage-1 pilot. |

---

## 3. Gate Conclusion & Recommendations

$$\textbf{OVERALL STAGE-1 FIELD GATE: GREEN (FOR SUPERVISED PILOT)}$$

### Summary of Deployment Approval:
1. **Ready for Field Deployment:** The core software pipeline, offline storage, PWA caching, clinical safety, and conversational turn control are **100% GREEN**.
2. **Supervised Operational Scope:** The Stage-1 pilot must be conducted under the supervision of designated field operators or researchers using the runbook (`docs/S2S_FIELD_PILOT_RUNBOOK.md`) and pre-flight checklist (`docs/S2S_FIELD_DEPLOYMENT_CHECKLIST.md`).
3. **Hardware Evidence Gathering:** The physical hardware indicators classified as **YELLOW** (physical Android thermal/battery and crowded PHC acoustics) will be directly observed and converted to GREEN during the supervised pilot using the field results template (`docs/S2S_FIELD_RESULTS_TEMPLATE.md`).
4. **No Critical Red Flags:** There are zero **RED** blockers. The system fails gracefully in all tested failure conditions.
