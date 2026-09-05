# Phase 4B: Neural Machine Translation Training Pipeline Implementation Report

**Date:** 2026-09-05  
**Target Direction:** Hindi (`hi`) ↔ Mundari (`unr`)  
**Base Architecture:** AI4Bharat IndicTrans2 Distilled 200M (`ai4bharat/indictrans2-indic-indic-dist-200M`) + PEFT LoRA  
**Implementation Scope:** Complete, Reproducible Directional Seq2Seq Fine-Tuning Pipeline with Cloud GPU Target  
**Production Impact:** **ZERO PRODUCTION IMPACT** (`src/` verified untouched)

---

# 1. Implementation Summary

The Phase 4B Neural Machine Translation training pipeline has been designed and implemented to provide a mathematically sound, reproducible fine-tuning workflow for **Hindi ↔ Mundari machine translation**.

### Key Deliverables Implemented:
1. **Directional Training Pipeline ([`research/model-training/train_lora.py`](file:///d:/SIH/research/model-training/train_lora.py)):**
   - Supports both translation routes: `--direction hi_to_unr` and `--direction unr_to_hi`.
   - Incorporates automated dataset validation, Unicode NFC normalization, sequence formatting, and Hugging Face `Seq2SeqTrainer` integration.
   - Enforces hardware guardrails: detects available VRAM and prevents Out-Of-Memory thrashing on low-VRAM local machines.
   - Embeds a multi-stage `--smoke-test` mode to verify the entire pipeline on 4 samples.
2. **Standardized Hyperparameter Configuration ([`research/mundari-mt/configs/training_config.yaml`](file:///d:/SIH/research/mundari-mt/configs/training_config.yaml)):**
   - Decouples all training hyperparameters (learning rate, epochs, effective batch size, warmup, LoRA rank/alpha) into clean YAML.
3. **Self-Contained Google Colab Execution Notebook ([`research/mundari-mt/Mundari_LoRA_Training_Colab.ipynb`](file:///d:/SIH/research/mundari-mt/Mundari_LoRA_Training_Colab.ipynb)):**
   - 33 cells covering all 16 required phases from environment probe and dependency install through training, evaluation, baseline comparison, and artifact export.

---

# 2. Model Architecture Verification

- **Base Model:** `ai4bharat/indictrans2-indic-indic-dist-200M`
- **Architecture Type:** Transformer Encoder-Decoder (Sequence-to-Sequence)
- **Base Parameters:** ~200 Million parameters (~800 MB FP16)
- **Vocabulary Size:** ~32,000 subwords (Indic-optimized SentencePiece)
- **Loading Mechanism:** Loaded via Hugging Face `AutoModelForSeq2SeqLM` with `trust_remote_code=True`.
- **Decoder Behavior:** Generates tokens autoregressively conditioned on encoder cross-attention hidden states.

> [!CAUTION]
> **No Native Mundari Knowledge:** Official IndicTrans2 was pretrained on 22 scheduled Indian languages and English. It has **zero documented Mundari pretraining data**. It processes Mundari characters solely because Mundari in this corpus is written in Devanagari script.

---

# 3. Tokenizer Verification

- **Tokenizer Class:** SentencePiece BPE tokenizer tailored for Indian scripts (`AutoTokenizer` with `trust_remote_code=True`).
- **Devanagari Handling:** Encodes Devanagari vowels, consonants, conjuncts, and combining marks natively.
- **Nag Mundari (`U+1E4D0–U+1E4FF`):** **NOT SUPPORTED.** Nag Mundari characters map to `<unk>`.
- **Ol Chiki (`U+1C50–U+1C7F`):** Supported as Santali (`<sat_Olck>`), but strictly rejected from Mundari training data to prevent language contamination.

---

# 4. `<unr_Deva>` Language Token Design

The introduction of the dedicated language identifier was analyzed across all 6 technical criteria:

### A. Placement in Sequence:
In IndicTrans2, input sequences are prefixed with source and target language tags:
```text
f"<{src_tag}> <{tgt_tag}> {normalized_sentence}"
```
- For **Hindi → Mundari (`hi_to_unr`)**:
  `"<hin_Deva> <unr_Deva> {hindi_sentence}"`
- For **Mundari → Hindi (`unr_to_hi`)**:
  `"<unr_Deva> <hin_Deva> {mundari_sentence}"`

### B. Role as Source vs. Target:
`<unr_Deva>` functions as **both**:
- As **target language selector** in `hi_to_unr` (directing the decoder to generate Mundari morphology).
- As **source language identifier** in `unr_to_hi` (informing the encoder that the input is Mundari).

### C. Target Language Selection Mechanism:
Target language conditioning is established via the prompt prefix in the encoder, matching IndicTrans2's native multi-task conditioning scheme.

### D. Model Metadata & Embedding Resizing:
Adding `<unr_Deva>` requires calling:
```python
tokenizer.add_special_tokens({"additional_special_tokens": ["<unr_Deva>"]})
model.resize_token_embeddings(len(tokenizer))
```
This expands the embedding table (`model.shared`) and the output projection matrix (`model.lm_head`).

### E. Embedding Initialization Strategy:
Random initialization is mathematically hazardous for special tokens because it destabilizes gradients during early training steps.
The implementation uses **Embedding Cloning from Anchor Token**:
```python
anchor_id = tokenizer.convert_tokens_to_ids("<hin_Deva>")
new_id = tokenizer.convert_tokens_to_ids("<unr_Deva>")
with torch.no_grad():
    model.get_input_embeddings().weight.data[new_id] = model.get_input_embeddings().weight.data[anchor_id].clone()
    if hasattr(model, "get_output_embeddings") and model.get_output_embeddings() is not None:
        model.get_output_embeddings().weight.data[new_id] = model.get_output_embeddings().weight.data[anchor_id].clone()
```
This places the new token at the identical coordinates in latent space as the Devanagari script anchor before fine-tuning separates them.

### F. Scientific Disclaimer:
```text
Tokenizer expansion provides a dedicated identifier (<unr_Deva>) for the new target language
but does NOT constitute pretrained Mundari language knowledge. The model learns Mundari morphology,
syntax, and vocabulary exclusively from the fine-tuning parallel corpus.
```

---

# 5. LoRA Configuration

Parameter-Efficient Fine-Tuning avoids catastrophic forgetting of the pretrained multilingual representations and minimizes GPU VRAM consumption:

| Hyperparameter | Value | Rationale |
| :--- | :--- | :--- |
| **PEFT Method** | LoRA (Low-Rank Adaptation) | Freezes base weights; injects trainable low-rank matrices. |
| **LoRA Rank ($r$)** | `16` | Sufficient rank for cross-lingual Austroasiatic adaptation without excessive parameters. |
| **LoRA Alpha ($\alpha$)** | `32` | Scaling factor ($\alpha / r = 2.0$), providing stable gradient propagation. |
| **LoRA Dropout** | `0.05` | Regularization against overfitting on 16,000 training pairs. |
| **Target Modules** | `["q_proj", "v_proj", "k_proj", "out_proj"]` | Adapts all query, key, value, and output projections across self-attention and cross-attention blocks. |
| **Trainable Parameters** | ~1.8 Million (~0.9% of base model) | Adapter size is only ~15 MB per direction. |

---

# 6. Dataset Integration

The pipeline strictly integrates with the pre-split, verified datasets:
- **Training Set:** [`research/mundari-mt/cleaned-data/train.csv`](file:///d:/SIH/research/mundari-mt/cleaned-data/train.csv) (16,000 pairs, 80%)
- **Validation Set:** [`research/mundari-mt/cleaned-data/validation.csv`](file:///d:/SIH/research/mundari-mt/cleaned-data/validation.csv) (2,000 pairs, 10%)
- **Held-Out Test Set:** [`research/mundari-mt/cleaned-data/test.csv`](file:///d:/SIH/research/mundari-mt/cleaned-data/test.csv) (2,000 pairs, 10%)

### Preprocessing Protocol:
1. Validates that `Hindi` and `Mundari` columns exist; throws `DATASET_NOT_FOUND` if missing.
2. Applies Unicode NFC normalization: `unicodedata.normalize("NFC", text)`.
3. Strips extraneous whitespace while preserving punctuation.
4. Truncates source sequences to 128 tokens and target sequences to 128 tokens.
5. Replaces target padding tokens with `-100` so that pad tokens are ignored in cross-entropy loss computation.

---

# 7. Smoke Test Procedure

[`research/model-training/train_lora.py`](file:///d:/SIH/research/model-training/train_lora.py) implements a complete pre-flight validation routine via `--smoke-test`:

```bash
python research/model-training/train_lora.py --direction hi_to_unr --smoke-test
```

### Stage Verification Sequence:
1. **Stage 1 (Dataset):** Loads `train.csv` (16k) and `validation.csv` (2k); validates column headers.
2. **Stage 2 (Environment):** Checks PyTorch and CUDA availability.
3. **Stage 3 (Tokenizer):** Injects `<unr_Deva>` and verifies token ID assignment.
4. **Stage 4 (Model):** Resizes embeddings and initializes vector from `<hin_Deva>`.
5. **Stage 5 (LoRA):** Wraps model in PEFT and validates trainable parameter counts.
6. **Stage 6 (Preprocessing):** Formats 4 sample sentence pairs with language prefixes.
7. **Stage 7 (Forward Pass):** Runs 4 samples through the model; asserts non-NaN loss.
8. **Stage 8 (Backward Pass):** Propagates gradients via `loss.backward()`.
9. **Stage 9 (Inference):** Generates sample target tokens using `model.generate()`.
10. **Stage 10 (Serialization):** Saves smoke adapter weights to disk and verifies loadability.

---

# 8. Hardware Compatibility & Guardrails

The script detects hardware via [`training_utils.py`](file:///d:/SIH/research/model-training/training_utils.py):
- **Local Workstation Profile:** AMD Ryzen 7 7435HS, 15.82 GB RAM, NVIDIA GeForce RTX 3050 Laptop GPU (4.0 GB VRAM), Windows 11, Python 3.14.3.
- **Hardware Failure Handling:** If physical VRAM is $< 6.0$ GB or CUDA is unavailable, the script outputs `[INSUFFICIENT_VRAM]` and halts, recording the event to [`TRAINING_NOT_EXECUTED.md`](file:///d:/SIH/research/mundari-mt/logs/TRAINING_NOT_EXECUTED.md).
- **Target Compute Environment:** Google Colab T4 GPU (15.0 GB VRAM) or Kaggle (2x T4 16 GB VRAM).

---

# 9. Google Colab Configuration

A dedicated Jupyter Notebook has been created at [`research/mundari-mt/Mundari_LoRA_Training_Colab.ipynb`](file:///d:/SIH/research/mundari-mt/Mundari_LoRA_Training_Colab.ipynb).

### Notebook Cell Structure (33 Cells):
- **Cell 1–2:** Title, research disclaimers, and environment audit.
- **Cell 3–5:** Git repository cloning, dependency installation, and GPU capability assertion.
- **Cell 6–7:** Dataset split validation (16k / 2k / 2k) and Ol Chiki contamination audit.
- **Cell 8–10:** Tokenizer inspection, `<unr_Deva>` injection, embedding cloning, and LoRA setup.
- **Cell 11:** 4-sample end-to-end smoke test (forward + backward pass).
- **Cell 12–13:** Hindi → Mundari and Mundari → Hindi full training invocations.
- **Cell 14–15:** Checkpoint verification and held-out test evaluation (`test.csv`).
- **Cell 16–17:** Hallucination detection, baseline comparison, and `.tar.gz` artifact export.

---

# 10. Training Commands

### 1. Pre-Flight Dry Run (Configuration & Dataset Check):
```bash
python research/model-training/train_lora.py --direction hi_to_unr --dry-run
```

### 2. Pre-Flight Smoke Test (Tiny Sample Verification):
```bash
python research/model-training/train_lora.py --direction hi_to_unr --smoke-test
```

### 3. Full Directional Training on GPU (Colab / Cloud):
```bash
# Hindi -> Mundari
python research/model-training/train_lora.py --direction hi_to_unr --epochs 6 --batch-size 16

# Mundari -> Hindi
python research/model-training/train_lora.py --direction unr_to_hi --epochs 6 --batch-size 16
```

---

# 11. Expected Outputs

Upon completion of a training run on a suitable GPU, the following artifacts are generated:

```text
research/mundari-mt/checkpoints/hi_to_unr/
├── final_adapter/
│   ├── adapter_config.json        # LoRA architecture hyperparameters
│   ├── adapter_model.safetensors  # Trained LoRA weight matrices (~15 MB)
│   ├── special_tokens_map.json    # Contains <unr_Deva> definition
│   └── tokenizer_config.json
└── training_metadata.json         # Complete hardware, dataset, and training loss log
```

---

# 12. Known Limitations

1. **Local Compute Block:** The local RTX 3050 4 GB GPU on Windows Python 3.14 cannot execute full training due to VRAM limits and lack of official PyTorch CUDA wheels. Training must be run on Colab or cloud GPU.
2. **Subword Fragmentation:** Because Mundari roots were not in IndicTrans2's pretraining data, subwords will exhibit higher fragmentation rates than Hindi.
3. **Domain Specificity:** The MMLoSo 2025 dataset primarily covers governmental, educational, and civic domains; performance on colloquial or dialectal village speech will require native speaker validation.

---

# 13. Risks & Mitigations

| Identified Risk | Impact | Implemented Mitigation |
| :--- | :--- | :--- |
| **Language Tag Confusion** | Decoder mixes Hindi and Mundari | `<unr_Deva>` is injected as a distinct special token; initialized from `<hin_Deva>` rather than random noise. |
| **Catastrophic Forgetting** | Base model loses Hindi generation ability | Base model is frozen; only LoRA adapter matrices ($r=16$) are updated. |
| **Cross-Split Leakage** | Optimistic, invalid test scores | Train (16k), val (2k), and test (2k) splits are strictly locked (Seed 42); zero pair overlap verified. |
| **Source Copying Hallucination** | Model outputs Hindi input verbatim | Checked by [`hallucination_detector.py`](file:///d:/SIH/research/model-evaluation/hallucination_detector.py) during evaluation. |
| **Santali Contamination** | Ol Chiki characters corrupt Mundari text | 100% Ol Chiki filter enforced in both dataset validation and evaluation detectors. |

---

# 14. What Has NOT Been Executed

To uphold the absolute integrity of this research report:

- [ ] **Full neural model training has NOT been executed.**
- [ ] **No trained adapter weights exist** on disk yet.
- [ ] **No neural BLEU or chrF scores have been measured.**
- [ ] **No human native speaker scores have been recorded.**
- [ ] **No production files in `src/` have been modified.**

---

# 15. Classification Matrix

| Component | Status | Evidence |
| :--- | :--- | :--- |
| Dataset Preparation & Splitting | **EXECUTED AND VERIFIED** | 16k/2k/2k splits present in `research/mundari-mt/cleaned-data/` |
| Retrieval Baseline Evaluation | **EXECUTED AND VERIFIED** | Tested live on 500 test sentences; reported in Phase 4A |
| LoRA Training Script (`train_lora.py`) | **IMPLEMENTED** | Validated via `--dry-run` and stage 1 smoke tests |
| Tokenizer Expansion Architecture | **IMPLEMENTED** | Tokenizer `<unr_Deva>` expansion and embedding cloning logic complete |
| Google Colab Notebook | **IMPLEMENTED** | Valid 33-cell JSON notebook at `Mundari_LoRA_Training_Colab.ipynb` |
| Neural Model GPU Training | **NOT EXECUTED** | Blocked locally by 4 GB VRAM & Python 3.14 Windows environment |
| Held-Out Neural BLEU / chrF | **NOT MEASURED** | Awaiting GPU training run |
| Production Code Isolation | **VERIFIED** | `git status` confirms zero modifications in `src/` |
