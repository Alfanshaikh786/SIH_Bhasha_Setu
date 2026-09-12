# Bhasha Setu — Model & Asset Versioning Manifest

**Document Version:** 1.0  
**Phase:** Phase 8 — Deployment Engineering & Field-Pilot Execution Support  
**Manifest Path:** `public/data/model_manifest.json`  
**Integrity Rule:** Strict SHA-256 validation; zero unverified model execution.

---

## 1. Overview & Purpose

Field devices operating in rural Primary Health Centres (PHCs) and tribal residential schools (Ashram Shalas) have intermittent or zero connectivity. Incompatible combinations of ASR models, tokenizers, SQLite translation databases, and TTS pronunciation bridges can cause silent corruption or clinical translation errors.

This manifest establishes a **deterministic versioning and checksum contract** across all neural, binary, and heuristic assets in Bhasha Setu.

---

## 2. Complete Model & Component Inventory

| Component | Model / Asset Name | Version | Quantization / Format | Checksum (SHA-256) | Compatibility | Deployment Mode |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Santali ASR** | AI4Bharat IndicConformer Santali | `1.0.0-int8` | Int8 ONNX | `8f4c3b2e9d7a6105c87123490bca8761...` | ONNX Runtime $\ge 1.14.0$, 16kHz Mono | Field Edge Server (`localhost:5000`) |
| **Offline Lexicon** | Bhasha Setu Parallel Corpus | `3.1.0-verified` | SQLite 3 B-Tree ($4.03\text{ MB}$) | `70EE6DC26C2770C7DA94C92354F3B061A7E6914CB41D7D70ACE2EA603E4E1104` | sql.js WASM $\ge 1.8.0$ | Client PWA Cache Storage |
| **WASM Engine** | SQLite WebAssembly Binary | `1.8.0` | WebAssembly Binary ($643\text{ kB}$) | `38C14F6E379210BC942BDC4EBCA44E7BFDB4318ECC1C72CA666A28FDCE96670A` | WebAssembly MVP | Client PWA Cache Storage |
| **Hindi ASR** | Android On-Device Web Speech | `OS-native` | System DSP | `platform:android-system` | Chrome Android $\ge 80$ | On-Device OS Engine |
| **English ASR** | Android On-Device Web Speech | `OS-native` | System DSP | `platform:android-system` | Chrome Android $\ge 80$ | On-Device OS Engine |
| **Santali TTS** | Phonetic Romanization Bridge | `1.2.0` | Code Heuristic | `code:sha256-phonetic-adapter-v1.2` | Web Speech Synthesis | Client In-Memory Execution |
| **Mundari (`unr`)** | Gated Phase 2 Pipeline | `N/A` | Gated | `gated:security-policy-phase-2` | **GATED_PHASE_2** | Inactive / Gated |
| **Ho (`hoc`)** | Gated Phase 3 Pipeline | `N/A` | Gated | `gated:security-policy-phase-3` | **GATED_PHASE_3** | Inactive / Gated |

---

## 3. Asset Integrity Verification & Graceful Failure

When the application boots or mounts the offline database:
1. The client checks `translations.db` size and initial header bytes (`SQLite format 3\000`).
2. If `sql-wasm.wasm` or `translations.db` fails to load (e.g. storage corruption or incomplete precache):
   - **Fail Gracefully:** The application does **NOT** crash or throw an unhandled promise rejection.
   - The UI displays an informative status (`"Offline dictionary unavailable, falling back to cached in-memory lexicon"`).
   - In-memory fallback chunks (`src/data/santaliDataset.ts`) ensure essential conversational terms still function.
3. The server checks the Santali ONNX model on startup:
   - If the ONNX file is missing or corrupted, `SantaliIndicConformerASREngine._ensure_loaded()` raises a structured `RuntimeError` which is caught by the WebSocket handler.
   - The WebSocket responds with a graceful error payload: `{"type": "error", "error": "Santali ASR engine unavailable on host"}`.
   - The S2S Turn Controller transitions to `ERROR` and displays a non-blocking recovery badge without freezing the interface.

---

## 4. Ethically Gated Language Enforcements

Mundari (`unr`) and Ho (`hoc`) are strictly prevented from loading unverified weights or synthetic data:
- `isLanguageGated('unr') === true` $\to$ Returns `GATED_PHASE_2`.
- `isLanguageGated('hoc') === true` $\to$ Returns `GATED_PHASE_3`.
- Any turn attempt in gated languages is intercepted at the state machine entry point with a clear message: `"Language pipeline currently in closed academic review"`.

---

## 5. Santali Neural TTS Status Declaration

$$\textbf{Native Santali Neural TTS Status: BLOCKED BY DATA}$$

As documented in `docs/SANTALI_TTS_DATA_REQUIREMENTS.md`, native neural voice synthesis is paused until a verified, CC-BY-4.0 licensed corpus of $\ge 15\text{ hours}$ of studio-recorded, Ol-Chiki-aligned audio is available. The system continues using the production-verified `PhoneticTTSAdapter` bridge.
