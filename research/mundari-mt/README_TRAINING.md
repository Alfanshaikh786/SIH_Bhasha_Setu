# Phase 4B: Mundari Neural Machine Translation — Training & Reproduction Guide

> [!IMPORTANT]
> **Zero Production Footprint:**  
> This training pipeline is self-contained within `research/`. It does not require or mutate the production Bhasha Setu application inside `src/`.

---

## 1. Compute & Hardware Requirements

| Parameter | Minimum Requirement | Recommended (Optimal) |
| :--- | :--- | :--- |
| **Compute Environment** | Linux / Ubuntu (Google Colab, Kaggle, Cloud GPU) | Dedicated Cloud Compute (A10G / RTX 4090) |
| **GPU Architecture** | NVIDIA Pascal or newer with CUDA $\ge 12.1$ | NVIDIA Ampere (RTX 3080/4090, A100, T4) |
| **GPU VRAM** | **6.0 GB VRAM** (with batch size = 8 and gradient accumulation) | **16.0 GB VRAM** (batch size = 16 or 32) |
| **System RAM** | 8 GB | 16 GB - 32 GB |
| **Python Version** | Python 3.10 or 3.11 (Native PyTorch CUDA support) | Python 3.11 |

---

## 2. Environment Setup (Google Colab / Cloud GPU)

In a fresh Google Colab notebook (Runtime -> Change runtime type -> **T4 GPU**):

```bash
# 1. Clone repository or navigate to project workspace
cd /content/SIH_Bhasha_Setu

# 2. Install essential neural training libraries
pip install --upgrade pip
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install transformers>=4.40.0 peft>=0.10.0 datasets sacrebleu rapidfuzz accelerate pyyaml pandas
```

---

## 3. Dataset Pre-Flight Check

Verify that the cleaned 80/10/10 datasets are prepared:

```bash
python research/model-training/prepare_training_data.py
```

Expected output:
- `research/mundari-mt/cleaned-data/train.csv` (16,000 pairs)
- `research/mundari-mt/cleaned-data/validation.csv` (2,000 pairs)
- `research/mundari-mt/cleaned-data/test.csv` (2,000 pairs)

---

## 4. Directional Training Execution

### Direction 1: Hindi → Mundari (`hi_to_unr`)
```bash
python research/model-training/train_lora.py \
    --direction hi_to_unr \
    --epochs 6 \
    --batch-size 16
```

### Direction 2: Mundari → Hindi (`unr_to_hi`)
```bash
python research/model-training/train_lora.py \
    --direction unr_to_hi \
    --epochs 6 \
    --batch-size 16
```

### Smoke Test Mode (Validation Only):
```bash
python research/model-training/train_lora.py --direction hi_to_unr --smoke-test
```

---

## 5. Checkpoint Recovery & Directory Layout

During training, checkpoints are saved automatically after each evaluation epoch:

```text
research/mundari-mt/checkpoints/
├── hi_to_unr/
│   ├── adapter_config.json
│   ├── adapter_model.safetensors
│   ├── training_args.bin
│   └── checkpoint-epoch-6/
└── unr_to_hi/
    ├── adapter_config.json
    ├── adapter_model.safetensors
    ├── training_args.bin
    └── checkpoint-epoch-6/
```

To resume interrupted training:
```bash
python research/model-training/train_lora.py \
    --direction hi_to_unr \
    --checkpoint research/mundari-mt/checkpoints/hi_to_unr/checkpoint-epoch-3
```

---

## 6. Evaluation on Held-Out Test Data

Once training has completed, evaluate strictly against the 2,000 unseen test pairs:

```bash
# 1. Neural Model Evaluation
python research/model-evaluation/evaluate_neural_model.py --direction hi_to_unr
python research/model-evaluation/evaluate_neural_model.py --direction unr_to_hi

# 2. Benchmark Comparison against Phase 4A Retrieval Baseline
python research/model-evaluation/compare_baselines.py

# 3. Qualitative Domain Inspection
python research/model-evaluation/qualitative_evaluation.py

# 4. Hallucination & Contamination Audit
python research/model-evaluation/hallucination_detector.py
```
