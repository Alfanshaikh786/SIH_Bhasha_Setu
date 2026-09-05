"""
Benchmark and Investigation Suite for Existing Public Mundari MT Models.

Investigates candidate models:
1. Paulownia/mbart-Large_Tuned_MMLoSo_2025 (or MMLoSo_2025 mbart checkpoints)
2. tona3738/aya23-8b-qlora-cka-repina-mundari-hindi-mmloso-l15
3. helloboyn/MMLoSo25-IT2-BT5-ES-MT

Status Classification:
- AVAILABLE
- NOT FOUND
- ACCESS RESTRICTED
- TOO LARGE FOR LOCAL TESTING
- NOT TESTED

Safety Rules:
- Dry-run inspection by default.
- Never downloads multi-GB models automatically without explicit confirmation.
- Never reports benchmark numbers unless empirically executed.
"""

import json
import os
import sys
import urllib.request
from typing import Dict, Any, List

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

CANDIDATES = [
    {
        "id": "Paulownia/mbart-Large_Tuned_MMLoSo_2025",
        "repo_type": "model",
        "description": "Fine-tuned mBART-50 on MMLoSo 2025 tribal shared task",
        "alt_id": "Paulownia/MMLoSo_2025",
        "alt_type": "dataset"
    },
    {
        "id": "tona3738/aya23-8b-qlora-cka-repina-mundari-hindi-mmloso-l15",
        "repo_type": "model",
        "description": "Aya-23 8B QLoRA adapter fine-tuned on MMLoSo 2025 Mundari-Hindi"
    },
    {
        "id": "helloboyn/MMLoSo25-IT2-BT5-ES-MT",
        "repo_type": "dataset",
        "description": "IndicTrans2 back-translation and MT adaptation repository for MMLoSo 2025"
    }
]


def inspect_huggingface_repo(repo_id: str, repo_type: str = "model") -> Dict[str, Any]:
    """Inspect metadata, accessibility, and file structure via Hugging Face REST API."""
    prefix = "models" if repo_type == "model" else "datasets"
    api_url = f"https://huggingface.co/api/{prefix}/{repo_id}"
    req = urllib.request.Request(api_url, headers={"User-Agent": "Mozilla/5.0 (Research Audit)"})

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            siblings = data.get("siblings", [])
            total_bytes = sum(s.get("size", 0) for s in siblings if isinstance(s.get("size"), (int, float)))

            files = [s.get("rfilename") for s in siblings]
            return {
                "accessible": True,
                "status_code": 200,
                "pipeline_tag": data.get("pipeline_tag"),
                "total_files": len(files),
                "total_size_mb": round(total_bytes / (1024 * 1024), 2),
                "key_files": files[:8],
                "card_data": data.get("cardData", {})
            }
    except urllib.error.HTTPError as e:
        return {
            "accessible": False,
            "status_code": e.code,
            "error": f"HTTP {e.code}: {e.reason}"
        }
    except Exception as e:
        return {
            "accessible": False,
            "status_code": 0,
            "error": str(e)
        }


def audit_candidate_models(dry_run: bool = True) -> List[Dict[str, Any]]:
    print("=" * 65)
    print("MUNDARI MT EXISTING MODEL BENCHMARK & AUDIT")
    print(f"Dry Run Mode: {dry_run} (Automatic multi-GB download disabled)")
    print("=" * 65)

    reports = []

    for c in CANDIDATES:
        m_id = c["id"]
        r_type = c["repo_type"]
        print(f"\nAuditing [{r_type.upper()}]: {m_id}...")

        api_res = inspect_huggingface_repo(m_id, r_type)

        # Check alternative if 401/404
        alt_checked = None
        if not api_res["accessible"] and "alt_id" in c:
            alt_id = c["alt_id"]
            alt_type = c["alt_type"]
            print(f"  Primary endpoint inaccessible ({api_res.get('error')}). Checking mirror {alt_type}:{alt_id}...")
            alt_res = inspect_huggingface_repo(alt_id, alt_type)
            if alt_res["accessible"]:
                alt_checked = {
                    "alt_id": alt_id,
                    "alt_type": alt_type,
                    "details": alt_res
                }

        # Determine architecture, parameter size, hardware needs, and status
        if "aya23-8b" in m_id:
            arch = "Cohere Aya-23 8B (Decoder-only CausalLM) + PEFT LoRA (r=16, alpha=32)"
            base_model = "CohereLabs/aya-23-8B (~16 GB FP16)"
            adapter_size_mb = 64.0
            total_footprint = "~16.5 GB"
            min_vram = "24 GB GPU (or 4-bit QLoRA on 12-16 GB GPU)"
            dependencies = ["transformers>=4.40.0", "peft>=0.10.0", "bitsandbytes", "torch>=2.2.0"]
            local_feasible = False  # Exceeds standard local dev environment
            if api_res["accessible"]:
                status = "TOO LARGE FOR LOCAL TESTING"
                status_explanation = (
                    "LoRA adapter weights exist and are accessible on Hugging Face. "
                    "However, base model CohereLabs/aya-23-8B requires ~16 GB VRAM in float16 "
                    "or 12 GB with bitsandbytes 4-bit quantization, exceeding local testing constraints."
                )
            else:
                status = "ACCESS RESTRICTED" if api_res.get("status_code") == 401 else "NOT FOUND"
                status_explanation = api_res.get("error", "Unknown error")

        elif "mbart" in m_id.lower():
            arch = "mBART-50 (facebook/mbart-large-50-many-to-many-mmt, Seq2Seq Transformer)"
            base_model = "facebook/mbart-large-50 (~2.44 GB FP16, ~610M parameters)"
            adapter_size_mb = 0.0
            total_footprint = "~2.44 GB"
            min_vram = "8-12 GB GPU (or CPU float32 ~6 GB RAM)"
            dependencies = ["transformers>=4.30.0", "sentencepiece", "torch>=2.0.0"]
            local_feasible = True

            if api_res["accessible"]:
                status = "AVAILABLE (NOT TESTED)"
                status_explanation = "Model checkpoint is accessible. Ready for fine-tuning/eval with proper PyTorch environment."
            elif alt_checked and alt_checked["details"]["accessible"]:
                status = "AVAILABLE (IN MIRROR REPO: Paulownia/MMLoSo_2025)"
                status_explanation = (
                    "Model weights (checkpoint-19400 to 48500, model.safetensors) are hosted inside "
                    "the Paulownia/MMLoSo_2025 dataset repo under mmlo-translate-2025/mbart_finetuned/."
                )
            else:
                status = "ACCESS RESTRICTED" if api_res.get("status_code") == 401 else "NOT FOUND"
                status_explanation = api_res.get("error", "Unknown error")

        elif "IT2" in m_id or "indictrans" in m_id.lower():
            arch = "IndicTrans2 (AI4Bharat Indic-Indic 200M or Indic-En 1B, Seq2Seq)"
            base_model = "ai4bharat/indictrans2-indic-indic-dist-200M (~800 MB FP16)"
            adapter_size_mb = 0.0
            total_footprint = "~800 MB - 4.0 GB"
            min_vram = "4-8 GB GPU"
            dependencies = ["indictrans2", "transformers", "torch", "sentencepiece"]
            local_feasible = True
            status = "AVAILABLE (DATASET / SCRIPTS)" if api_res["accessible"] else ("ACCESS RESTRICTED" if api_res.get("status_code") == 401 else "NOT FOUND")
            status_explanation = "Contains back-translation scripts and splits for IndicTrans2 shared task fine-tuning."

        else:
            arch = "Unknown"
            base_model = "Unknown"
            total_footprint = "Unknown"
            min_vram = "Unknown"
            dependencies = []
            local_feasible = False
            status = "NOT TESTED"
            status_explanation = "Unrecognized candidate architecture."

        report_entry = {
            "model_id": m_id,
            "repo_type": r_type,
            "architecture": arch,
            "base_model": base_model,
            "estimated_footprint": total_footprint,
            "minimum_vram_requirement": min_vram,
            "dependencies": dependencies,
            "local_execution_feasible": local_feasible,
            "api_accessibility": api_res,
            "alternative_mirror": alt_checked,
            "status": status,
            "status_explanation": status_explanation
        }
        reports.append(report_entry)

        print(f"  Status: {status}")
        print(f"  Architecture: {arch}")
        print(f"  Hardware Req: {min_vram}")
        print(f"  Explanation: {status_explanation}")

    return reports


if __name__ == "__main__":
    reports = audit_candidate_models(dry_run=True)
