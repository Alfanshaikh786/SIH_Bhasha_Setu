# Mundari Machine Translation Research Pipeline (Phase 4A)

> [!IMPORTANT]
> **Experimental Research Pipeline Only**  
> This is an experimental research pipeline. It does NOT modify the production Bhasha Setu translation system.
> All code, datasets, audits, and baselines are completely isolated within the `/research/` directory.

---

## 1. Purpose
The purpose of Phase 4A is to establish an empirical, scientific research foundation for **Mundari (ISO 639-3: `unr`) <-> Hindi (`hi`)** machine translation before committing to production changes or expensive neural model training.

### Key Objectives:
1. Decouple Mundari language from scripts (Devanagari, Nag Mundari, Latin) and reject Santali (Ol Chiki) contamination.
2. Acquire and audit the authentic **MMLoSo 2025 / AdiBhashaa** benchmark dataset (Ministry of Tribal Affairs, Govt of India).
3. Establish reproducible Train / Val / Test splits (80% / 10% / 10%).
4. Build a transparent Exact + Fuzzy Sentence Retrieval baseline.
5. Benchmark public models (mBART-50, Aya-23 LoRA, IndicTrans2).
6. Provide an English pivot routing architecture (`English -> Hindi -> Mundari`).

---

## 2. Directory Structure

```text
research/
│
├── mundari-mt/
│   ├── script_detector.py      # Dynamic script detection & Santali (Olck) filter
│   ├── dataset_loader.py       # Dataset loader with Unicode NFC normalization
│   ├── retrieval_baseline.py   # Exact match & RapidFuzz retrieval baseline
│   ├── provider.py             # Translation provider registry & routing
│   ├── benchmark_models.py     # Candidate model audit & hardware feasibility
│   ├── requirements.txt        # Minimal research dependencies
│   └── README.md               # Pipeline documentation
│
├── dataset-audit/
│   ├── audit_mundari_dataset.py # Diagnostic audit script
│   └── DATASET_QUALITY_REPORT.md# Empirical dataset quality report
│
├── model-evaluation/
│   └── evaluate_metrics.py     # SacreBLEU, chrF2++, Exact Match suite
│
├── datasets/
│   └── mundari/
│       ├── README.md           # Dataset documentation
│       ├── mundari-train.csv   # Raw 20,000 parallel pairs (MMLoSo 2025)
│       ├── train.csv           # 16,000 training pairs (80%)
│       ├── val.csv             # 2,000 validation pairs (10%)
│       ├── test.csv            # 2,000 held-out test pairs (10%)
│       └── split_metadata.json # Split metadata (seed 42)
│
└── MUNDARI_PHASE4A_FINAL_REPORT.md # Comprehensive final research findings
```

---

## 3. Dataset Placement Instructions
The authentic MMLoSo 2025 Mundari dataset is located at:
```text
research/datasets/mundari/mundari-train.csv
```
Schema: `row_id`, `Hindi`, `Mundari`.

If updating or placing new datasets, ensure:
1. File is UTF-8 encoded CSV.
2. Required columns `Hindi` and `Mundari` are present.
3. No Santali Ol Chiki text is included.

---

## 4. Installation Instructions

Using the project Python environment:
```bash
pip install -r research/mundari-mt/requirements.txt
```

---

## 5. Usage & Commands

### A. Dynamic Script Detector
Detects Devanagari (`Deva`), Nag Mundari (`Nagm`), Latin (`Latn`), and flags Santali Ol Chiki (`Olck`):
```bash
python research/mundari-mt/script_detector.py
```

### B. Empirical Dataset Audit
Computes basic statistics, duplicates, script distributions, length distributions, and writes `DATASET_QUALITY_REPORT.md`:
```bash
python research/dataset-audit/audit_mundari_dataset.py
```

### C. Retrieval Baseline & Held-Out Evaluation
Splits data (80/10/10 with seed 42) and runs exact + fuzzy retrieval on held-out test sentences:
```bash
python research/mundari-mt/retrieval_baseline.py
```

### D. Metric Evaluation Suite
Tests SacreBLEU, chrF2++, Exact Match Accuracy, and Length Ratio:
```bash
python research/model-evaluation/evaluate_metrics.py
```

### E. Existing Model Audit
Audits accessibility, parameter sizes, and hardware requirements of public candidate models:
```bash
python research/mundari-mt/benchmark_models.py
```

### F. Translation Provider & English Pivot
Executes queries against the translation provider with explicit route metadata:
```bash
python research/mundari-mt/provider.py
```

---

## 6. Research Limitations & Honesty Principles
1. **Retrieval Baseline Generalization:** The retrieval baseline achieves 100% fidelity on in-sample sentences, but 0.4% coverage and 0.0 BLEU on held-out unseen sentences. Open-vocabulary translation requires neural parametric models.
2. **English Translation Route:** Direct English <-> Mundari models are not yet trained. English translation is provided via 2-hop pivot: `English -> Hindi -> Mundari`.
3. **Hardware Constraints:** 8B parameter models (e.g. Aya-23 LoRA) require 24 GB VRAM and cannot be deployed on local client devices. Mobile/edge deployment requires lightweight encoder-decoder models (e.g. IndicTrans2 200M or NLLB-200 600M quantized to ONNX INT8).
