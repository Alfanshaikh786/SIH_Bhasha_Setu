"""
Training Utilities & Hardware Probing for Phase 4B Neural MT Pipeline.

Features:
- Empirical Hardware Detection (CUDA, GPU model, VRAM, System RAM)
- Exports research/mundari-mt/logs/hardware_report.json
- Data collation & sequence-to-sequence formatting
- Metric logging & checkpoint management
"""

import json
import os
import platform
import subprocess
import sys
from typing import Dict, Any, Optional

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

LOGS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "mundari-mt", "logs"))
HARDWARE_REPORT_PATH = os.path.join(LOGS_DIR, "hardware_report.json")


def detect_hardware() -> Dict[str, Any]:
    """
    Empirically inspects workstation GPU, CUDA, and memory capabilities.
    Never fabricates values.
    """
    os.makedirs(LOGS_DIR, exist_ok=True)

    cuda_available = False
    gpu_name = None
    gpu_memory_gb = None
    system_memory_gb = None
    cuda_version = None
    pytorch_version = None

    # Check PyTorch
    try:
        import torch
        pytorch_version = torch.__version__
        cuda_available = torch.cuda.is_available()
        if cuda_available:
            gpu_name = torch.cuda.get_device_name(0)
            gpu_memory_bytes = torch.cuda.get_device_properties(0).total_memory
            gpu_memory_gb = round(gpu_memory_bytes / (1024 ** 3), 2)
            cuda_version = torch.version.cuda
    except Exception:
        pytorch_version = "NOT_INSTALLED"

    # If PyTorch not installed or no CUDA via torch, probe nvidia-smi directly
    if not cuda_available:
        try:
            smi_output = subprocess.check_output(
                ["nvidia-smi", "--query-gpu=name,memory.total,driver_version", "--format=csv,noheader,nounits"],
                timeout=5,
                universal_newlines=True
            ).strip()
            if smi_output:
                parts = smi_output.split("\n")[0].split(",")
                if len(parts) >= 2:
                    gpu_name = parts[0].strip()
                    gpu_memory_gb = round(float(parts[1].strip()) / 1024.0, 2)
                    cuda_available = True  # GPU hardware is physically present
        except Exception:
            pass

    # System RAM detection
    try:
        if sys.platform == "win32":
            mem_cmd = "Get-CimInstance Win32_OperatingSystem | Select-Object -ExpandProperty TotalVisibleMemorySize"
            mem_kb = subprocess.check_output(["powershell", "-Command", mem_cmd], timeout=5, universal_newlines=True).strip()
            system_memory_gb = round(int(mem_kb) / (1024 * 1024), 2)
        else:
            with open("/proc/meminfo", "r") as f:
                for line in f:
                    if "MemTotal" in line:
                        kb = int(line.split()[1])
                        system_memory_gb = round(kb / (1024 * 1024), 2)
                        break
    except Exception:
        system_memory_gb = None

    report = {
        "cuda_available": bool(cuda_available and pytorch_version != "NOT_INSTALLED"),
        "hardware_cuda_supported": bool(gpu_name is not None),
        "gpu_name": gpu_name,
        "gpu_memory_gb": gpu_memory_gb,
        "system_memory_gb": system_memory_gb,
        "pytorch_version": pytorch_version,
        "cuda_driver_version": cuda_version,
        "python_version": platform.python_version(),
        "platform": platform.platform()
    }

    with open(HARDWARE_REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    return report


if __name__ == "__main__":
    rep = detect_hardware()
    print("Detected Hardware Environment:")
    for k, v in rep.items():
        print(f"  {k}: {v}")
    print(f"Saved to: {HARDWARE_REPORT_PATH}")
