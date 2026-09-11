# Bhasha Setu (भाषा | SETU) — Engineering Freeze Candidate Status
**Document Classification:** Engineering Freeze Candidate  
**Date:** September 11, 2026  
**Git Baseline Commit:** `c509604d5282baee48ca15f611c5e0b44d50ff99`  
**Platform Status:** PRODUCTION DEFENSIBLE • CODE FROZEN FOR SIH PRESENTATION  

---

## 1. Project Freeze Overview
The engineering architecture of **Bhasha Setu (भाषा | SETU)** is formally frozen at this baseline. No new features, model weights, or language targets will be introduced prior to final Smart India Hackathon (SIH) presentation and judging.

All systems are validated against automated regression assertions, authentic linguistic benchmarks, and zero-hallucination capability tests.

---

## 2. Core Specification & Metrics

| Specification Area | Metric / Value | Verification Status |
| :--- | :--- | :---: |
| **Final Dataset Size** | **6,780 parallel Santali records** | ✅ 100% Preserved |
| **Initial JS Bundle Size** | **68.51 kB** (gzip: **13.92 kB**) | ✅ PASS (< 120 kB) |
| **Isolated Santali Chunk** | **2,139.35 kB** (gzip: **234.29 kB**) | ✅ On-Device Chunk |
| **Text-to-Text Studio Chunk** | **47.04 kB** (gzip: **12.28 kB**) | ✅ PASS (< 80 kB) |
| **Automated Pipeline Tests** | **82 Passed, 0 Failed** | ✅ PASS |
| **Evidence Provenance Tests** | **38 Passed, 0 Failed** | ✅ PASS |
| **Mobile Viewport Tests** | **15 Passed, 0 Failed** | ✅ PASS |
| **Unsupported Language Fabrication Count** | **Strictly 0 (Zero Hallucinations)** | ✅ PASS |
| **Exact Benchmark Retrieval (En $\to$ Sat)** | **277 / 280 (98.93%)** | ✅ 8 of 9 Categories 100% |
| **Exact Benchmark Retrieval (Sat $\to$ En)** | **280 / 280 (100.00%)** | ✅ 100% Reverse Match |
| **Exact Benchmark Retrieval (Hi $\to$ Sat)** | **278 / 280 (99.29%)** | ✅ PASS |
| **Ol Chiki Script Integrity Rate** | **280 / 280 (100.00%)** | ✅ Unicode `U+1C50–U+1C7F` |
| **Roman Phonetic Guide Coverage** | **280 / 280 (100.00%)** | ✅ 100% Pronunciation Guides |

---

## 3. Final Supported vs. Unsupported Capabilities

### A. Supported Capabilities (Production Ready)
- **Santali Full-Sentence Translation**: Bidirectional (English ↔ Santali and Hindi ↔ Santali) backed by 6,780 verified records.
- **Orthographic & Script Display**: Native Ol Chiki Unicode, Roman phonetic pronunciation guides, and Devanagari matra representations.
- **On-Device Zero-Network Querying**: Sub-millisecond in-memory lookups (2.4 µs) and SQLite WASM sandbox execution (0.31 ms).
- **Translation Evidence Provenance**: Live HUD displaying Row ID, provider layer, retrieval method, and offline status.
- **Contextual Domain Disambiguation**: Domain weighting (+0.08 bonus) and collision guards for polysemous terms.
- **PWA Standalone Execution**: Service worker cache-first precaching on mobile screens (360×800 to 412×915).
- **Human Evaluation Lifecycle**: Reviewer rating, nuance tagging, and structured JSON export.

### B. Unsupported Capabilities (Strictly Gated with Zero Hallucination)
- **Mundari Full-Sentence Translation**: Gated to `null` with `"Model Pending"` notice. Word-level vocabulary assistance active.
- **Ho Full-Sentence Translation**: Gated to `null` with `"Model Pending"` notice. Word-level vocabulary assistance active.
- **Native Tribal Neural TTS**: Browser engines lack native Ol Chiki acoustic models. Pronunciation synthesized via Roman phonetic guides using Indian system voices.
- **On-Device Neural Model Weights**: Contract interface ready (`onnxModelService.ts`); active weights not bundled to maintain 68.5 kB bundle size.

---

## 4. Hardware & Testing Disclosure

| Testing Domain | Status | Methodology & Disclosure |
| :--- | :---: | :--- |
| **Physical Android Hardware** | **NOT PERFORMED** | No physical Android device or `adb` USB/Wi-Fi bridge connected to host. |
| **Mobile Viewport Emulation** | **VERIFIED** | Automated assertions across 360×800, 390×844, and 412×915 viewports. |
| **Airplane Mode Verification** | **SIMULATED** | Tested via browser offline state (`navigator.onLine === false`) and API blockades. |
| **Client Data Privacy** | **VERIFIED** | 0 external network packets transmitted during offline translation. |

---

## 5. Reproduction & Build Commands

```bash
# 1. Run complete primary test suite (82 assertions)
npm test

# 2. Run authentic 280-sample Santali benchmark
npm run evaluate:santali

# 3. Verify zero-hallucination and fuzzy collision guards
npm run test:hallucination

# 4. Audit translation evidence provenance across all 5 provider paths
npm run audit:evidence

# 5. Verify mobile viewport and PWA constraints
npm run validate:device

# 6. Check bundle performance regression thresholds
npm run check:regression

# 7. Compile production bundle
cmd /c npm run build
```

---

## 6. Freeze Candidate Confirmation
The codebase at git commit `c509604d5282baee48ca15f611c5e0b44d50ff99` meets all requirements for an **Engineering Freeze Candidate**. All features are stable, claims are empirically backed, and the platform is ready for Smart India Hackathon presentation.
