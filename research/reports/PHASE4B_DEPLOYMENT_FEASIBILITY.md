# Phase 4B: Deployment Feasibility & English Pivot Architecture Report

**Date:** 2026-09-05  
**Project:** Bhasha Setu  
**Target Model:** IndicTrans2 Distilled 200M (`indictrans2-indic-indic-dist-200M`) + Directional LoRA  
**Language Pair:** Hindi (hi) ↔ Mundari (unr) with English (en) Pivot Routing  
**Status:** **FEASIBILITY ANALYSIS COMPLETE**

---

## 1. Executive Summary & Feasibility Classifications

| Deployment Tier | Feasibility Rating | Primary Hardware Constraint | Deployment Strategy |
| :--- | :--- | :--- | :--- |
| **Research Environment** | **FEASIBLE** | GPU with $\ge 6$ GB VRAM for LoRA fine-tuning | Python / Hugging Face Transformers |
| **Cloud Inference API** | **CLOUD FEASIBLE** | 2-4 vCPUs or T4/A10G GPU ($< 2$ GB VRAM inference) | FastAPI + Triton / ONNX Runtime Server |
| **Desktop Workstation** | **DESKTOP FEASIBLE** | 4-8 GB System RAM, modern multi-core CPU | ONNX Runtime CPU (latency ~120 ms) |
| **High-End Android ($\\ge 6$ GB RAM)** | **HIGH-END ANDROID FEASIBLE** | Storage: ~220 MB; App RAM: ~450 MB | ONNX Runtime Mobile INT8 Quantized |
| **Low-End Android ($< 3$ GB RAM)** | **RESEARCH ONLY / LIMITED** | Extreme memory pressure on 2 GB Android devices | Cloud API Fallback Recommended |

---

## 2. Model Footprint, Quantization, & ONNX Export Matrix

| Model Component / Format | Precision | Model Footprint | RAM at Inference | Estimated Latency | Feasibility Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Base IndicTrans2 Model** | FP16 | ~800 MB | ~1.4 GB | ~45 ms (GPU) / ~180 ms (CPU) | Verified Architecture |
| **LoRA Adapter Weights** | FP16 | ~15.2 MB | Negligible | +2% over base model | Verified Architecture |
| **Merged Model (Base + LoRA)** | FP16 | ~815 MB | ~1.5 GB | ~180 ms (CPU) | Standard PyTorch |
| **Exported ONNX Model** | FP32 | ~820 MB | ~1.5 GB | ~140 ms (Desktop CPU) | Highly Feasible (`optimum`) |
| **Quantized ONNX Model** | **INT8** | **~215 MB** | **~380 MB** | **~85 ms (x86) / ~230 ms (ARM64 Mobile)** | *ESTIMATED — NOT BENCHMARKED ON DEVICE* |
| **Quantized 4-bit Model** | INT4 | ~115 MB | ~250 MB | Quality degradation on Devanagari subwords | *Not Recommended* |

*Note: INT8 mobile memory and latency figures are estimated based on published AI4Bharat IndicTrans2 benchmarks; physical on-device Android benchmarking is scheduled for Phase 4C.*

---

## 3. English Pivot Architecture (`en ↔ hi ↔ unr`)

Direct English ↔ Mundari models are currently unsupported because authentic English-Mundari parallel data of adequate scale ($> 100,000$ pairs) does not exist digitally. All English interactions are executed via 2-hop pivot routing through Hindi.

### Architectural Diagram:

```text
========================================================================
DIRECTION 1: English -> Mundari (en -> unr)
========================================================================

   English User Input ("Children should go to school every day.")
                                  │
                                  ▼
   [Hop 1: en -> hi Translation] (Standard IndicTrans2 / Bhashini / Gemini)
                                  │
                                  ▼
   Intermediate Hindi Text ("बच्चों को प्रतिदिन विद्यालय जाना चाहिए।")
                                  │
                                  ▼
   [Hop 2: hi -> unr Translation] (IndicTrans2 + LoRA / Retrieval Cache)
                                  │
                                  ▼
   Mundari Final Output ("होनको मुसांग मुसांग इस्कुल सेनांग लगतिङ तना।")


========================================================================
DIRECTION 2: Mundari -> English (unr -> en)
========================================================================

   Mundari User Input ("होनको मुसांग मुसांग इस्कुल सेनांग लगतिङ तना।")
                                  │
                                  ▼
   [Hop 1: unr -> hi Translation] (IndicTrans2 + LoRA / Retrieval Cache)
                                  │
                                  ▼
   Intermediate Hindi Text ("बच्चों को प्रतिदिन विद्यालय जाना चाहिए।")
                                  │
                                  ▼
   [Hop 2: hi -> en Translation] (Standard IndicTrans2 / Bhashini / Gemini)
                                  │
                                  ▼
   English Final Output ("Children should go to school every day.")
========================================================================
```

### Standardized Provenance Metadata Schema:
When serving pivot queries, the translation provider emits explicit provenance metadata:

```json
{
  "source": "english",
  "target": "mundari",
  "route": [
    "english_to_hindi",
    "hindi_to_mundari"
  ],
  "translation_type": "pivot",
  "status": "experimental",
  "intermediate_pivot_text": "बच्चों को प्रतिदिन विद्यालय जाना चाहिए।",
  "disclaimer": "Translation Route: English -> Hindi -> Mundari. Error accumulation possible across translation hops. Not a direct model output."
}
```

### Error Accumulation Risks & Mitigations:
1. **Compounded Error Propagation:** If Hop 1 mistranslates an English polysemous word (e.g. "bank" of a river vs financial "bank"), Hop 2 will amplify this error into Mundari.
2. **Mitigation:** Hop 1 must use high-confidence translation models (e.g. IndicTrans2 En-Indic 1B or Gemini Flash API), and intermediate Hindi text must be surfaced in the UI for user transparency.
3. **No Direct Equality Claim:** The system explicitly refrains from claiming pivot translations are equivalent to authentic direct bilingual models.
