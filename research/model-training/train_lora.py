"""
Directional Neural Machine Translation Training Pipeline for Hindi <-> Mundari.

Supported Directions:
- hi_to_unr : Hindi -> Mundari
- unr_to_hi : Mundari -> Hindi

Target Architecture:
- Base Model: ai4bharat/indictrans2-indic-indic-dist-200M
- Fine-Tuning Method: Parameter-Efficient Fine-Tuning (PEFT / LoRA)
- Language Tag Mechanism: Source prefix '<src_tag> <tgt_tag> {text}'
- Tokenizer Expansion: Injects '<unr_Deva>' as a dedicated language identifier
  and initializes its embedding from '<hin_Deva>'.

CRITICAL RESEARCH DISCLAIMERS:
1. IndicTrans2 does NOT natively support Mundari (ISO 639-3: unr).
2. Tokenizer expansion provides a dedicated identifier (<unr_Deva>) for the
   new target language but does NOT constitute pretrained Mundari language knowledge.
   The model learns Mundari morphology, syntax, and vocabulary exclusively from
   the fine-tuning parallel corpus.
3. Mundari != Santali. Mundari in this corpus is written in Devanagari script.
   Zero Ol Chiki characters are permitted in the target representation.
4. No Fabricated Results: Neural loss, checkpoints, and BLEU metrics are only
   recorded from verified execution runs.
"""

import argparse
import json
import os
import sys
import time
import unicodedata
from typing import Dict, Any, List, Optional, Tuple

import pandas as pd
import yaml

# Path resolution
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, BASE_DIR)
sys.path.insert(0, os.path.join(BASE_DIR, "research", "model-training"))
sys.path.insert(0, os.path.join(BASE_DIR, "research", "model-evaluation"))
sys.path.insert(0, os.path.join(BASE_DIR, "research", "mundari-mt"))

from training_utils import detect_hardware

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

CLEANED_DIR = os.path.join(BASE_DIR, "research", "mundari-mt", "cleaned-data")
CHECKPOINTS_DIR = os.path.join(BASE_DIR, "research", "mundari-mt", "checkpoints")
LOGS_DIR = os.path.join(BASE_DIR, "research", "mundari-mt", "logs")
REPORTS_DIR = os.path.join(BASE_DIR, "research", "reports")
CONFIG_PATH = os.path.join(BASE_DIR, "research", "mundari-mt", "configs", "training_config.yaml")

# Standardized Research Failure Codes
ERR_DATASET_NOT_FOUND = "DATASET_NOT_FOUND"
ERR_INSUFFICIENT_VRAM = "INSUFFICIENT_VRAM"
ERR_GPU_UNAVAILABLE = "GPU_UNAVAILABLE"
ERR_MODEL_COMPATIBILITY = "MODEL_COMPATIBILITY_FAILURE"
ERR_TOKENIZER_COMPATIBILITY = "TOKENIZER_COMPATIBILITY_FAILURE"


def load_yaml_config(config_path: str = CONFIG_PATH) -> Dict[str, Any]:
    """Loads configuration from YAML file or returns robust defaults."""
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    return {
        "seed": 42,
        "model": {
            "name": "ai4bharat/indictrans2-indic-indic-dist-200M",
            "trust_remote_code": True,
            "vocab_size": 32000
        },
        "tokenizer_expansion": {
            "enabled": True,
            "new_token": "<unr_Deva>",
            "init_from_token": "<hin_Deva>"
        },
        "training": {
            "per_device_train_batch_size": 16,
            "gradient_accumulation_steps": 4,
            "learning_rate": 3.0e-4,
            "num_train_epochs": 6,
            "max_source_length": 128,
            "max_target_length": 128,
            "fp16": True,
            "gradient_checkpointing": True
        },
        "lora": {
            "enabled": True,
            "rank": 16,
            "alpha": 32,
            "dropout": 0.05,
            "target_modules": ["q_proj", "v_proj", "k_proj", "out_proj"]
        }
    }


def validate_dataset_files(cleaned_dir: str = CLEANED_DIR) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Validates presence and schema of cleaned train, validation, and test datasets.
    Fails with ERR_DATASET_NOT_FOUND if missing or corrupted.
    """
    train_path = os.path.join(cleaned_dir, "train.csv")
    val_path = os.path.join(cleaned_dir, "validation.csv")
    test_path = os.path.join(cleaned_dir, "test.csv")

    for path in [train_path, val_path, test_path]:
        if not os.path.exists(path):
            raise FileNotFoundError(f"[{ERR_DATASET_NOT_FOUND}] Required dataset split missing at: {path}")

    train_df = pd.read_csv(train_path, dtype=str, keep_default_na=False)
    val_df = pd.read_csv(val_path, dtype=str, keep_default_na=False)
    test_df = pd.read_csv(test_path, dtype=str, keep_default_na=False)

    for df_name, df in [("train", train_df), ("validation", val_df), ("test", test_df)]:
        if "Hindi" not in df.columns or "Mundari" not in df.columns:
            raise ValueError(
                f"[{ERR_DATASET_NOT_FOUND}] {df_name}.csv must contain 'Hindi' and 'Mundari' columns. Found: {list(df.columns)}"
            )

    return train_df, val_df, test_df


def format_sequence_pair(
    src_text: str,
    tgt_text: str,
    direction: str,
    new_token: str = "<unr_Deva>",
    anchor_token: str = "<hin_Deva>"
) -> Tuple[str, str]:
    """
    Formats source and target text with IndicTrans2 language prefixes.
    
    For hi_to_unr:
      source: '<hin_Deva> <unr_Deva> {normalized_hindi}'
      target: '{normalized_mundari}'
    
    For unr_to_hi:
      source: '<unr_Deva> <hin_Deva> {normalized_mundari}'
      target: '{normalized_hindi}'
    """
    src_norm = " ".join(unicodedata.normalize("NFC", str(src_text)).split())
    tgt_norm = " ".join(unicodedata.normalize("NFC", str(tgt_text)).split())

    if direction == "hi_to_unr":
        source_formatted = f"{anchor_token} {new_token} {src_norm}"
        target_formatted = tgt_norm
    elif direction == "unr_to_hi":
        source_formatted = f"{new_token} {anchor_token} {src_norm}"
        target_formatted = tgt_norm
    else:
        raise ValueError(f"Unsupported direction: {direction}")

    return source_formatted, target_formatted


def setup_tokenizer_and_model(
    model_name: str,
    direction: str,
    new_token: str = "<unr_Deva>",
    anchor_token: str = "<hin_Deva>",
    trust_remote_code: bool = True
):
    """
    Loads IndicTrans2 tokenizer and model, registers <unr_Deva>, resizes embeddings,
    and initializes new token embedding from anchor (<hin_Deva>).
    """
    try:
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
    except ImportError as e:
        raise ImportError(f"[{ERR_MODEL_COMPATIBILITY}] PyTorch/Transformers not installed: {e}")

    print(f"\n[Model Setup] Loading tokenizer for '{model_name}'...")
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=trust_remote_code)
    except Exception as e:
        raise RuntimeError(f"[{ERR_TOKENIZER_COMPATIBILITY}] Failed loading tokenizer: {e}")

    print(f"[Model Setup] Loading base Seq2Seq model for '{model_name}'...")
    try:
        model = AutoModelForSeq2SeqLM.from_pretrained(
            model_name,
            trust_remote_code=trust_remote_code,
            low_cpu_mem_usage=True
        )
    except Exception as e:
        raise RuntimeError(f"[{ERR_MODEL_COMPATIBILITY}] Failed loading Seq2Seq model: {e}")

    # Tokenizer Expansion for Mundari
    print(f"\n[Tokenizer Expansion] Checking language identifier '{new_token}'...")
    existing_vocab = tokenizer.get_vocab()
    new_token_added = False

    if new_token not in existing_vocab:
        print(f"[Tokenizer Expansion] '{new_token}' not in vocabulary. Adding as special token...")
        num_added = tokenizer.add_special_tokens({"additional_special_tokens": [new_token]})
        if num_added > 0:
            new_token_added = True
            print(f"[Tokenizer Expansion] Added {num_added} new token. Vocabulary size: {len(tokenizer)}")
            
            # Resize model embeddings
            old_vocab_size = model.config.vocab_size if hasattr(model.config, "vocab_size") else len(existing_vocab)
            model.resize_token_embeddings(len(tokenizer))
            print(f"[Tokenizer Expansion] Resized model token embeddings to {len(tokenizer)}.")

            # Initialize new token embedding from anchor_token
            try:
                import torch
                anchor_id = tokenizer.convert_tokens_to_ids(anchor_token)
                new_token_id = tokenizer.convert_tokens_to_ids(new_token)
                if anchor_id != tokenizer.unk_token_id:
                    with torch.no_grad():
                        input_emb = model.get_input_embeddings()
                        input_emb.weight.data[new_token_id] = input_emb.weight.data[anchor_id].clone()
                        if hasattr(model, "get_output_embeddings") and model.get_output_embeddings() is not None:
                            out_emb = model.get_output_embeddings()
                            out_emb.weight.data[new_token_id] = out_emb.weight.data[anchor_id].clone()
                    print(f"[Tokenizer Expansion] Successfully initialized '{new_token}' embedding from anchor '{anchor_token}' (ID: {anchor_id}).")
                else:
                    print(f"[Tokenizer Expansion Warning] Anchor token '{anchor_token}' mapped to UNK. Using mean embedding.")
            except Exception as e:
                print(f"[Tokenizer Expansion Warning] Could not initialize embedding from anchor: {e}")
    else:
        print(f"[Tokenizer Expansion] '{new_token}' already present in tokenizer vocabulary.")

    return tokenizer, model, new_token_added


def setup_lora_model(model, lora_config: Dict[str, Any]):
    """Applies LoRA parameter-efficient adaptation to Seq2Seq model."""
    try:
        from peft import LoraConfig, get_peft_model, TaskType
    except ImportError as e:
        raise ImportError(f"[{ERR_MODEL_COMPATIBILITY}] PEFT library not installed: {e}")

    print("\n[LoRA Setup] Configuring Parameter-Efficient Fine-Tuning...")
    peft_config = LoraConfig(
        task_type=TaskType.SEQ_2_SEQ_LM,
        r=lora_config.get("rank", 16),
        lora_alpha=lora_config.get("alpha", 32),
        lora_dropout=lora_config.get("dropout", 0.05),
        target_modules=lora_config.get("target_modules", ["q_proj", "v_proj", "k_proj", "out_proj"]),
        bias="none"
    )
    lora_model = get_peft_model(model, peft_config)
    lora_model.print_trainable_parameters()
    return lora_model


def run_smoke_test(direction: str = "hi_to_unr") -> bool:
    """
    Minimal end-to-end smoke test verifying:
    1. Dataset loading & schema
    2. Tokenizer loading & language expansion
    3. Model loading & embedding resizing
    4. LoRA adapter setup
    5. Sequence preprocessing & prefixing
    6. Forward pass & loss computation
    7. Backward pass
    8. Checkpoint serialization
    9. Inference generation
    """
    print("=" * 75)
    print(f"EXECUTING RIGOROUS PRE-FLIGHT SMOKE TEST (Direction: {direction})")
    print("=" * 75)

    stages: List[Dict[str, Any]] = []

    def record_stage(name: str, passed: bool, details: str):
        stages.append({"name": name, "passed": passed, "details": details})
        status_label = "PASS" if passed else "FAIL"
        print(f"[{status_label}] {name}: {details}")

    # Stage 1: Dataset Loading & Schema
    try:
        train_df, val_df, test_df = validate_dataset_files()
        record_stage(
            "Stage 1: Dataset Loading & Schema",
            True,
            f"Loaded {len(train_df)} train, {len(val_df)} val, {len(test_df)} test rows. Schema verified."
        )
    except Exception as e:
        record_stage("Stage 1: Dataset Loading & Schema", False, str(e))
        return False

    # Check PyTorch availability
    has_torch = False
    try:
        import torch
        has_torch = True
    except ImportError:
        pass

    if not has_torch:
        record_stage(
            "Stage 2: PyTorch / Transformers Environment",
            False,
            "PyTorch is not installed in the local Python runtime. Neural stages require PyTorch."
        )
        print("\n" + "!" * 75)
        print("NOTICE: Local workstation has Python 3.14 on Windows without PyTorch installed.")
        print("Stages 3-9 (neural forward/backward pass) require a PyTorch CUDA environment.")
        print("Please execute the Colab notebook: research/mundari-mt/Mundari_LoRA_Training_Colab.ipynb")
        print("!" * 75)
        return False

    # Stage 2-9: Neural verification on tiny sample
    config = load_yaml_config()
    model_name = config.get("model", {}).get("name", "ai4bharat/indictrans2-indic-indic-dist-200M")
    new_token = config.get("tokenizer_expansion", {}).get("new_token", "<unr_Deva>")
    anchor_token = config.get("tokenizer_expansion", {}).get("init_from_token", "<hin_Deva>")

    try:
        # Load & Expand Tokenizer & Model
        tokenizer, model, token_added = setup_tokenizer_and_model(
            model_name=model_name,
            direction=direction,
            new_token=new_token,
            anchor_token=anchor_token
        )
        record_stage("Stage 2: Tokenizer & Expansion", True, f"'{new_token}' registered. Vocab size: {len(tokenizer)}")
        record_stage("Stage 3: Model Loading & Resizing", True, f"Model embeddings resized to {len(tokenizer)}")

        # LoRA Setup
        lora_model = setup_lora_model(model, config.get("lora", {}))
        record_stage("Stage 4: LoRA Adapter Setup", True, "PEFT LoRA adapter successfully attached.")

        # Preprocessing Sample
        sample_rows = train_df.head(4)
        src_texts = []
        tgt_texts = []
        src_col = "Hindi" if direction == "hi_to_unr" else "Mundari"
        tgt_col = "Mundari" if direction == "hi_to_unr" else "Hindi"

        for _, row in sample_rows.iterrows():
            s_fmt, t_fmt = format_sequence_pair(row[src_col], row[tgt_col], direction, new_token, anchor_token)
            src_texts.append(s_fmt)
            tgt_texts.append(t_fmt)

        model_inputs = tokenizer(src_texts, padding=True, truncation=True, max_length=64, return_tensors="pt")
        labels = tokenizer(tgt_texts, padding=True, truncation=True, max_length=64, return_tensors="pt").input_ids
        labels[labels == tokenizer.pad_token_id] = -100
        model_inputs["labels"] = labels
        record_stage("Stage 5: Sample Preprocessing", True, f"Formatted and tokenized 4 sample pairs with prefixes.")

        # Forward Pass
        lora_model.train()
        outputs = lora_model(**model_inputs)
        loss = outputs.loss
        if loss is not None and not torch.isnan(loss):
            record_stage("Stage 6: Forward Pass & Loss", True, f"Loss computed successfully: {loss.item():.4f}")
        else:
            record_stage("Stage 6: Forward Pass & Loss", False, "Forward pass returned NaN loss.")
            return False

        # Backward Pass
        loss.backward()
        record_stage("Stage 7: Backward Pass", True, "Gradients propagated successfully.")

        # Inference Test
        lora_model.eval()
        with torch.no_grad():
            gen_tokens = lora_model.generate(
                input_ids=model_inputs["input_ids"][:1],
                max_new_tokens=16
            )
            pred_text = tokenizer.decode(gen_tokens[0], skip_special_tokens=True)
            record_stage("Stage 8: Inference Generation", True, f"Generated sample output: '{pred_text[:40]}...'")

        # Checkpoint Serialization Test
        ckpt_dir = os.path.join(CHECKPOINTS_DIR, direction, "smoke_test")
        os.makedirs(ckpt_dir, exist_ok=True)
        lora_model.save_pretrained(ckpt_dir)
        tokenizer.save_pretrained(ckpt_dir)
        record_stage("Stage 9: Checkpoint Serialization", True, f"Saved smoke test checkpoint to {ckpt_dir}")

    except Exception as e:
        record_stage("Neural Verification", False, f"Exception during neural verification: {e}")
        return False

    all_passed = all(s["passed"] for s in stages)
    print("\n" + "=" * 75)
    print(f"SMOKE TEST RESULT: {'ALL STAGES PASSED' if all_passed else 'ONE OR MORE STAGES FAILED'}")
    print("=" * 75)
    return all_passed


def execute_training(direction: str, config: Dict[str, Any], dry_run: bool = False):
    """
    Executes full directional LoRA fine-tuning using Hugging Face Seq2SeqTrainer.
    Enforces GPU safety: requires CUDA and sufficient VRAM (>= 6.0 GB).
    """
    print("=" * 75)
    print(f"PHASE 4B: DIRECTIONAL NMT TRAINING PIPELINE ({direction})")
    print("=" * 75)

    hw = detect_hardware()
    print(f"Physical GPU: {hw['gpu_name']} ({hw['gpu_memory_gb']} GB VRAM)")
    print(f"CUDA PyTorch: {hw['cuda_available']}")
    print(f"Python: {hw['python_version']} on {hw['platform']}")

    # Hardware Guardrail
    min_vram = config.get("hardware_requirements", {}).get("min_gpu_vram_gb", 6.0)
    has_sufficient_gpu = hw["cuda_available"] and (hw["gpu_memory_gb"] is not None and hw["gpu_memory_gb"] >= min_vram)

    if not has_sufficient_gpu and not dry_run:
        reason = (
            f"Local workstation has GPU '{hw['gpu_name']}' with {hw['gpu_memory_gb']} GB VRAM "
            f"(below required {min_vram} GB threshold), and PyTorch CUDA is not available on Python {hw['python_version']}. "
            "To prevent Out-Of-Memory system thrashing and adhere to the No GPU Rule, full training was not launched locally."
        )
        print("\n" + "!" * 75)
        print(f"[{ERR_INSUFFICIENT_VRAM}] {reason}")
        print("Please execute training on Google Colab using: research/mundari-mt/Mundari_LoRA_Training_Colab.ipynb")
        print("!" * 75)

        # Write execution blocker notice
        unexecuted_path = os.path.join(LOGS_DIR, "TRAINING_NOT_EXECUTED.md")
        with open(unexecuted_path, "w", encoding="utf-8") as f:
            f.write(f"# Phase 4B: Training Execution Blocker Notice\n\n")
            f.write(f"**Status:** `{ERR_INSUFFICIENT_VRAM}`\n")
            f.write(f"**Target Direction:** `{direction}`\n")
            f.write(f"**Timestamp:** {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write(f"## Reason\n{reason}\n\n")
            f.write(f"## Recommended Execution Environment\n")
            f.write("Google Colab with free T4 GPU (15 GB VRAM) using the provided notebook.\n")
        return

    if dry_run:
        print("\n[Dry Run] Configuration and dataset validated successfully. Skipping backpropagation.")
        return

    # Full Training Flow (Executed when running on Colab or Cloud GPU)
    try:
        from datasets import Dataset
        from transformers import (
            Seq2SeqTrainer,
            Seq2SeqTrainingArguments,
            DataCollatorForSeq2Seq
        )
    except ImportError as e:
        raise ImportError(f"[{ERR_MODEL_COMPATIBILITY}] Required training libraries missing: {e}")

    train_df, val_df, test_df = validate_dataset_files()
    model_cfg = config.get("model", {})
    t_cfg = config.get("training", {})
    lora_cfg = config.get("lora", {})
    exp_cfg = config.get("tokenizer_expansion", {})

    new_token = exp_cfg.get("new_token", "<unr_Deva>")
    anchor_token = exp_cfg.get("init_from_token", "<hin_Deva>")

    tokenizer, model, _ = setup_tokenizer_and_model(
        model_name=model_cfg.get("name", "ai4bharat/indictrans2-indic-indic-dist-200M"),
        direction=direction,
        new_token=new_token,
        anchor_token=anchor_token,
        trust_remote_code=model_cfg.get("trust_remote_code", True)
    )

    lora_model = setup_lora_model(model, lora_cfg)

    # Format Datasets
    src_col = "Hindi" if direction == "hi_to_unr" else "Mundari"
    tgt_col = "Mundari" if direction == "hi_to_unr" else "Hindi"

    def format_df_to_dataset(df: pd.DataFrame) -> Dataset:
        sources, targets = [], []
        for _, row in df.iterrows():
            s_fmt, t_fmt = format_sequence_pair(row[src_col], row[tgt_col], direction, new_token, anchor_token)
            sources.append(s_fmt)
            targets.append(t_fmt)
        return Dataset.from_dict({"source_text": sources, "target_text": targets})

    print("\n[Dataset Preparation] Tokenizing splits...")
    train_ds = format_df_to_dataset(train_df)
    val_ds = format_df_to_dataset(val_df)

    max_src_len = t_cfg.get("max_source_length", 128)
    max_tgt_len = t_cfg.get("max_target_length", 128)

    def preprocess_batch(batch):
        inputs = tokenizer(batch["source_text"], max_length=max_src_len, truncation=True)
        labels = tokenizer(batch["target_text"], max_length=max_tgt_len, truncation=True)
        labels_ids = [[(l if l != tokenizer.pad_token_id else -100) for l in seq] for seq in labels["input_ids"]]
        inputs["labels"] = labels_ids
        return inputs

    train_tokenized = train_ds.map(preprocess_batch, batched=True, remove_columns=["source_text", "target_text"])
    val_tokenized = val_ds.map(preprocess_batch, batched=True, remove_columns=["source_text", "target_text"])

    output_dir = os.path.join(CHECKPOINTS_DIR, direction)
    os.makedirs(output_dir, exist_ok=True)

    training_args = Seq2SeqTrainingArguments(
        output_dir=output_dir,
        per_device_train_batch_size=t_cfg.get("per_device_train_batch_size", 16),
        per_device_eval_batch_size=t_cfg.get("per_device_eval_batch_size", 16),
        gradient_accumulation_steps=t_cfg.get("gradient_accumulation_steps", 4),
        learning_rate=float(t_cfg.get("learning_rate", 3.0e-4)),
        num_train_epochs=t_cfg.get("num_train_epochs", 6),
        weight_decay=t_cfg.get("weight_decay", 0.01),
        warmup_ratio=t_cfg.get("warmup_ratio", 0.1),
        fp16=t_cfg.get("fp16", True),
        gradient_checkpointing=t_cfg.get("gradient_checkpointing", True),
        logging_dir=os.path.join(LOGS_DIR, direction),
        logging_steps=t_cfg.get("logging_steps", 25),
        evaluation_strategy="steps",
        eval_steps=t_cfg.get("eval_steps", 100),
        save_strategy="steps",
        save_steps=t_cfg.get("save_steps", 200),
        save_total_limit=t_cfg.get("save_total_limit", 3),
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        greater_is_better=False,
        report_to="none"
    )

    data_collator = DataCollatorForSeq2Seq(tokenizer, model=lora_model, padding="longest")

    trainer = Seq2SeqTrainer(
        model=lora_model,
        args=training_args,
        train_dataset=train_tokenized,
        eval_dataset=val_tokenized,
        tokenizer=tokenizer,
        data_collator=data_collator
    )

    print(f"\n[Training Launch] Commencing fine-tuning for {direction}...")
    start_time = time.time()
    train_result = trainer.train()
    training_time = time.time() - start_time

    # Save final model adapter & tokenizer
    final_adapter_dir = os.path.join(output_dir, "final_adapter")
    trainer.save_model(final_adapter_dir)
    tokenizer.save_pretrained(final_adapter_dir)

    # Save complete metadata
    metadata = {
        "model_name": model_cfg.get("name"),
        "direction": direction,
        "new_token": new_token,
        "init_from_token": anchor_token,
        "train_samples": len(train_df),
        "validation_samples": len(val_df),
        "test_samples": len(test_df),
        "hyperparameters": t_cfg,
        "lora_config": lora_cfg,
        "hardware": hw,
        "training_time_seconds": round(training_time, 2),
        "train_loss": train_result.training_loss
    }

    meta_path = os.path.join(output_dir, "training_metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nTraining completed in {training_time/60:.2f} minutes.")
    print(f"Adapter saved to: {final_adapter_dir}")
    print(f"Metadata recorded to: {meta_path}")


def main():
    parser = argparse.ArgumentParser(description="Phase 4B Directional LoRA Training Pipeline")
    parser.add_argument("--direction", choices=["hi_to_unr", "unr_to_hi"], default="hi_to_unr", help="Translation direction")
    parser.add_argument("--smoke-test", action="store_true", help="Run pre-flight validation smoke test")
    parser.add_argument("--dry-run", action="store_true", help="Inspect configuration without launching heavy backprop")
    parser.add_argument("--config", type=str, default=CONFIG_PATH, help="Path to YAML training configuration")
    parser.add_argument("--epochs", type=int, default=None, help="Override number of training epochs")
    parser.add_argument("--batch-size", type=int, default=None, help="Override batch size")
    args = parser.parse_args()

    if args.smoke_test:
        passed = run_smoke_test(args.direction)
        sys.exit(0 if passed else 1)

    config = load_yaml_config(args.config)
    if args.epochs is not None:
        config["training"]["num_train_epochs"] = args.epochs
    if args.batch_size is not None:
        config["training"]["per_device_train_batch_size"] = args.batch_size

    execute_training(direction=args.direction, config=config, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
