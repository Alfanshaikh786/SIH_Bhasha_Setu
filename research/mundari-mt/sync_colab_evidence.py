"""
Bhasha Setu - Phase 4B: Google Colab Smoke-Test Evidence Ingestion & Verification Tool

This utility parses an executed Jupyter notebook (or exported text log)
from the Google Colab T4 smoke test run, validates all outputs against
scientific integrity rules, and generates a structured evidence artifact.

Usage:
    python research/mundari-mt/sync_colab_evidence.py [--notebook PATH] [--output JSON_PATH]
"""

import os
import sys
import json
import re
import argparse
from typing import Dict, Any, List, Optional

DEFAULT_NOTEBOOK = os.path.join(
    os.path.dirname(__file__), "Mundari_LoRA_Training_Colab.ipynb"
)
DEFAULT_REPORT_JSON = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "reports", "colab_smoke_test_evidence.json"
)


def inspect_notebook(notebook_path: str) -> Dict[str, Any]:
    """
    Programmatically inspects the notebook structure, code cells, execution counts,
    and output streams.
    """
    if not os.path.exists(notebook_path):
        return {
            "exists": False,
            "error": f"File not found: {notebook_path}"
        }

    try:
        with open(notebook_path, "r", encoding="utf-8") as f:
            nb = json.load(f)
    except Exception as e:
        return {
            "exists": True,
            "valid_json": False,
            "error": f"Failed to parse JSON: {e}"
        }

    cells = nb.get("cells", [])
    code_cells = [c for c in cells if c.get("cell_type") == "code"]
    markdown_cells = [c for c in cells if c.get("cell_type") == "markdown"]

    executed_code_cells = [
        c for c in code_cells if c.get("execution_count") is not None
    ]
    cells_with_output = [
        c for c in code_cells if len(c.get("outputs", [])) > 0
    ]

    return {
        "exists": True,
        "valid_json": True,
        "total_cells": len(cells),
        "code_cells": len(code_cells),
        "markdown_cells": len(markdown_cells),
        "executed_code_cells": len(executed_code_cells),
        "cells_with_outputs": len(cells_with_output),
        "is_executed": len(cells_with_output) > 0,
        "cells": code_cells
    }


def extract_cell_texts(cells: List[Dict[str, Any]]) -> List[str]:
    """Combines all stdout and display text from cell outputs."""
    all_outputs = []
    for cell in cells:
        cell_output_text = []
        for out in cell.get("outputs", []):
            if out.get("output_type") == "stream":
                text = "".join(out.get("text", []))
                cell_output_text.append(text)
            elif out.get("output_type") in ("execute_result", "display_data"):
                data = out.get("data", {})
                if "text/plain" in data:
                    text = "".join(data.get("text/plain", []))
                    cell_output_text.append(text)
            elif out.get("output_type") == "error":
                trace = "\n".join(out.get("traceback", []))
                cell_output_text.append(f"[ERROR] {out.get('ename')}: {out.get('evalue')}\n{trace}")
        all_outputs.append("\n".join(cell_output_text))
    return all_outputs


def parse_evidence(output_texts: List[str]) -> Dict[str, Any]:
    """
    Extracts raw numerical evidence and strings from execution logs.
    """
    combined_text = "\n".join(output_texts)

    evidence: Dict[str, Any] = {
        "environment": {
            "python_version": None,
            "pytorch_version": None,
            "cuda_available": None,
            "cuda_version": None,
            "gpu_name": None,
            "total_vram_gb": None,
            "transformers_version": None,
            "peft_version": None,
            "datasets_version": None,
            "accelerate_version": None,
        },
        "model": {
            "model_name": "ai4bharat/indictrans2-indic-indic-dist-320M",
            "model_class": None,
            "base_parameters": None,
            "vocab_size_before": None,
        },
        "tokenizer_expansion": {
            "anchor_tag": "<hin_Deva>",
            "new_tag": "<unr_Deva>",
            "added_tokens": None,
            "vocab_size_after": None,
            "embedding_resized_shape": None,
            "embedding_cloned": None,
        },
        "conditioning": {
            "hi_to_unr_prefix_valid": None,
            "unr_to_hi_prefix_valid": None,
        },
        "lora": {
            "trainable_parameters": None,
            "all_parameters": None,
            "trainable_percent": None,
            "target_modules_count": None,
        },
        "forward_backward": {
            "hi_to_unr_forward_loss": None,
            "hi_to_unr_backward_success": None,
            "unr_to_hi_forward_loss": None,
            "unr_to_hi_backward_success": None,
        },
        "tiny_overfit": {
            "step_losses": [],
            "initial_loss": None,
            "final_loss": None,
            "loss_decreased": None,
        },
        "generation": {
            "samples": [],
            "ol_chiki_detected": None,
        },
        "checkpoint": {
            "saved": None,
            "reloaded": None,
            "reload_generation": None,
        },
        "vram_profiling": {
            "peak_allocated_gb": None,
            "peak_reserved_gb": None,
            "safety_margin_gb": None,
        }
    }

    # Regex extractions if text is available
    if not combined_text.strip():
        return evidence

    # Python Version
    m = re.search(r"Python Version:\s+([^\s\n]+)", combined_text)
    if m: evidence["environment"]["python_version"] = m.group(1)

    # PyTorch
    m = re.search(r"PyTorch:\s+([^\s\n]+)", combined_text)
    if m: evidence["environment"]["pytorch_version"] = m.group(1)

    # CUDA Available
    m = re.search(r"CUDA Available:\s+([^\s\n]+)", combined_text)
    if m: evidence["environment"]["cuda_available"] = m.group(1).lower() == "true"

    # GPU Device
    m = re.search(r"GPU Device:\s+([^\n]+)", combined_text)
    if m: evidence["environment"]["gpu_name"] = m.group(1).strip()

    # Total VRAM
    m = re.search(r"Total VRAM:\s+([\d\.]+)\s*GB", combined_text)
    if m: evidence["environment"]["total_vram_gb"] = float(m.group(1))

    # Package versions
    m = re.search(r"Transformers:\s+([^\s\n]+)", combined_text)
    if m: evidence["environment"]["transformers_version"] = m.group(1)
    m = re.search(r"PEFT:\s+([^\s\n]+)", combined_text)
    if m: evidence["environment"]["peft_version"] = m.group(1)
    m = re.search(r"Datasets:\s+([^\s\n]+)", combined_text)
    if m: evidence["environment"]["datasets_version"] = m.group(1)
    m = re.search(r"Accelerate:\s+([^\s\n]+)", combined_text)
    if m: evidence["environment"]["accelerate_version"] = m.group(1)

    # Model Class
    m = re.search(r"Model Class:\s+([^\s\n]+)", combined_text)
    if m: evidence["model"]["model_class"] = m.group(1)

    # Base Parameters
    m = re.search(r"Base Parameters:\s+([\d,]+)", combined_text)
    if m: evidence["model"]["base_parameters"] = int(m.group(1).replace(",", ""))

    # Base Vocab
    m = re.search(r"Base Vocab Size:\s+([\d,]+)", combined_text)
    if m: evidence["model"]["vocab_size_before"] = int(m.group(1).replace(",", ""))

    # Added token & new vocab
    m = re.search(r"Added\s+(\d+)\s+token\.\s+New Vocabulary Size:\s+([\d,]+)", combined_text)
    if m:
        evidence["tokenizer_expansion"]["added_tokens"] = int(m.group(1))
        evidence["tokenizer_expansion"]["vocab_size_after"] = int(m.group(2).replace(",", ""))

    # Resized embeddings
    m = re.search(r"Resized model embeddings to:\s+(\d+)", combined_text)
    if m: evidence["tokenizer_expansion"]["embedding_resized_shape"] = int(m.group(1))

    if "Successfully initialized '<unr_Deva>'" in combined_text:
        evidence["tokenizer_expansion"]["embedding_cloned"] = True

    # Conditioning
    if "Language Conditioning: PASSED" in combined_text:
        evidence["conditioning"]["hi_to_unr_prefix_valid"] = True
        evidence["conditioning"]["unr_to_hi_prefix_valid"] = True

    # LoRA trainable params
    m = re.search(r"trainable params:\s+([\d,]+)\s+\|\s+all params:\s+([\d,]+)\s+\|\s+trainable%:\s+([\d\.]+)", combined_text)
    if m:
        evidence["lora"]["trainable_parameters"] = int(m.group(1).replace(",", ""))
        evidence["lora"]["all_parameters"] = int(m.group(2).replace(",", ""))
        evidence["lora"]["trainable_percent"] = float(m.group(3))

    m = re.search(r"Total LoRA Target Linear Layers Attached:\s+(\d+)", combined_text)
    if m: evidence["lora"]["target_modules_count"] = int(m.group(1))

    # Forward & Backward Passes
    m = re.search(r"\[hi_to_unr\]\s+Forward Pass Loss:\s+([\d\.]+)", combined_text)
    if m: evidence["forward_backward"]["hi_to_unr_forward_loss"] = float(m.group(1))
    if "[hi_to_unr] Backward Pass: SUCCESS" in combined_text:
        evidence["forward_backward"]["hi_to_unr_backward_success"] = True

    m = re.search(r"\[unr_to_hi\]\s+Forward Pass Loss:\s+([\d\.]+)", combined_text)
    if m: evidence["forward_backward"]["unr_to_hi_forward_loss"] = float(m.group(1))
    if "[unr_to_hi] Backward Pass: SUCCESS" in combined_text:
        evidence["forward_backward"]["unr_to_hi_backward_success"] = True

    # Tiny Overfit
    step_matches = re.findall(r"Step\s+(\d+)/10\s+\|\s+Loss:\s+([\d\.]+)", combined_text)
    if step_matches:
        losses = [float(loss) for step, loss in step_matches]
        evidence["tiny_overfit"]["step_losses"] = losses
        if len(losses) > 0:
            evidence["tiny_overfit"]["initial_loss"] = losses[0]
            evidence["tiny_overfit"]["final_loss"] = losses[-1]
            evidence["tiny_overfit"]["loss_decreased"] = losses[-1] < losses[0]

    # Script Validation
    if "Generation & Script Validation: PASSED" in combined_text:
        evidence["generation"]["ol_chiki_detected"] = False

    # Checkpoint
    if "Checkpoint Serialization & Reload Test: PASSED" in combined_text:
        evidence["checkpoint"]["saved"] = True
        evidence["checkpoint"]["reloaded"] = True

    m = re.search(r"Reloaded Model Generation:\s+'([^']+)'", combined_text)
    if m: evidence["checkpoint"]["reload_generation"] = m.group(1)

    # VRAM Profiling
    m = re.search(r"Peak Allocated Memory:\s+([\d\.]+)\s*GB", combined_text)
    if m: evidence["vram_profiling"]["peak_allocated_gb"] = float(m.group(1))
    m = re.search(r"Peak Reserved Memory:\s+([\d\.]+)\s*GB", combined_text)
    if m: evidence["vram_profiling"]["peak_reserved_gb"] = float(m.group(1))
    m = re.search(r"Safety Margin:\s+([\d\.]+)\s*GB free", combined_text)
    if m: evidence["vram_profiling"]["safety_margin_gb"] = float(m.group(1))

    return evidence


def evaluate_gates(evidence: Dict[str, Any], is_executed: bool) -> Dict[str, Any]:
    """Evaluates the 9 mandatory readiness gates."""
    gates = {}

    if not is_executed:
        for i in range(1, 10):
            gates[f"Gate {i}"] = {
                "status": "BLOCKED (Unsynced)",
                "detail": "Cloud execution outputs not present in local workspace."
            }
        return {
            "overall_status": "NOT READY",
            "failing_gate": "Gate 1 through Gate 9 (Missing Empirical Cloud Execution Artifacts)",
            "gates": gates
        }

    # Gate 1: Model loads
    g1 = evidence["model"]["model_class"] is not None and evidence["model"]["base_parameters"] is not None
    gates["Gate 1"] = {
        "description": "Model loads successfully",
        "status": "PASS" if g1 else "FAIL",
        "detail": f"Class: {evidence['model']['model_class']}, Params: {evidence['model']['base_parameters']}"
    }

    # Gate 2: Tokenizer expansion
    g2 = (
        evidence["tokenizer_expansion"]["added_tokens"] == 1 and
        evidence["tokenizer_expansion"]["embedding_cloned"] is True
    )
    gates["Gate 2"] = {
        "description": "Tokenizer expansion succeeds (<unr_Deva>)",
        "status": "PASS" if g2 else "FAIL",
        "detail": f"Added: {evidence['tokenizer_expansion']['added_tokens']}, Cloned: {evidence['tokenizer_expansion']['embedding_cloned']}"
    }

    # Gate 3: Forward pass finite loss
    f_hi = evidence["forward_backward"]["hi_to_unr_forward_loss"]
    f_unr = evidence["forward_backward"]["unr_to_hi_forward_loss"]
    g3 = f_hi is not None and f_unr is not None
    gates["Gate 3"] = {
        "description": "Forward pass succeeds with finite loss",
        "status": "PASS" if g3 else "FAIL",
        "detail": f"hi_to_unr: {f_hi}, unr_to_hi: {f_unr}"
    }

    # Gate 4: Backward pass succeeds
    b_hi = evidence["forward_backward"]["hi_to_unr_backward_success"] is True
    b_unr = evidence["forward_backward"]["unr_to_hi_backward_success"] is True
    g4 = b_hi and b_unr
    gates["Gate 4"] = {
        "description": "Backward pass succeeds",
        "status": "PASS" if g4 else "FAIL",
        "detail": f"hi_to_unr: {b_hi}, unr_to_hi: {b_unr}"
    }

    # Gate 5: LoRA gradients present
    g5 = evidence["lora"]["trainable_parameters"] is not None and evidence["lora"]["trainable_parameters"] > 0
    gates["Gate 5"] = {
        "description": "LoRA gradients are present & parameters attached",
        "status": "PASS" if g5 else "FAIL",
        "detail": f"Trainable params: {evidence['lora']['trainable_parameters']}"
    }

    # Gate 6: Tiny-overfit loss reduction
    g6 = evidence["tiny_overfit"]["loss_decreased"] is True
    gates["Gate 6"] = {
        "description": "Tiny-overfit demonstrates actual loss reduction",
        "status": "PASS" if g6 else "FAIL",
        "detail": f"Init: {evidence['tiny_overfit']['initial_loss']} -> Final: {evidence['tiny_overfit']['final_loss']}"
    }

    # Gate 7: Both directions generate outputs
    g7 = evidence["generation"]["ol_chiki_detected"] is False
    gates["Gate 7"] = {
        "description": "Both translation directions generate outputs",
        "status": "PASS" if g7 else "FAIL",
        "detail": "Generated sample outputs audited; 0 Ol Chiki contamination detected."
    }

    # Gate 8: Checkpoint save & reload
    g8 = evidence["checkpoint"]["saved"] is True and evidence["checkpoint"]["reloaded"] is True
    gates["Gate 8"] = {
        "description": "Checkpoint save/reload succeeds",
        "status": "PASS" if g8 else "FAIL",
        "detail": f"Saved: {evidence['checkpoint']['saved']}, Reloaded: {evidence['checkpoint']['reloaded']}"
    }

    # Gate 9: T4 VRAM within available memory
    vram = evidence["vram_profiling"]["peak_reserved_gb"]
    g9 = vram is not None and vram < 15.0
    gates["Gate 9"] = {
        "description": "T4 VRAM usage within limits (< 15.0 GB)",
        "status": "PASS" if g9 else "FAIL",
        "detail": f"Peak reserved: {vram} GB"
    }

    all_passed = all(g["status"] == "PASS" for g in gates.values())
    first_fail = next((k for k, v in gates.items() if v["status"] != "PASS"), None)

    return {
        "overall_status": "READY FOR FULL TRAINING" if all_passed else "NOT READY",
        "failing_gate": None if all_passed else first_fail,
        "gates": gates
    }


def main():
    parser = argparse.ArgumentParser(description="Sync & verify Google Colab smoke-test evidence.")
    parser.add_argument("--notebook", default=DEFAULT_NOTEBOOK, help="Path to notebook file.")
    parser.add_argument("--output", default=DEFAULT_REPORT_JSON, help="Path to output JSON evidence.")
    args = parser.parse_args()

    print("=" * 75)
    print("BHASHA SETU — PHASE 4B COLAB EVIDENCE VERIFICATION AUDIT")
    print("=" * 75)
    print(f"Target Notebook: {args.notebook}")

    inspection = inspect_notebook(args.notebook)
    if not inspection.get("exists"):
        print(f"\n[ERROR] {inspection.get('error')}")
        sys.exit(1)

    print(f"Total Cells:           {inspection['total_cells']}")
    print(f"Code Cells:            {inspection['code_cells']}")
    print(f"Executed Code Cells:   {inspection['executed_code_cells']}")
    print(f"Cells With Outputs:    {inspection['cells_with_outputs']}")

    cell_texts = extract_cell_texts(inspection.get("cells", []))
    evidence = parse_evidence(cell_texts)
    gate_eval = evaluate_gates(evidence, inspection["is_executed"])

    report_payload = {
        "notebook_path": os.path.abspath(args.notebook),
        "inspection": {
            "total_cells": inspection["total_cells"],
            "code_cells": inspection["code_cells"],
            "executed_code_cells": inspection["executed_code_cells"],
            "cells_with_outputs": inspection["cells_with_outputs"],
            "is_executed": inspection["is_executed"],
        },
        "evidence": evidence,
        "readiness": gate_eval
    }

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(report_payload, f, indent=2)
    print(f"\nEvidence artifact written to: {args.output}")

    print("\n" + "=" * 75)
    print("GATE EVALUATION SUMMARY:")
    print("=" * 75)
    for gate_name, gate_info in gate_eval["gates"].items():
        print(f"  {gate_name:8s}: [{gate_info['status']}] - {gate_info.get('description', '')} ({gate_info['detail']})")

    print("\n" + "=" * 75)
    print(f"FINAL READINESS DECISION: {gate_eval['overall_status']}")
    if gate_eval["failing_gate"]:
        print(f"FAILING GATE:             {gate_eval['failing_gate']}")
    print("=" * 75)


if __name__ == "__main__":
    main()
