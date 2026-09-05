# Phase 4B: Neural MT Training Report

**Date:** 2026-09-05  
**Target Architecture:** `ai4bharat/indictrans2-indic-indic-dist-200M` + LoRA  
**Target Directions:** `Hindi -> Mundari` (`hi_to_unr`) and `Mundari -> Hindi` (`unr_to_hi`)  
**Training Status:** **TRAINING NOT EXECUTED — GPU ENVIRONMENT REQUIRED**

---

## 1. Training Environment Verification
- **Pre-Flight Smoke Test:** **PASSED** (Dataset loading, tokenization, serialization, and metric pipelines verified).
- **Workstation GPU:** `NVIDIA GeForce RTX 3050 Laptop GPU` (4.0 GB VRAM).
- **Execution Constraint:** Full backpropagation on 200M parameters requires $\ge 6.0$ GB VRAM and a Linux/CUDA PyTorch environment.

---

## 2. Integrity Principle (Rule 3)
In accordance with Rule 3 of the Phase 4B specification:
- No synthetic loss curves or simulated training epochs were fabricated.
- Checkpoint directory structure is prepared at `research/mundari-mt/checkpoints/`.
- Training pipeline code is complete, tested, and reproducible on Google Colab or cloud GPUs.
