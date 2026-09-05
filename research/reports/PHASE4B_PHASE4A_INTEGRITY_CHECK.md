# Phase 4B: Phase 4A Integrity & Artifact Verification Report

**Verification Date:** 2026-09-05  
**Project:** Bhasha Setu — Mundari MT Pipeline  
**Phase Transition:** Phase 4A (Audit & Baseline) → Phase 4B (Neural Training & Validation)  
**Status:** **PASSED — ALL PHASE 4A ARTIFACTS VERIFIED**

---

## 1. Overview & Objectives
Before beginning Phase 4B neural machine translation preparation and training, a thorough read-only verification was executed on all foundational artifacts produced during Phase 4A. This ensures complete continuity, zero artifact corruption, and data provenance.

---

## 2. Phase 4A Files Inventory & Status

| File Path | Component | Status | Role in Phase 4B |
| :--- | :--- | :--- | :--- |
| `research/mundari-mt/script_detector.py` | Script Detection | **Present & Verified** | Reused as read-only module for script validation and Ol Chiki filtering. |
| `research/mundari-mt/dataset_loader.py` | Data Loading | **Present & Verified** | Reused as reference schema parser; verified against 20,000 pairs. |
| `research/mundari-mt/retrieval_baseline.py` | Baseline Retrieval | **Present & Verified** | Reused as the comparative baseline system against neural models. |
| `research/mundari-mt/provider.py` | Provider Registry | **Present & Verified** | Preserved; serves as reference for 2-hop English pivot routes. |
| `research/mundari-mt/benchmark_models.py` | Public Model Audit | **Present & Verified** | Reference for public checkpoint accessibility (mBART-50, Aya-23, IndicTrans2). |
| `research/dataset-audit/audit_mundari_dataset.py` | Quality Audit Script | **Present & Verified** | Preserved intact for reproduction. |
| `research/dataset-audit/DATASET_QUALITY_REPORT.md` | Quality Audit Report | **Present & Verified** | Baseline statistics benchmark (20,000 rows, 0 duplicate pairs, 0 Ol Chiki). |
| `research/model-evaluation/evaluate_metrics.py` | Evaluation Suite | **Present & Verified** | Reused for SacreBLEU, chrF2++, Exact Match, and Length Ratio calculation. |
| `research/datasets/mundari/mundari-train.csv` | Raw Parallel Corpus | **Present & Verified** | Raw immutable source dataset (20,000 pairs). Kept untouched. |
| `research/datasets/mundari/train.csv` | Train Split | **Present & Verified** | Official Phase 4A training split (16,000 pairs). |
| `research/datasets/mundari/val.csv` | Validation Split | **Present & Verified** | Official Phase 4A validation split (2,000 pairs). |
| `research/datasets/mundari/test.csv` | Test Split | **Present & Verified** | Official Phase 4A held-out test split (2,000 pairs). Preserved for test evaluation. |
| `research/datasets/mundari/split_metadata.json` | Split Metadata | **Present & Verified** | Seed 42, 80/10/10 split configuration. |
| `research/MUNDARI_PHASE4A_FINAL_REPORT.md` | Final Phase 4A Report | **Present & Verified** | Preserved read-only as final documentation for Phase 4A. |

---

## 3. Dataset Row Counts & Consistency Check

| Dataset Artifact | Expected Rows | Verified Rows | Column Schema | Integrity Check |
| :--- | :--- | :--- | :--- | :--- |
| `mundari-train.csv` (Raw) | 20,000 | 20,000 | `row_id`, `Hindi`, `Mundari` | **MATCH (100%)** |
| `train.csv` (Phase 4A) | 16,000 | 16,000 | `row_id`, `Hindi`, `Mundari` | **MATCH (80.0%)** |
| `val.csv` (Phase 4A) | 2,000 | 2,000 | `row_id`, `Hindi`, `Mundari` | **MATCH (10.0%)** |
| `test.csv` (Phase 4A Held-Out) | 2,000 | 2,000 | `row_id`, `Hindi`, `Mundari` | **MATCH (10.0%)** |

All row counts, column names, and split sizes match the Phase 4A audit reports exactly.

---

## 4. Phase 4B Read-Only & Output Isolation Rules
1. **Zero Overwriting of Phase 4A Artifacts:** Phase 4A scripts, raw CSVs, and audit documents will not be modified or overwritten.
2. **Cleaned Outputs Isolation:** Cleaned training datasets, anomaly logs, and script distributions for Phase 4B are stored in the dedicated directory: `research/mundari-mt/cleaned-data/`.
3. **Training & Evaluation Isolation:** Model training scripts reside in `research/model-training/` and neural evaluation scripts reside in `research/model-evaluation/`.
4. **Reports Isolation:** Phase 4B reports are placed in `research/reports/`.
5. **Zero Production Mutation:** `src/` remains completely untouched.
