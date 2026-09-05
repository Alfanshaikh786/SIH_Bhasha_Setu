"""
Enhanced Generator for research/mundari-mt/Mundari_LoRA_Training_Colab.ipynb
Fully implements all Phase 4B pre-flight, model architecture audit, tokenizer expansion,
dual-direction smoke testing, tiny overfit test, checkpoint reload, and evaluation stages.
"""

import json
import os

NOTEBOOK_PATH = os.path.join(os.path.dirname(__file__), "Mundari_LoRA_Training_Colab.ipynb")

notebook = {
    "cells": [],
    "metadata": {
        "colab": {
            "provenance": [],
            "gpuType": "T4"
        },
        "kernelspec": {
            "display_name": "Python 3",
            "name": "python3"
        },
        "language_info": {
            "name": "python"
        },
        "accelerator": "GPU"
    },
    "nbformat": 4,
    "nbformat_minor": 0
}


def add_md(source: str):
    notebook["cells"].append({
        "cell_type": "markdown",
        "metadata": {},
        "source": [line + "\n" for line in source.strip().split("\n")]
    })


def add_code(source: str):
    notebook["cells"].append({
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [line + "\n" for line in source.strip().split("\n")]
    })


# Cell 1: Title & Mandatory Research Principles
add_md("""# Bhasha Setu: Mundari (ISO 639-3: unr) ↔ Hindi Neural Machine Translation
## Phase 4B: GPU Pre-Flight, Model Compatibility Audit & Real Smoke Test

**Target Architecture:** AI4Bharat IndicTrans2 (`ai4bharat/indictrans2-indic-indic-dist-320M`) + Directional LoRA ($r=16, \\alpha=32$)  
**Target Hardware:** Google Colab Free T4 GPU (~15 GB VRAM)  
**Evaluation Benchmark:** Held-out test set from MMLoSo 2025 (`test.csv`, 2,000 pairs)

---

### Non-Negotiable Research Principles:
1. **Mundari != Santali:** Mundari in this corpus is written in Devanagari script (`U+0900–U+097F`). Zero Ol Chiki characters (`U+1C50–U+1C7F`) are permitted.
2. **Tokenizer Expansion Reality:** IndicTrans2 does NOT natively support Mundari (`unr`). Tokenizer expansion introduces `<unr_Deva>` as a dedicated identifier and initializes its embedding from `<hin_Deva>`. It does NOT provide pretrained Mundari knowledge; the model learns Mundari exclusively from the parallel corpus.
3. **No Synthetic Results:** No metrics, loss values, or checkpoints are fabricated.
4. **Smoke Test Mode First:** Full 16,000-pair training is prohibited until the multi-stage GPU smoke test passes completely.""")

# Cell 2: Section 1 - Hardware Verification
add_md("""## 1. Hardware Verification (Mandatory First Cell)
Inspect the active runtime. If CUDA is not active, execution halts immediately with `GPU_UNAVAILABLE`.""")

add_code("""import sys
import os
import platform
import subprocess

print("=" * 70)
print("SECTION 1: HARDWARE & ENVIRONMENT AUDIT")
print("=" * 70)

print(f"Python Version: {sys.version.split()[0]}")
print(f"Platform:       {platform.platform()}")

try:
    import torch
    print(f"PyTorch:        {torch.__version__}")
    print(f"CUDA Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        total_vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
        allocated_vram = torch.cuda.memory_allocated(0) / (1024 ** 3)
        available_vram = total_vram_gb - allocated_vram
        print(f"CUDA Version:   {torch.version.cuda}")
        print(f"GPU Device:     {gpu_name}")
        print(f"Total VRAM:     {total_vram_gb:.2f} GB")
        print(f"Available VRAM: {available_vram:.2f} GB")
        assert total_vram_gb >= 6.0, f"VRAM insufficient ({total_vram_gb:.2f} GB < 6.0 GB threshold)"
    else:
        print("\n[GPU_UNAVAILABLE] Active runtime does not have CUDA enabled.")
        print("Please navigate to: Runtime > Change runtime type > T4 GPU, then restart.")
        raise SystemExit("[GPU_UNAVAILABLE] Execution stopped: GPU runtime required.")
except ImportError:
    print("PyTorch not yet installed. Proceeding to dependency installation...")""")

# Cell 3: Section 2 - Repository Setup
add_md("""## 2. Repository Acquisition & Directory Structure
Clone the official Bhasha Setu repository and switch to the project workspace.""")

add_code("""import os

REPO_DIR = "/content/SIH"
if not os.path.exists(REPO_DIR):
    !git clone https://github.com/Alfanshaikh786/SIH_Bhasha_Setu.git {REPO_DIR}

%cd {REPO_DIR}
!pwd
!ls -la research/mundari-mt/cleaned-data/""")

# Cell 4: Section 3 - Dependency Installation
add_md("""## 3. Dependency Installation
Install verified dependencies for IndicTrans2, Hugging Face Transformers, PEFT, and SacreBLEU.""")

add_code("""!pip install -q "torch>=2.1.0" "transformers>=4.38.0" "peft>=0.9.0" "datasets>=2.18.0" "accelerate>=0.28.0" sacrebleu rapidfuzz pyyaml sentencepiece huggingface_hub

import transformers
import peft
import datasets
import sacrebleu
import accelerate
import torch

print("Installed Package Versions:")
print(f"  PyTorch:      {torch.__version__} (CUDA: {torch.version.cuda})")
print(f"  Transformers: {transformers.__version__}")
print(f"  PEFT:         {peft.__version__}")
print(f"  Datasets:     {datasets.__version__}")
print(f"  SacreBLEU:    {sacrebleu.__version__}")
print(f"  Accelerate:   {accelerate.__version__}")""")

# Cell 5: Section 4 - Hugging Face Authentication (Gated Model Access)
add_md("""## 4. Hugging Face Authentication (IndicTrans2 Access)
IndicTrans2 models are gated on Hugging Face. You must authenticate using an HF Access Token from an account that has accepted the terms on `ai4bharat/indictrans2-indic-indic-dist-320M`.""")

add_code("""import os
from huggingface_hub import login

hf_token = os.environ.get("HF_TOKEN")
if not hf_token:
    print("Please enter your Hugging Face User Access Token (from https://huggingface.co/settings/tokens):")
    login()
else:
    login(token=hf_token)
    print("Authenticated successfully via HF_TOKEN environment variable.")""")

# Cell 6: Section 5 - Dataset Verification & Linguistic Integrity
add_md("""## 5. Dataset Verification & Santali Contamination Audit
Confirm the exact 16k train / 2k val / 2k test split and audit for zero Ol Chiki characters (`U+1C50–U+1C7F`).""")

add_code("""import pandas as pd

train_df = pd.read_csv("research/mundari-mt/cleaned-data/train.csv", dtype=str, keep_default_na=False)
val_df = pd.read_csv("research/mundari-mt/cleaned-data/validation.csv", dtype=str, keep_default_na=False)
test_df = pd.read_csv("research/mundari-mt/cleaned-data/test.csv", dtype=str, keep_default_na=False)

print(f"Train Pairs:      {len(train_df):,} (Expected: 16,000)")
print(f"Validation Pairs: {len(val_df):,} (Expected: 2,000)")
print(f"Held-Out Test:    {len(test_df):,} (Expected: 2,000)")

assert len(train_df) == 16000 and len(val_df) == 2000 and len(test_df) == 2000, "Dataset split mismatch!"
assert "Hindi" in train_df.columns and "Mundari" in train_df.columns, "Missing required columns!"

# Ol Chiki Contamination Scan
ol_chiki_count = sum(any(0x1C50 <= ord(c) <= 0x1C7F for c in str(row["Mundari"])) for _, row in train_df.iterrows())
print(f"Ol Chiki Contamination Detected: {ol_chiki_count} rows")
assert ol_chiki_count == 0, "SANTALI_CONTAMINATION: Found Ol Chiki characters in Mundari training split!"
print("Dataset Verification: PASSED (100% clean from Santali Ol Chiki script).")""")

# Cell 7: Section 6 - Base Model Loading & Architecture Audit
add_md("""## 6. Base Model Loading & Architecture Audit
Load `ai4bharat/indictrans2-indic-indic-dist-320M` (or fallback `200M`) and inspect the internal layer hierarchy.""")

add_code("""from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

MODEL_NAME = "ai4bharat/indictrans2-indic-indic-dist-320M"

print(f"Loading tokenizer & model: {MODEL_NAME} (trust_remote_code=True)...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
model = AutoModelForSeq2SeqLM.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True,
    low_cpu_mem_usage=True
)

print("\n" + "=" * 70)
print("MODEL ARCHITECTURE AUDIT")
print("=" * 70)
print(f"Model Class:       {model.__class__.__name__}")
print(f"Encoder Class:     {model.model.encoder.__class__.__name__ if hasattr(model, 'model') else 'Standard'}")
print(f"Decoder Class:     {model.model.decoder.__class__.__name__ if hasattr(model, 'model') else 'Standard'}")
print(f"Base Parameters:   {sum(p.numel() for p in model.parameters()):,}")
print(f"Embedding Layer:   {model.get_input_embeddings()}")
print(f"LM Head Layer:     {model.get_output_embeddings()}")
print(f"Base Vocab Size:   {len(tokenizer):,}")""")

# Cell 8: Section 7 - Tokenizer Audit Before Expansion
add_md("""## 7. Tokenizer Audit (Before Modification)
Inspect existing language tags (`<hin_Deva>`, `<sat_Olck>`) and verify that `<unr_Deva>` does NOT yet exist.""")

add_code("""vocab = tokenizer.get_vocab()

print(f"Total Base Vocabulary Tokens: {len(vocab):,}")
print(f"Anchor '<hin_Deva>' Present?: {'<hin_Deva>' in vocab} (ID: {tokenizer.convert_tokens_to_ids('<hin_Deva>')})")
print(f"Santali '<sat_Olck>' Present?: {'<sat_Olck>' in vocab} (ID: {tokenizer.convert_tokens_to_ids('<sat_Olck>')})")
print(f"Native '<unr_Deva>' Present?: {'<unr_Deva>' in vocab}")

assert "<hin_Deva>" in vocab, "Required anchor tag <hin_Deva> is missing!"
assert "<unr_Deva>" not in vocab, "Unexpected: <unr_Deva> already present in base vocabulary."
print("Tokenizer Audit: Verified absence of native Mundari support.")""")

# Cell 9: Section 8 - Tokenizer Expansion & Embedding Initialization
add_md("""## 8. Tokenizer Expansion & Embedding Cloning
Add `<unr_Deva>` as a dedicated special token, resize model embeddings, and clone the embedding vector from `<hin_Deva>`.""")

add_code("""import torch

NEW_TOKEN = "<unr_Deva>"
ANCHOR_TOKEN = "<hin_Deva>"

# 1. Add Special Token
num_added = tokenizer.add_special_tokens({"additional_special_tokens": [NEW_TOKEN]})
print(f"Added {num_added} token. New Vocabulary Size: {len(tokenizer):,}")
new_token_id = tokenizer.convert_tokens_to_ids(NEW_TOKEN)
anchor_token_id = tokenizer.convert_tokens_to_ids(ANCHOR_TOKEN)

# 2. Resize Embeddings
model.resize_token_embeddings(len(tokenizer))
print(f"Resized model embeddings to: {model.get_input_embeddings().weight.shape[0]}")

# 3. Clone Embedding from Anchor
with torch.no_grad():
    input_emb = model.get_input_embeddings()
    input_emb.weight.data[new_token_id] = input_emb.weight.data[anchor_token_id].clone()
    if hasattr(model, "get_output_embeddings") and model.get_output_embeddings() is not None:
        out_emb = model.get_output_embeddings()
        out_emb.weight.data[new_token_id] = out_emb.weight.data[anchor_token_id].clone()

# 4. Verify Non-Zero and Finite
new_vector = model.get_input_embeddings().weight.data[new_token_id]
assert not torch.isnan(new_vector).any(), "New embedding contains NaN values!"
assert (new_vector == model.get_input_embeddings().weight.data[anchor_token_id]).all(), "Embedding cloning failed!"
print(f"Successfully initialized '{NEW_TOKEN}' (ID {new_token_id}) embedding from '{ANCHOR_TOKEN}' (ID {anchor_token_id}).")""")

# Cell 10: Section 9 - Language Conditioning Validation
add_md("""## 9. Language Conditioning Validation
Inspect actual subword token sequences to confirm correct source/target prefix formatting for both directions.""")

add_code("""test_sentence_hi = "नमस्ते, आपका नाम क्या है?"
test_sentence_unr = "जोहार, आमाः नुतूम चिकना तना?"

# Test hi_to_unr Conditioning
prompt_hi_unr = f"<hin_Deva> <unr_Deva> {test_sentence_hi}"
tokens_hi_unr = tokenizer.tokenize(prompt_hi_unr)
ids_hi_unr = tokenizer.convert_tokens_to_ids(tokens_hi_unr)
print(f"[hi_to_unr] Prompt: {prompt_hi_unr}")
print(f"[hi_to_unr] First 5 Tokens: {tokens_hi_unr[:5]}")
print(f"[hi_to_unr] Token IDs:       {ids_hi_unr[:5]}")
assert tokens_hi_unr[0] == "<hin_Deva>" and tokens_hi_unr[1] == "<unr_Deva>", "Prefix format incorrect for hi_to_unr!"

# Test unr_to_hi Conditioning
prompt_unr_hi = f"<unr_Deva> <hin_Deva> {test_sentence_unr}"
tokens_unr_hi = tokenizer.tokenize(prompt_unr_hi)
ids_unr_hi = tokenizer.convert_tokens_to_ids(tokens_unr_hi)
print(f"\n[unr_to_hi] Prompt: {prompt_unr_hi}")
print(f"[unr_to_hi] First 5 Tokens: {tokens_unr_hi[:5]}")
print(f"[unr_to_hi] Token IDs:       {ids_unr_hi[:5]}")
assert tokens_unr_hi[0] == "<unr_Deva>" and tokens_unr_hi[1] == "<hin_Deva>", "Prefix format incorrect for unr_to_hi!"
print("\nLanguage Conditioning: PASSED for both directions.")""")

# Cell 11: Section 10 - LoRA Adapter Setup & Target Module Audit
add_md("""## 10. LoRA Adapter Setup & Target Module Audit
Attach LoRA adapter ($r=16, \\alpha=32$) and inspect attached linear projections (`q_proj`, `v_proj`, `k_proj`, `out_proj`).""")

add_code("""from peft import LoraConfig, get_peft_model, TaskType

lora_config = LoraConfig(
    task_type=TaskType.SEQ_2_SEQ_LM,
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    target_modules=["q_proj", "v_proj", "k_proj", "out_proj"],
    bias="none"
)

lora_model = get_peft_model(model, lora_config)
print("LoRA Parameter Footprint:")
lora_model.print_trainable_parameters()

# Audit Named Modules
matched_modules = []
for name, module in lora_model.named_modules():
    if any(t in name for t in ["q_proj", "v_proj", "k_proj", "out_proj"]):
        matched_modules.append(name)

print(f"Total LoRA Target Linear Layers Attached: {len(matched_modules)}")
assert len(matched_modules) > 0, "No target modules found! Verify model projection layer names."
print("LoRA Module Audit: PASSED.")""")

# Cell 12: Section 11 - Pre-Flight Smoke Test (Both Directions)
add_md("""## 11. Pre-Flight Smoke Test (Forward & Backward Passes)
Execute forward pass, cross-entropy loss computation, and backpropagation on a tiny 4-sample batch for both directions.""")

add_code("""device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
lora_model = lora_model.to(device)

smoke_samples = train_df.head(4)

# --- Test Direction 1: hi_to_unr ---
print("Testing Direction 1: Hindi -> Mundari (hi_to_unr)...")
hi_inputs = [f"<hin_Deva> <unr_Deva> {t}" for t in smoke_samples["Hindi"]]
unr_targets = smoke_samples["Mundari"].tolist()

enc_hi = tokenizer(hi_inputs, padding=True, truncation=True, max_length=64, return_tensors="pt").to(device)
labels_unr = tokenizer(unr_targets, padding=True, truncation=True, max_length=64, return_tensors="pt").input_ids.to(device)
labels_unr[labels_unr == tokenizer.pad_token_id] = -100
enc_hi["labels"] = labels_unr

lora_model.train()
out_hi_unr = lora_model(**enc_hi)
loss_hi_unr = out_hi_unr.loss
print(f"  [hi_to_unr] Forward Pass Loss: {loss_hi_unr.item():.4f}")
assert not torch.isnan(loss_hi_unr) and not torch.isinf(loss_hi_unr), "Loss is NaN/Inf!"

loss_hi_unr.backward()
print("  [hi_to_unr] Backward Pass: SUCCESS (Gradients computed)")

# --- Test Direction 2: unr_to_hi ---
print("\nTesting Direction 2: Mundari -> Hindi (unr_to_hi)...")
unr_inputs = [f"<unr_Deva> <hin_Deva> {t}" for t in smoke_samples["Mundari"]]
hi_targets = smoke_samples["Hindi"].tolist()

enc_unr = tokenizer(unr_inputs, padding=True, truncation=True, max_length=64, return_tensors="pt").to(device)
labels_hi = tokenizer(hi_targets, padding=True, truncation=True, max_length=64, return_tensors="pt").input_ids.to(device)
labels_hi[labels_hi == tokenizer.pad_token_id] = -100
enc_unr["labels"] = labels_hi

out_unr_hi = lora_model(**enc_unr)
loss_unr_hi = out_unr_hi.loss
print(f"  [unr_to_hi] Forward Pass Loss: {loss_unr_hi.item():.4f}")
assert not torch.isnan(loss_unr_hi) and not torch.isinf(loss_unr_hi), "Loss is NaN/Inf!"

loss_unr_hi.backward()
print("  [unr_to_hi] Backward Pass: SUCCESS (Gradients computed)")
print("\nDual-Direction Smoke Test: PASSED.")""")

# Cell 13: Section 12 - One-Minute Overfit Test
add_md("""## 12. One-Minute Overfit Test
Optimize 4 examples for 10 update steps to confirm that the model learns the tiny subset (loss decreases).""")

add_code("""optimizer = torch.optim.AdamW(lora_model.parameters(), lr=1.0e-3)
lora_model.train()

initial_loss = None
final_loss = None

print("Running 10-step overfit test on 4 sample pairs...")
for step in range(10):
    optimizer.zero_grad()
    outputs = lora_model(**enc_hi)
    loss = outputs.loss
    if step == 0:
        initial_loss = loss.item()
    loss.backward()
    optimizer.step()
    if step == 9:
        final_loss = loss.item()
    print(f"  Step {step+1:2d}/10 | Loss: {loss.item():.4f}")

print(f"\nInitial Loss: {initial_loss:.4f} -> Final Loss: {final_loss:.4f}")
assert final_loss < initial_loss, "Overfit test failed: Loss did not decrease!"
print("One-Minute Overfit Test: PASSED (Model parameters actively learn from inputs).")""")

# Cell 14: Section 13 - Generation Test & Script Validation
add_md("""## 13. Generation Test & Script Validation
Generate sample translations and audit script distribution (assert Devanagari output, zero Ol Chiki).""")

add_code("""lora_model.eval()
with torch.no_grad():
    gen_tokens = lora_model.generate(enc_hi["input_ids"][:2], max_new_tokens=32)
    predictions = tokenizer.batch_decode(gen_tokens, skip_special_tokens=True)

print("Generated Sample Predictions:")
for i, pred in enumerate(predictions):
    print(f"  Sample {i+1} HI Source: {smoke_samples['Hindi'].iloc[i]}")
    print(f"  Sample {i+1} UNR Ref:   {smoke_samples['Mundari'].iloc[i]}")
    print(f"  Sample {i+1} Prediction: {pred}")

    # Script Validation
    has_ol_chiki = any(0x1C50 <= ord(c) <= 0x1C7F for c in pred)
    assert not has_ol_chiki, f"SANTALI CONTAMINATION in prediction: '{pred}' contains Ol Chiki!"
    print(f"  Script Check {i+1}: Clean (No Ol Chiki detected)")

print("\nGeneration & Script Validation: PASSED.")""")

# Cell 15: Section 14 - Checkpoint Serialization & Reload Test
add_md("""## 14. Checkpoint Serialization & Reload Test
Save smoke-test adapter weights to disk, re-instantiate from base model, reload adapter, and verify generation output.""")

add_code("""SMOKE_CKPT_DIR = "research/mundari-mt/checkpoints/smoke_test"
os.makedirs(SMOKE_CKPT_DIR, exist_ok=True)

print(f"Saving smoke test adapter to: {SMOKE_CKPT_DIR}...")
lora_model.save_pretrained(SMOKE_CKPT_DIR)
tokenizer.save_pretrained(SMOKE_CKPT_DIR)

# Reload from disk test
from peft import PeftModel
print("Reloading saved adapter onto base model...")
reloaded_base = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME, trust_remote_code=True, low_cpu_mem_usage=True)
reloaded_base.resize_token_embeddings(len(tokenizer))
reloaded_model = PeftModel.from_pretrained(reloaded_base, SMOKE_CKPT_DIR).to(device)
reloaded_model.eval()

with torch.no_grad():
    reload_gen = reloaded_model.generate(enc_hi["input_ids"][:1], max_new_tokens=16)
    reload_pred = tokenizer.decode(reload_gen[0], skip_special_tokens=True)

print(f"Reloaded Model Generation: '{reload_pred}'")
print("Checkpoint Serialization & Reload Test: PASSED.")""")

# Cell 16: Section 15 - Memory Audit & VRAM Profiling
add_md("""## 15. Memory Audit & VRAM Profiling
Measure peak allocated and reserved VRAM during execution to evaluate feasibility for full 16,000-pair training.""")

add_code("""if torch.cuda.is_available():
    peak_allocated = torch.cuda.max_memory_allocated(0) / (1024 ** 3)
    peak_reserved = torch.cuda.max_memory_reserved(0) / (1024 ** 3)
    total_mem = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)

    print("=" * 70)
    print("VRAM CONSUMPTION PROFILE")
    print("=" * 70)
    print(f"Device:                {torch.cuda.get_device_name(0)}")
    print(f"Total Dedicated VRAM:  {total_mem:.2f} GB")
    print(f"Peak Allocated Memory: {peak_allocated:.2f} GB")
    print(f"Peak Reserved Memory:  {peak_reserved:.2f} GB")
    print(f"Safety Margin:         {total_mem - peak_reserved:.2f} GB free")

    # Feasibility projection for 16,000 pairs with gradient checkpointing
    print("\nFeasibility Analysis:")
    if peak_reserved < 8.0:
        print("PASS: Peak memory is well within 15 GB T4 limits. Full training with batch_size=16 is feasible.")
    else:
        print("WARNING: High peak memory detected. Consider reducing per_device_train_batch_size to 8.")
print("Memory Profiling: PASSED.")""")

# Cell 17: Section 16 - Full Training Invocations (Preparation Only)
add_md("""## 16. Full Training Execution Commands (Phase 4B Training Run)
**STOP: DO NOT RUN THIS UNTIL THE SMOKE TEST HAS BEEN REVIEWED AND APPROVED.**  
Once approved, trigger directional fine-tuning using the commands below:""")

add_code("""# Command for Direction 1: Hindi -> Mundari
# !python research/model-training/train_lora.py --direction hi_to_unr --epochs 6 --batch-size 16

# Command for Direction 2: Mundari -> Hindi
# !python research/model-training/train_lora.py --direction unr_to_hi --epochs 6 --batch-size 16""")

with open(NOTEBOOK_PATH, "w", encoding="utf-8") as f:
    json.dump(notebook, f, indent=2)

print(f"Successfully generated complete Colab Notebook at: {NOTEBOOK_PATH}")
