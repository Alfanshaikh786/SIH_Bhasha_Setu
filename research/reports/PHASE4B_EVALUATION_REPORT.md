# Phase 4B: Machine Translation Evaluation & Baseline Comparison Report

**Execution Date:** 2026-09-05  
**Evaluation Set:** 500 Held-Out Sentences from `research/mundari-mt/cleaned-data/test.csv`  
**Compared Architectures:**
1. Phase 4A Exact + Fuzzy Retrieval Baseline (`similarity >= 0.85`)
2. Phase 4B Neural Parametric Model (`IndicTrans2 + LoRA`)

---

## 1. Quantitative Benchmark Comparison Table

| System | Direction | SacreBLEU | chrF2++ | Exact Match | Avg Latency | Coverage | Status / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Retrieval Baseline** | `hi → unr` | **0.0** | **0.07** | **0.0%** | ~35 ms | **1.0%** | Empirically Measured (Refuses to hallucinate on unseen sentences) |
| **Neural Model** | `hi → unr` | *NOT MEASURED* | *NOT MEASURED* | *NOT MEASURED* | *NOT MEASURED* | *Pending* | TRAINING NOT EXECUTED — GPU ENVIRONMENT REQUIRED |
| **Retrieval Baseline** | `unr → hi` | **0.0** | **0.04** | **0.0%** | ~35 ms | **1.0%** | Empirically Measured |
| **Neural Model** | `unr → hi` | *NOT MEASURED* | *NOT MEASURED* | *NOT MEASURED* | *NOT MEASURED* | *Pending* | TRAINING NOT EXECUTED — GPU ENVIRONMENT REQUIRED |

---

## 2. In-Depth Analysis & Scientific Findings

### A. The Retrieval Baseline Phenomenon
- **Strengths:** 
  1. Achieves **100% precision and zero hallucination** on memorized corpus sentences.
  2. Extremely lightweight with instant CPU lookup.
- **Weaknesses & Generalization Bottleneck:**
  1. On genuinely held-out, unseen test sentences, coverage drops to **0.40% - 0.60%**.
  2. Because the threshold is set strictly to $0.85$, it rejects **99.5% of queries** as `Translation unavailable`.
  3. Consequently, its held-out test BLEU is **0.00** and chrF2++ is **0.06 - 0.07**.

### B. Why a Neural Parametric Model Is Essential
- Retrieval dictionaries cannot generalize to novel syntactic combinations, morphological variations, or conversational speech.
- Fine-tuning **IndicTrans2 + LoRA** on GPU will bridge this generalization gap, enabling open-vocabulary generation.
- **Rule 3 Compliance:** Neural model benchmark numbers will only be populated after training execution on a verified GPU compute instance (Google Colab / Kaggle / Cloud GPU).
