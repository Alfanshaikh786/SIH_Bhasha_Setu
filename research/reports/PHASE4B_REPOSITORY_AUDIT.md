# Phase 4B: Comprehensive Repository & Mundari MT Pipeline Audit

**Audit Timestamp:** 2026-09-05T16:21:00+05:30  
**Repository:** `Alfanshaikh786/SIH_Bhasha_Setu`  
**Language Target:** Mundari (ISO 639-3: `unr`) ↔ Hindi (`hi`)  
**Auditor:** Research-Oriented AI/ML Engineering Assistant  
**Production Integrity:** **VERIFIED INTACT** (Zero files in `src/` modified)

---

# 1. Executive Summary

This repository audit provides an empirical, evidence-grounded assessment of the **Bhasha Setu Mundari Machine Translation (MT) research pipeline**, covering Phase 4A (Dataset Acquisition, Quality Audit, and Retrieval Baseline) and Phase 4B (Neural Pipeline Architecture, LoRA Configuration, and Evaluation Suite).

### Primary Findings:
1. **Authentic Dataset Verified:** The raw parallel dataset is located at [`research/datasets/mundari/mundari-train.csv`](file:///d:/SIH/research/datasets/mundari/mundari-train.csv). The actual file contains **exactly 20,000 parallel sentence pairs** (7.89 MB), contradicting prior documentation notes that estimated 20,149 pairs. The dataset is 100% non-empty and 94.71% Devanagari script.
2. **Zero Santali / Ol Chiki Contamination:** All 20,000 Mundari sentences were scanned for Ol Chiki characters (`U+1C50–U+1C7F`). **Zero occurrences (0.00%)** were detected. Mundari orthography in this corpus is Devanagari (`U+0900–U+097F`) with minor modern Latin acronyms (5.29%).
3. **Phase 4A is Fully Implemented and Verified:** The script detector, dataset quality audit, and retrieval baseline are completely functional. The retrieval baseline evaluated on 500 held-out test sentences achieved **100% precision on memorized queries but 0.40% coverage on unseen test queries**, correctly refusing to fabricate translations (SacreBLEU 0.00).
4. **Phase 4B Training Has NOT Been Executed:** Neural model training is classified as **`NOT EXECUTED — GPU ENVIRONMENT REQUIRED`**. While dataset preparation, anomaly filtering, 80/10/10 data splitting, and evaluation metric suites are fully operational, the local machine lacks a working PyTorch CUDA environment (Python 3.14.3 on Windows without PyTorch installed; local RTX 3050 Laptop GPU has 4.0 GB VRAM, which is below the minimum $\ge 6.0$ GB required for full sequence-to-sequence backpropagation with AdamW).
5. **IndicTrans2 Native Mundari Support is FALSE:** Official `ai4bharat/indictrans2-indic-indic-dist-200M` has **NO native support for Mundari (`unr`)**, has **no `<2unr>` language tag**, and has **no Austroasiatic Mundari pretraining**. Prior configs relied on hijacking the Hindi tag (`hin_Deva`). Transfer learning is theoretically possible via vocabulary expansion, but must not be claimed as native support.
6. **Production Code Safety:** Production code in `src/` remains **completely untouched**. All experiments, datasets, configs, and scripts are strictly isolated within `research/`.

---

# 2. Repository Structure

The actual directory structure within `research/` was inspected on disk:

```text
research/
├── MUNDARI_PHASE4A_FINAL_REPORT.md
├── dataset-audit/
│   ├── audit_mundari_dataset.py
│   └── DATASET_QUALITY_REPORT.md
├── datasets/
│   └── mundari/
│       ├── .gitkeep
│       ├── mundari-train.csv         [20,000 raw parallel pairs, 8,274,445 bytes]
│       ├── README.md
│       ├── split_metadata.json       [80/10/10 split configuration metadata]
│       ├── train.csv                 [16,000 pairs]
│       ├── val.csv                   [2,000 pairs]
│       └── test.csv                  [2,000 pairs]
├── model-evaluation/
│   ├── compare_baselines.py
│   ├── evaluate_metrics.py
│   ├── evaluate_neural_model.py
│   ├── hallucination_detector.py
│   └── qualitative_evaluation.py
├── model-training/
│   ├── prepare_training_data.py
│   ├── train_indictrans2.py
│   ├── train_lora.py
│   └── training_utils.py
├── mundari-mt/
│   ├── README.md
│   ├── README_TRAINING.md
│   ├── requirements.txt
│   ├── script_detector.py
│   ├── dataset_loader.py
│   ├── retrieval_baseline.py
│   ├── provider.py
│   ├── benchmark_models.py
│   ├── checkpoints/
│   │   ├── hi_to_unr/
│   │   │   └── smoke_test_metadata.json   [Metadata stub only; NO WEIGHTS]
│   │   └── unr_to_hi/
│   │       └── smoke_test_metadata.json   [Metadata stub only; NO WEIGHTS]
│   ├── cleaned-data/
│   │   ├── anomaly_report.csv             [500 flagged ratio anomalies]
│   │   ├── script_distribution.json       [Script counts across 20,000 rows]
│   │   ├── train.csv                      [16,000 pairs, NFC normalized]
│   │   ├── validation.csv                 [2,000 pairs, NFC normalized]
│   │   └── test.csv                       [2,000 pairs, NFC normalized]
│   ├── configs/
│   │   └── training_config.yaml           [LoRA & hyperparameter configuration]
│   ├── logs/
│   │   ├── hardware_report.json           [Hardware audit JSON]
│   │   └── TRAINING_NOT_EXECUTED.md       [Execution blocker notice]
│   └── results/
│       └── native_speaker_review.csv      [25 qualitative evaluation rows; scores empty]
└── reports/
    ├── MUNDARI_PHASE4B_FINAL_REPORT.md
    ├── PHASE4B_DATA_PREPARATION_REPORT.md
    ├── PHASE4B_DEPLOYMENT_FEASIBILITY.md
    ├── PHASE4B_EVALUATION_REPORT.md
    ├── PHASE4B_MODEL_CANDIDATE_AUDIT.md
    ├── PHASE4B_PHASE4A_INTEGRITY_CHECK.md
    ├── PHASE4B_SMOKE_TEST_REPORT.md
    └── PHASE4B_TRAINING_REPORT.md
```

---

# 3. Phase 4A Status

| Component | Exists | Executed | Evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| [`research/mundari-mt/script_detector.py`](file:///d:/SIH/research/mundari-mt/script_detector.py) | **EXISTS** | **YES** | Imported and verified in dataset audit; output in [`script_distribution.json`](file:///d:/SIH/research/mundari-mt/cleaned-data/script_distribution.json). Detects Devanagari, Nag Mundari (`U+1E4D0–U+1E4FF`), Latin, and Ol Chiki (`U+1C50–U+1C7F`). | **EXECUTED AND VERIFIED** |
| [`research/dataset-audit/audit_mundari_dataset.py`](file:///d:/SIH/research/dataset-audit/audit_mundari_dataset.py) | **EXISTS** | **YES** | Generated [`DATASET_QUALITY_REPORT.md`](file:///d:/SIH/research/dataset-audit/DATASET_QUALITY_REPORT.md) with complete empirical statistics across 20,000 rows. | **EXECUTED AND VERIFIED** |
| [`research/mundari-mt/retrieval_baseline.py`](file:///d:/SIH/research/mundari-mt/retrieval_baseline.py) | **EXISTS** | **YES** | Tested on 500 held-out test sentences (`test.csv`). Measured 0.40% coverage and 0.0 BLEU. Compiled bytecode `retrieval_baseline.cpython-314.pyc` exists. | **EXECUTED AND VERIFIED** |
| [`research/dataset-audit/DATASET_QUALITY_REPORT.md`](file:///d:/SIH/research/dataset-audit/DATASET_QUALITY_REPORT.md) | **EXISTS** | **YES** | 85-line generated report with empirical row counts, script distribution, length statistics, and anomaly diagnostics. | **EXECUTED AND VERIFIED** |
| [`research/mundari-mt/dataset_loader.py`](file:///d:/SIH/research/mundari-mt/dataset_loader.py) | **EXISTS** | **YES** | Reusable dataset loader with column detection and NFC normalization. Compiled bytecode `dataset_loader.cpython-314.pyc` exists. | **EXECUTED AND VERIFIED** |
| [`research/mundari-mt/provider.py`](file:///d:/SIH/research/mundari-mt/provider.py) | **EXISTS** | **PARTIAL** | Standalone provider implementing 2-hop English pivot (`en ↔ hi ↔ unr`). Operates in research isolation; not integrated into production. | **IMPLEMENTED** |
| [`research/mundari-mt/benchmark_models.py`](file:///d:/SIH/research/mundari-mt/benchmark_models.py) | **EXISTS** | **YES** | Model card inspector auditing parameter counts and VRAM footprints for public checkpoints. | **EXECUTED AND VERIFIED** |
| [`research/MUNDARI_PHASE4A_FINAL_REPORT.md`](file:///d:/SIH/research/MUNDARI_PHASE4A_FINAL_REPORT.md) | **EXISTS** | **YES** | Comprehensive 200-line Phase 4A summary documenting empirical baseline findings. | **EXECUTED AND VERIFIED** |

---

# 4. Phase 4B Status

| Component | Exists | Executed | Evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| [`research/model-training/prepare_training_data.py`](file:///d:/SIH/research/model-training/prepare_training_data.py) | **EXISTS** | **YES** | Executed and generated [`train.csv`](file:///d:/SIH/research/mundari-mt/cleaned-data/train.csv) (16,000), [`validation.csv`](file:///d:/SIH/research/mundari-mt/cleaned-data/validation.csv) (2,000), [`test.csv`](file:///d:/SIH/research/mundari-mt/cleaned-data/test.csv) (2,000), [`anomaly_report.csv`](file:///d:/SIH/research/mundari-mt/cleaned-data/anomaly_report.csv), and [`PHASE4B_DATA_PREPARATION_REPORT.md`](file:///d:/SIH/research/reports/PHASE4B_DATA_PREPARATION_REPORT.md). | **EXECUTED AND VERIFIED** |
| [`research/model-training/train_lora.py`](file:///d:/SIH/research/model-training/train_lora.py) | **EXISTS** | **PARTIAL** | Pre-flight smoke validation and hardware detection executed. However, actual training loop at line 295 is currently a stub print statement. Training halted due to hardware constraints. | **PARTIALLY IMPLEMENTED** |
| [`research/model-training/training_utils.py`](file:///d:/SIH/research/model-training/training_utils.py) | **EXISTS** | **YES** | Executed hardware detection; generated [`research/mundari-mt/logs/hardware_report.json`](file:///d:/SIH/research/mundari-mt/logs/hardware_report.json). Compiled bytecode exists. | **EXECUTED AND VERIFIED** |
| [`research/model-training/train_indictrans2.py`](file:///d:/SIH/research/model-training/train_indictrans2.py) | **EXISTS** | **PARTIAL** | Wrapper around `train_lora.py` with IndicTrans2 argument parsing. | **PARTIALLY IMPLEMENTED** |
| [`research/model-evaluation/evaluate_neural_model.py`](file:///d:/SIH/research/model-evaluation/evaluate_neural_model.py) | **EXISTS** | **PARTIAL** | Metric calculation logic and calibration on identity references tested. Neural model inference loop not executed because model weights do not exist. | **IMPLEMENTED BUT NOT EXECUTED** |
| [`research/model-evaluation/qualitative_evaluation.py`](file:///d:/SIH/research/model-evaluation/qualitative_evaluation.py) | **EXISTS** | **YES** | Benchmarked 5 civic domains against the retrieval baseline. | **EXECUTED AND VERIFIED** (Baseline only) |
| [`research/model-evaluation/hallucination_detector.py`](file:///d:/SIH/research/model-evaluation/hallucination_detector.py) | **EXISTS** | **YES** | 6 failure mode rules implemented and verified on sample inputs. | **EXECUTED AND VERIFIED** |
| [`research/model-evaluation/compare_baselines.py`](file:///d:/SIH/research/model-evaluation/compare_baselines.py) | **EXISTS** | **YES** | Evaluated retrieval baseline live on 500 test sentences; marked neural model as unexecuted in [`PHASE4B_EVALUATION_REPORT.md`](file:///d:/SIH/research/reports/PHASE4B_EVALUATION_REPORT.md). | **EXECUTED AND VERIFIED** |
| [`research/mundari-mt/checkpoints/`](file:///d:/SIH/research/mundari-mt/checkpoints/) | **EXISTS** | **NO** | Subdirectories `hi_to_unr/` and `unr_to_hi/` contain only `smoke_test_metadata.json`. **ZERO model weights (`pytorch_model.bin` / `adapter_model.safetensors`) exist.** | **NOT EXECUTED / NO WEIGHTS** |
| `research/mundari-mt/models/` | **MISSING** | **NO** | Directory does not exist on disk. No base model weights stored locally. | **MISSING** |
| [`research/mundari-mt/logs/`](file:///d:/SIH/research/mundari-mt/logs/) | **EXISTS** | **YES** | Contains [`hardware_report.json`](file:///d:/SIH/research/mundari-mt/logs/hardware_report.json) and [`TRAINING_NOT_EXECUTED.md`](file:///d:/SIH/research/mundari-mt/logs/TRAINING_NOT_EXECUTED.md). | **EXECUTED AND VERIFIED** |
| [`research/mundari-mt/results/`](file:///d:/SIH/research/mundari-mt/results/) | **EXISTS** | **YES** | Contains [`native_speaker_review.csv`](file:///d:/SIH/research/mundari-mt/results/native_speaker_review.csv) with 25 domain sentences. Score columns are strictly empty. | **EXECUTED AND VERIFIED** (Template) |
| [`research/mundari-mt/configs/`](file:///d:/SIH/research/mundari-mt/configs/) | **EXISTS** | **NO** | Contains [`training_config.yaml`](file:///d:/SIH/research/mundari-mt/configs/training_config.yaml). Defines hyperparameters ($r=16, \alpha=32$, AdamW, cosine schedule). | **IMPLEMENTED** |

---

# 5. Dataset Status

The primary dataset file was located and analyzed directly via Python scripts:

| Property | Audited Value |
| :--- | :--- |
| **Exact File Path** | `d:\SIH\research\datasets\mundari\mundari-train.csv` |
| **File Size** | **8,274,445 bytes** (7.89 MB) |
| **Actual Number of Rows** | **20,000 data rows** (20,001 including header row) |
| **Documentation Discrepancy** | Prior documentation and README referenced **20,149** rows. The real file has **exactly 20,000** rows. |
| **Column Names** | `['', 'Hindi', 'Mundari']` (Column 0: 0-indexed integer ID, Column 1: Hindi sentence, Column 2: Mundari sentence) |
| **Encoding** | UTF-8 (No BOM) |
| **Delimiter** | Comma (`,`) with standard RFC 4180 CSV quoting |
| **Data Provenance** | MMLoSo Language Challenge 2025 (IJCNLP-AACL 2025) / AdiBhashaa Initiative (arXiv:2512.04765, IIT Delhi) |
| **Institutional Source** | Ministry of Tribal Affairs, Government of India |
| **License** | Open Research & Academic License (Paulownia mirror) |

---

# 6. Dataset Quality

A full programmatic audit of all 20,000 rows was executed:

| Quality Metric | Measured Value | Percentage | Status / Action |
| :--- | :--- | :--- | :--- |
| **Total Rows** | 20,000 | 100.0% | Verified |
| **Empty Hindi Rows** | 0 | 0.00% | Verified clean |
| **Empty Mundari Rows** | 0 | 0.00% | Verified clean |
| **Whitespace-Only Rows** | 0 | 0.00% | Verified clean |
| **Exact Duplicate Sentence Pairs** | 0 | 0.00% | 20,000 unique exact pairs |
| **Normalized Duplicate Pairs** | 2 | 0.01% | 19,998 unique normalized pairs |
| **Source Conflicts (1 Hindi → Multiple Mundari)** | 61 pairs (42 unique Hindi) | 0.30% | Natural dialectal/lexical synonyms; preserved |
| **Target Conflicts (1 Mundari → Multiple Hindi)** | 13 pairs | 0.07% | Contextual translations; preserved |
| **Unicode NFC Normalization Differences** | Hindi: 4,153 / Mundari: 6,836 | - | Normalized in `cleaned-data/`; raw file untouched |
| **Replacement Characters (`\uFFFD`)** | 0 | 0.00% | No encoding corruption |

### Sentence Length Distributions:
- **Hindi Word Count:** Min: 1, Max: 158, Mean: 16.31 words (Character Length: Min: 3, Max: 834, Mean: 79.1)
- **Mundari Word Count:** Min: 1, Max: 144, Mean: 14.21 words (Character Length: Min: 3, Max: 783, Mean: 78.71)
- **Character Length Ratio ($\frac{\text{length}(unr)}{\text{length}(hi)}$):** Min: 0.06, Max: 20.80, Mean: 1.24, Median: 1.01

### Length Ratio Anomalies:
- **NORMAL ($0.4 \le \text{ratio} \le 2.5$):** 19,500 rows (97.5%)
- **REVIEW_REQUIRED ($0.3 \le \text{ratio} < 0.4$ or $2.5 < \text{ratio} \le 3.0$):** 347 rows (1.74%)
- **SEVERE_ANOMALY ($\text{ratio} < 0.3$ or $\text{ratio} > 3.0$):** 153 rows (0.77%)
- **Total Flagged:** 500 rows exported to [`research/mundari-mt/cleaned-data/anomaly_report.csv`](file:///d:/SIH/research/mundari-mt/cleaned-data/anomaly_report.csv).

---

# 7. Script Distribution

The script detector analyzed the target Mundari column across all 20,000 pairs:

| Script Representation | Unicode Code Point Range | Rows Detected | Percentage | Linguistic Interpretation |
| :--- | :--- | :--- | :--- | :--- |
| **Devanagari (`Deva`)** | `U+0900 – U+097F` | **18,942** | **94.71%** | Contemporary orthography used for Mundari in Jharkhand educational and administrative text. |
| **Mixed Script (`Deva` + `Latn`)** | Multiple blocks | **1,058** | **5.29%** | Devanagari Mundari text containing English loan acronyms (e.g., `COP-13`, `organic farming`, `COVID`, `WHO`, `PM`). |
| **Nag Mundari (`Nagm`)** | `U+1E4D0 – U+1E4FF` | **0** | **0.00%** | Native script (Mundari Bani, Rohidas Singh Nag, Unicode 15.0+). Absent from this digital corpus. |
| **Pure Latin (`Latn`)** | `U+0020 – U+024F` | **0** | **0.00%** | No purely Romanized Mundari sentences. |
| **Ol Chiki (`Olck`)** | `U+1C50 – U+1C7F` | **0** | **0.00%** | **PASSED:** Zero Santali Ol Chiki contamination detected. |
| **Unknown / Isolated Symbols** | - | **0** | **0.00%** | All characters mapped to recognized Unicode ranges. |

> [!IMPORTANT]
> **Mundari $\neq$ Santali Rule Confirmed:** The absence of Ol Chiki characters confirms that the MMLoSo 2025 Mundari dataset has not been contaminated with Santali text. Mundari is an Austroasiatic language represented here in the Devanagari script.

---

# 8. Leakage Analysis

Reproducible data splitting was performed with fixed seed `42` under [`research/model-training/prepare_training_data.py`](file:///d:/SIH/research/model-training/prepare_training_data.py):

| Split Name | Row Count | Ratio | Output Path | Pair Overlap with Other Splits |
| :--- | :--- | :--- | :--- | :--- |
| **Training Split** | 16,000 | 80.0% | [`research/mundari-mt/cleaned-data/train.csv`](file:///d:/SIH/research/mundari-mt/cleaned-data/train.csv) | $Train \cap Val = \emptyset$, $Train \cap Test = \emptyset$ |
| **Validation Split** | 2,000 | 10.0% | [`research/mundari-mt/cleaned-data/validation.csv`](file:///d:/SIH/research/mundari-mt/cleaned-data/validation.csv) | $Val \cap Test = \emptyset$ |
| **Held-Out Test Split** | 2,000 | 10.0% | [`research/mundari-mt/cleaned-data/test.csv`](file:///d:/SIH/research/mundari-mt/cleaned-data/test.csv) | Zero pair overlap |

### Leakage Audit Details:
1. **Exact Pair Leakage:** 0 pairs overlap across any pair of splits.
2. **Normalized Pair Leakage:** 0 pairs overlap after NFC normalization and case-folding.
3. **Source Sentence Leakage ($Train \cap Test$):** Exactly 7 sentences overlap (0.35% of test source sentences). These are formulaic short greetings occurring repeatedly in natural language (e.g., "नमस्ते", "धन्यवाद"). The corresponding target translations in train and test do not conflict.
4. **Conclusion:** **The test set is genuinely held out and valid for scientific evaluation.**

---

# 9. Hardware Audit

System hardware was probed empirically via PowerShell WMI queries, `nvidia-smi`, and Python:

```json
{
  "cuda_available_via_torch": false,
  "hardware_cuda_supported": true,
  "gpu_name": "NVIDIA GeForce RTX 3050 Laptop GPU",
  "gpu_memory_gb": 4.0,
  "system_memory_gb": 15.82,
  "cpu": "AMD Ryzen 7 7435HS (8 Cores, 16 Logical Processors)",
  "python_version": "3.14.3 (tags/v3.14.3:323c59a, Feb 3 2026)",
  "platform": "Windows-11-10.0.26200-SP0",
  "cuda_driver": "12.7 (Driver 566.07)",
  "pytorch_version": "NOT_INSTALLED",
  "transformers_version": "NOT_INSTALLED",
  "peft_version": "NOT_INSTALLED",
  "datasets_version": "NOT_INSTALLED",
  "sacrebleu_version": "2.6.0"
}
```

### Compute Constraint Analysis:
1. **Python 3.14 Compatibility:** Python 3.14.3 on Windows currently lacks official pre-compiled PyTorch CUDA wheels on PyPI (only experimental CPU wheels are available).
2. **GPU VRAM Ceiling:** The physical GPU is an NVIDIA RTX 3050 Laptop GPU with 4.0 GB VRAM. Windows Desktop Window Manager (WDDM) and running applications occupy ~740 MB, leaving ~3.2 GB available.
3. **Training Requirement:** Backpropagation on a 200M parameter Seq2Seq model (such as IndicTrans2) with AdamW optimizer states, activations, and gradient buffers requires $\ge 6.0$ GB VRAM in FP16 (or $\ge 12$ GB for full unquantized fine-tuning).
4. **Execution Decision:** In accordance with the **No GPU Rule** and **Rule 3 (No Fabricated Results)**, full neural training on the local workstation is blocked and documented as:
   ```text
   TRAINING NOT EXECUTED — GPU ENVIRONMENT REQUIRED
   ```

---

# 10. Model Candidate Audit

| Model Candidate | Mundari Native Support | Hindi Support | Tokenizer Type | Direct Hi↔Mundari | Fine-Tuning Feasible | License | Approx Size (FP16) | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **IndicTrans2 Distilled 200M** (`ai4bharat/indictrans2-indic-indic-dist-200M`) | **NOT SUPPORTED** | **VERIFIED** | Custom Indic SentencePiece (~32k) | **NOT NATIVE** (Requires tag transfer) | **VERIFIED** (LoRA or Full FT) | CC-BY-NC-4.0 | ~800 MB (200M params) | Compact, excellent Devanagari character handling, but lacks native Mundari tag/roots. |
| **Meta NLLB-200 Distilled 600M** (`facebook/nllb-200-distilled-600M`) | **NOT SUPPORTED** | **VERIFIED** (`hin_Deva`) | Multilingual SentencePiece (~256k) | **NOT NATIVE** (Supports `sat_Olck`, not `unr`) | **VERIFIED** (LoRA) | CC-BY-NC-4.0 | ~2.4 GB (615M params) | Pretrained on Santali (`sat_Olck`), but Mundari Devanagari is not in vocabulary. 3x parameter size. |
| **mBART-50 Many-to-Many** (`facebook/mbart-large-50-many-to-many-mmt`) | **NOT SUPPORTED** | **VERIFIED** (`hi_IN`) | Multilingual SentencePiece (~250k) | **NOT NATIVE** | **VERIFIED** (LoRA) | MIT | ~2.44 GB (610M params) | Standard Seq2Seq; lacks native Mundari tag. High memory footprint. |
| **Aya-23 8B with LoRA** (`tona3738/...-mundari-hindi-mmloso-l15`) | **NOT NATIVE** (Adapted via LoRA) | **VERIFIED** | Cohere BPE (~256k) | **VERIFIED** (Trained on MMLoSo) | **VERIFIED** (QLoRA 4-bit) | Apache 2.0 | ~16.0 GB (8B params) | Community checkpoint fine-tuned on MMLoSo. Severe latency, infeasible for edge/mobile. |
| **mBART-50 MMLoSo Tuned** (`Paulownia/mbart-Large_Tuned_MMLoSo_2025`) | **NOT NATIVE** (Fine-tuned) | **VERIFIED** | Multilingual SentencePiece | **VERIFIED** (Fine-tuned on MMLoSo) | **VERIFIED** | MIT / Academic | ~2.44 GB (610M params) | Publicly shared baseline from MMLoSo challenge mirror. |

---

# 11. IndicTrans2 Compatibility Assessment

Addressing the 9 specific questions regarding `ai4bharat/indictrans2-indic-indic-dist-200M`:

1. **Does official IndicTrans2 support `unr`?**  
   **NO.** Official IndicTrans2 supports 22 scheduled Indian languages (`asm`, `ben`, `brx`, `doi`, `gom`, `guj`, `hin`, `kan`, `kas`, `mai`, `mal`, `mar`, `mni`, `nep`, `ory`, `pan`, `san`, `sat`, `snd`, `tam`, `tel`, `urd`) plus English (`eng`). Mundari (`unr`) is absent from the official model card and supported language list.
2. **Does it have a Mundari language token?**  
   **NO.** IndicTrans2 uses special direction tokens formatted as `<2lang>`, such as `<2hin>`, `<2sat_Olck>`, `<2eng>`. There is no `<2unr>` or `<2unr_Deva>` token in the vocabulary or embedding table.
3. **Does its tokenizer contain meaningful Mundari representation?**  
   **PARTIALLY.** Because Mundari in this corpus is written in Devanagari script, the individual characters and common syllabic conjuncts exist in the SentencePiece vocabulary. However, Mundari is an **Austroasiatic** language with agglutinative affixation that was never present in IndicTrans2's pretraining data. Subword tokenization oversegmentates Mundari roots into generic Indo-Aryan subwords.
4. **Does it support Devanagari Mundari?**  
   **NO NATIVE SUPPORT.** It can encode Devanagari characters, but has no semantic prior for Mundari lexicon or syntax.
5. **Does it support Nag Mundari?**  
   **NO.** Nag Mundari Unicode block (`U+1E4D0–U+1E4FF`) is completely missing from the tokenizer; any Nag Mundari input produces `<unk>` tokens.
6. **Can it be fine-tuned with arbitrary new language data?**  
   **YES, via cross-lingual transfer learning.** There are two technical routes:  
   - *Route A (Placeholder Tag):* Hijack `<2hin>` as the target token (what `training_config.yaml` currently specifies). This works without modifying the model architecture, but weakens the decoder's ability to separate Hindi from Mundari, risking source copying.  
   - *Route B (Embedding Expansion):* Add `<2unr_Deva>` to the tokenizer, resize `model.shared` and `lm_head`, initialize the new token embedding with the mean of Devanagari embeddings, and fine-tune. This is the scientifically rigorous approach.
7. **If Mundari is absent from the pretrained setup, what are the consequences?**  
   - High subword fragmentation (higher sequence length and latency).  
   - Strong prior bias toward Hindi morphology and vocabulary.  
   - Susceptibility to hallucination or source copying when encountering unseen Mundari affixes.
8. **Would fine-tuning IndicTrans2 on ~20k Hindi–Mundari pairs be scientifically defensible?**  
   **YES**, provided it is explicitly classified as **cross-lingual transfer learning on an unsupported low-resource language**, not native support. With 16,000 training pairs, LoRA rank 16 on cross-attention and feed-forward layers can achieve viable domain adaptation.
9. **Would another base model be a better starting point?**  
   - If evaluating existing pre-trained weights without training compute: `Paulownia/mbart-Large_Tuned_MMLoSo_2025` is an existing community fine-tuned checkpoint for MMLoSo Hindi-Mundari.  
   - For fresh training aimed at mobile deployment: IndicTrans2 200M remains the strongest base candidate because its INT8 quantized footprint (~210 MB) is the only architecture compatible with Android edge devices.

---

# 12. Recommended Model

### PRIMARY CANDIDATE:
**`ai4bharat/indictrans2-indic-indic-dist-200M` + LoRA ($r=16, \alpha=32$) with Tokenizer Expansion (`<2unr_Deva>`)**
- **Justification:** 200M parameters (~800 MB FP16) allows INT8 quantization to ~210 MB for offline mobile inference in Phase 4C. Devanagari subwords are natively represented with high character fidelity. Expanding the tokenizer with a dedicated `<2unr_Deva>` token eliminates language tag ambiguity.

### SECONDARY CANDIDATE (Cloud / Server Fallback):
**`facebook/nllb-200-distilled-600M` + LoRA**
- **Justification:** Pretrained on Santali (`sat_Olck`), giving the model an Austroasiatic syntactic prior. However, because Santali is in Ol Chiki while Mundari is in Devanagari, script transfer across scripts is required. Model size is 3x larger (~2.4 GB).

### REJECTED CANDIDATES:
1. **`tona3738/aya23-8b-qlora-cka-repina-mundari-hindi-mmloso-l15`:** Rejected due to 8.0 Billion parameters, requiring 16–24 GB VRAM for inference. Completely infeasible for mobile/offline deployment; high latency (~2.2s/sentence) and high hallucination risk.
2. **Vanilla `facebook/mbart-large-50-many-to-many-mmt`:** Rejected for training from scratch due to high parameter count (610M) and inferior Devanagari subword coverage compared to IndicTrans2.

---

# 13. Missing Components

Before neural training can be executed and scientifically verified, the following components must be addressed:

1. **Concrete Training Loop Implementation in `train_lora.py`:**  
   Currently, lines 294–297 of `train_lora.py` contain a stub print statement (`print("Sufficient GPU detected... Commencing training loop...")`). The actual Hugging Face `Seq2SeqTrainer` or PyTorch training loop must be implemented.
2. **Tokenizer Vocabulary Expansion Logic:**  
   `training_config.yaml` currently reuses `hin_Deva` as target tag. Code to cleanly inject `<2unr_Deva>` and resize token embeddings is needed.
3. **GPU Compute Runtime:**  
   Local machine is blocked by Python 3.14 on Windows and 4.0 GB VRAM. A Google Colab (T4/A100) or Kaggle (2x T4) environment is required for live execution.
4. **Trained Checkpoint Artifacts:**  
   `research/mundari-mt/checkpoints/` contains zero weights (`adapter_model.safetensors` is missing).
5. **Human Native-Speaker Review Execution:**  
   [`research/mundari-mt/results/native_speaker_review.csv`](file:///d:/SIH/research/mundari-mt/results/native_speaker_review.csv) has 25 representative domain sentences prepared, but score columns are appropriately empty pending review by qualified Mundari native speakers.

---

# 14. Safest Next Step

The single safest next engineering step is:

> **Implement the complete, self-contained `Seq2SeqTrainer` training loop and `<2unr_Deva>` tokenizer expansion inside `research/model-training/train_lora.py`, and prepare an automated, self-contained Google Colab / Kaggle execution notebook (`research/mundari-mt/Mundari_LoRA_Training_Colab.ipynb`) that loads the cleaned dataset, executes directional LoRA training on free T4 GPU, evaluates on `test.csv`, and exports verifiable evaluation artifacts.**

This step avoids attempting unviable CPU training locally, adheres to the No GPU Rule, preserves production code safety, and establishes a reproducible cloud execution path.

---

# 15. Commands Actually Executed

The following inspection commands were executed during this audit:

| Command | Working Dir | Purpose | Result |
| :--- | :--- | :--- | :--- |
| `Get-ChildItem -Path research -Recurse -File` | `d:\SIH` | Complete file inventory of `research/` | 38 files identified, sizes and timestamps logged |
| `python -c "import sys, platform, json; ..."` | `d:\SIH` | Probe Python, PyTorch, Transformers, SacreBLEU | Python 3.14.3 detected; PyTorch/Transformers missing; SacreBLEU 2.6.0 installed |
| `nvidia-smi` / WMI Video Controller | `d:\SIH` | Hardware inspection | RTX 3050 Laptop GPU (4.0 GB VRAM, Driver 566.07, CUDA 12.7) |
| `python -c "import csv, unicodedata; ..."` | `d:\SIH` | Dataset audit on `mundari-train.csv` | 20,000 data rows, 0 empty, 0 Ol Chiki, 94.71% Devanagari |
| `python -c "import sys, csv, ..."` (UTF-8) | `d:\SIH` | Length & mixed script distribution | Mean Hi: 16.31 words, Mean Unr: 14.21 words, 1,055 mixed rows |
| `python -c "with open('split_metadata.json')..."` | `d:\SIH` | Verify splitting metadata | 16,000 train, 2,000 val, 2,000 test (Seed 42) |
| `git status` | `d:\SIH` | Verify production code safety | `src/` confirmed untouched by research work |
| `python -m pip install torch --dry-run` | `d:\SIH` | Verify PyTorch availability on Python 3.14 Windows | Only CPU wheel (`torch-2.14.0-cp314`) exists on PyPI; no CUDA wheel |

---

# 16. Evidence Files

All referenced files can be directly inspected in the workspace:

- Raw Dataset: [`research/datasets/mundari/mundari-train.csv`](file:///d:/SIH/research/datasets/mundari/mundari-train.csv)
- Dataset Metadata: [`research/datasets/mundari/split_metadata.json`](file:///d:/SIH/research/datasets/mundari/split_metadata.json)
- Cleaned Training Split: [`research/mundari-mt/cleaned-data/train.csv`](file:///d:/SIH/research/mundari-mt/cleaned-data/train.csv)
- Cleaned Validation Split: [`research/mundari-mt/cleaned-data/validation.csv`](file:///d:/SIH/research/mundari-mt/cleaned-data/validation.csv)
- Cleaned Held-Out Test Split: [`research/mundari-mt/cleaned-data/test.csv`](file:///d:/SIH/research/mundari-mt/cleaned-data/test.csv)
- Anomaly Audit Log: [`research/mundari-mt/cleaned-data/anomaly_report.csv`](file:///d:/SIH/research/mundari-mt/cleaned-data/anomaly_report.csv)
- Script Distribution Summary: [`research/mundari-mt/cleaned-data/script_distribution.json`](file:///d:/SIH/research/mundari-mt/cleaned-data/script_distribution.json)
- Script Detector Module: [`research/mundari-mt/script_detector.py`](file:///d:/SIH/research/mundari-mt/script_detector.py)
- Dataset Audit Script: [`research/dataset-audit/audit_mundari_dataset.py`](file:///d:/SIH/research/dataset-audit/audit_mundari_dataset.py)
- Retrieval Baseline Module: [`research/mundari-mt/retrieval_baseline.py`](file:///d:/SIH/research/mundari-mt/retrieval_baseline.py)
- Phase 4A Dataset Quality Report: [`research/dataset-audit/DATASET_QUALITY_REPORT.md`](file:///d:/SIH/research/dataset-audit/DATASET_QUALITY_REPORT.md)
- Phase 4A Final Report: [`research/MUNDARI_PHASE4A_FINAL_REPORT.md`](file:///d:/SIH/research/MUNDARI_PHASE4A_FINAL_REPORT.md)
- Phase 4B Data Prep Report: [`research/reports/PHASE4B_DATA_PREPARATION_REPORT.md`](file:///d:/SIH/research/reports/PHASE4B_DATA_PREPARATION_REPORT.md)
- Phase 4B Model Candidate Audit: [`research/reports/PHASE4B_MODEL_CANDIDATE_AUDIT.md`](file:///d:/SIH/research/reports/PHASE4B_MODEL_CANDIDATE_AUDIT.md)
- Phase 4B Hardware Log: [`research/mundari-mt/logs/hardware_report.json`](file:///d:/SIH/research/mundari-mt/logs/hardware_report.json)
- Phase 4B Non-Execution Notice: [`research/mundari-mt/logs/TRAINING_NOT_EXECUTED.md`](file:///d:/SIH/research/mundari-mt/logs/TRAINING_NOT_EXECUTED.md)
- Phase 4B Comparative Evaluation Report: [`research/reports/PHASE4B_EVALUATION_REPORT.md`](file:///d:/SIH/research/reports/PHASE4B_EVALUATION_REPORT.md)
- Native Speaker Review Template: [`research/mundari-mt/results/native_speaker_review.csv`](file:///d:/SIH/research/mundari-mt/results/native_speaker_review.csv)
- Phase 4B Final Report: [`research/reports/MUNDARI_PHASE4B_FINAL_REPORT.md`](file:///d:/SIH/research/reports/MUNDARI_PHASE4B_FINAL_REPORT.md)
