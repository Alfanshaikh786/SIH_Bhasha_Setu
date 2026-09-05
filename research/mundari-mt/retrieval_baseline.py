"""
Transparent Retrieval-Based Translation Baseline for Mundari (unr) <-> Hindi (hi).

Architecture:
Input Text -> Unicode NFC Normalization -> Exact Match?
   |-- YES -> Return Verified Dataset Translation (exact_match, sim=1.0)
   |-- NO  -> RapidFuzz Similarity Search -> sim >= threshold?
                |-- YES -> Return Retrieval Candidate (fuzzy_retrieval, sim)
                |-- NO  -> Translation Unavailable (status='unavailable')

Safety Rules:
- NEVER returns source text as translation.
- NEVER invents neural output or hallucinations.
- Labels all outputs honestly as 'Dataset Retrieval Translation'.
- Evaluates on held-out test split (10%), not training sentences.
"""

import json
import os
import sys
import unicodedata
from typing import Dict, Any, Optional, List, Tuple
import pandas as pd
from sklearn.model_selection import train_test_split

try:
    from rapidfuzz import fuzz, process
    HAS_RAPIDFUZZ = True
except ImportError:
    HAS_RAPIDFUZZ = False

# Path configuration
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MUNDARI_DIR = os.path.join(BASE_DIR, "research", "mundari-mt")
DATASET_DIR = os.path.join(BASE_DIR, "research", "datasets", "mundari")
RAW_DATASET_PATH = os.path.join(DATASET_DIR, "mundari-train.csv")
TRAIN_PATH = os.path.join(DATASET_DIR, "train.csv")
VAL_PATH = os.path.join(DATASET_DIR, "val.csv")
TEST_PATH = os.path.join(DATASET_DIR, "test.csv")
SPLIT_META_PATH = os.path.join(DATASET_DIR, "split_metadata.json")

sys.path.insert(0, BASE_DIR)
sys.path.insert(0, MUNDARI_DIR)
sys.path.insert(0, os.path.join(BASE_DIR, "research", "model-evaluation"))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from evaluate_metrics import compute_metrics


def ensure_splits(seed: int = 42) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Ensure reproducible 80% Train / 10% Val / 10% Test split with fixed random seed.
    Prevents exact duplicate leakage between train and test.
    """
    if os.path.exists(TRAIN_PATH) and os.path.exists(VAL_PATH) and os.path.exists(TEST_PATH):
        print("Loading existing reproducible splits from disk...")
        train_df = pd.read_csv(TRAIN_PATH, dtype=str, keep_default_na=False)
        val_df = pd.read_csv(VAL_PATH, dtype=str, keep_default_na=False)
        test_df = pd.read_csv(TEST_PATH, dtype=str, keep_default_na=False)
        return train_df, val_df, test_df

    if not os.path.exists(RAW_DATASET_PATH):
        raise FileNotFoundError(f"Raw dataset not found at {RAW_DATASET_PATH}")

    print(f"Creating reproducible splits from {RAW_DATASET_PATH} (seed={seed})...")
    df = pd.read_csv(RAW_DATASET_PATH, dtype=str, keep_default_na=False)

    # Clean empty rows
    df = df[(df["Hindi"].str.strip() != "") & (df["Mundari"].str.strip() != "")].copy()
    # Normalize NFC
    df["Hindi"] = df["Hindi"].apply(lambda s: unicodedata.normalize("NFC", str(s).strip()))
    df["Mundari"] = df["Mundari"].apply(lambda s: unicodedata.normalize("NFC", str(s).strip()))

    # Drop duplicate pairs to eliminate cross-split leakage
    df = df.drop_duplicates(subset=["Hindi", "Mundari"]).reset_index(drop=True)

    # 80% Train, 20% Temp
    train_df, temp_df = train_test_split(df, test_size=0.20, random_state=seed, shuffle=True)
    # 10% Val, 10% Test (50/50 of temp)
    val_df, test_df = train_test_split(temp_df, test_size=0.50, random_state=seed, shuffle=True)

    # Reset indices
    train_df = train_df.reset_index(drop=True)
    val_df = val_df.reset_index(drop=True)
    test_df = test_df.reset_index(drop=True)

    # Save to CSV
    train_df.to_csv(TRAIN_PATH, index=False, encoding="utf-8")
    val_df.to_csv(VAL_PATH, index=False, encoding="utf-8")
    test_df.to_csv(TEST_PATH, index=False, encoding="utf-8")

    meta = {
        "random_seed": seed,
        "split_ratio": {"train": 0.80, "validation": 0.10, "test": 0.10},
        "counts": {
            "total_pairs": len(df),
            "train": len(train_df),
            "validation": len(val_df),
            "test": len(test_df)
        }
    }
    with open(SPLIT_META_PATH, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    print(f"Saved splits -> Train: {len(train_df)}, Val: {len(val_df)}, Test: {len(test_df)}")
    return train_df, val_df, test_df


class MundariRetrievalBaseline:
    def __init__(self, train_df: Optional[pd.DataFrame] = None, similarity_threshold: float = 0.85):
        """
        Initialize the retrieval baseline using the training split index.

        Args:
            train_df: DataFrame of training sentence pairs (Hindi, Mundari).
            similarity_threshold: Normalized threshold in [0.0, 1.0] for fuzzy matching.
        """
        self.threshold = similarity_threshold
        if train_df is None:
            train_df, _, _ = ensure_splits()
        self.train_df = train_df

        # Build exact lookup indices (normalized NFC lowercase)
        print(f"Indexing {len(self.train_df)} training pairs for retrieval baseline...")
        self.hi_to_unr: Dict[str, str] = {}
        self.unr_to_hi: Dict[str, str] = {}

        self.hi_corpus: List[str] = []
        self.unr_corpus: List[str] = []

        for _, row in self.train_df.iterrows():
            h = unicodedata.normalize("NFC", str(row["Hindi"]).strip())
            m = unicodedata.normalize("NFC", str(row["Mundari"]).strip())
            if not h or not m:
                continue

            h_key = h.lower()
            m_key = m.lower()

            if h_key not in self.hi_to_unr:
                self.hi_to_unr[h_key] = m
                self.hi_corpus.append(h)

            if m_key not in self.unr_to_hi:
                self.unr_to_hi[m_key] = h
                self.unr_corpus.append(m)

        print(f"Retrieval index ready: {len(self.hi_corpus)} unique Hindi sentences, {len(self.unr_corpus)} unique Mundari sentences.")

    def translate(self, text: str, source_lang: str = "hi", target_lang: str = "unr") -> Dict[str, Any]:
        """
        Translate input sentence via exact match or strict fuzzy retrieval.

        Returns structured metadata:
        {
            "translation": str,
            "status": "retrieved" | "unavailable",
            "method": "exact_match" | "fuzzy_retrieval" | "none",
            "similarity": float,
            "source_language": str,
            "target_language": str
        }
        """
        if not text or not text.strip():
            return {
                "translation": "",
                "status": "unavailable",
                "method": "none",
                "similarity": 0.0,
                "source_language": source_lang,
                "target_language": target_lang,
                "matched_source_sentence": ""
            }

        norm_input = unicodedata.normalize("NFC", text.strip())
        key = norm_input.lower()

        # Tier 1: Exact normalized match
        if source_lang == "hi" and target_lang == "unr":
            if key in self.hi_to_unr:
                return {
                    "translation": self.hi_to_unr[key],
                    "status": "retrieved",
                    "method": "exact_match",
                    "similarity": 1.0,
                    "source_language": "hi",
                    "target_language": "unr",
                    "matched_source_sentence": norm_input
                }
            corpus = self.hi_corpus
            lookup = self.hi_to_unr
        elif source_lang == "unr" and target_lang == "hi":
            if key in self.unr_to_hi:
                return {
                    "translation": self.unr_to_hi[key],
                    "status": "retrieved",
                    "method": "exact_match",
                    "similarity": 1.0,
                    "source_language": "unr",
                    "target_language": "hi",
                    "matched_source_sentence": norm_input
                }
            corpus = self.unr_corpus
            lookup = self.unr_to_hi
        else:
            return {
                "translation": "Unsupported direct route in retrieval baseline.",
                "status": "unavailable",
                "method": "unsupported_direction",
                "similarity": 0.0,
                "source_language": source_lang,
                "target_language": target_lang,
                "matched_source_sentence": ""
            }

        # Tier 2: Fuzzy Retrieval via RapidFuzz with length pruning
        if HAS_RAPIDFUZZ and corpus:
            q_len = len(norm_input)
            # Prune candidates to length range [q_len * 0.65, q_len * 1.35]
            min_len = int(q_len * 0.65)
            max_len = int(q_len * 1.35)
            pruned_candidates = [c for c in corpus if min_len <= len(c) <= max_len]

            # If pruned list is too small, use full corpus
            candidate_pool = pruned_candidates if len(pruned_candidates) >= 10 else corpus

            score_cutoff = self.threshold * 100
            match = process.extractOne(
                norm_input,
                candidate_pool,
                scorer=fuzz.token_sort_ratio,
                score_cutoff=score_cutoff
            )
            if match:
                best_sentence, score, _ = match
                sim = round(score / 100.0, 4)
                matched_translation = lookup.get(best_sentence.lower(), "")
                if matched_translation:
                    return {
                        "translation": matched_translation,
                        "status": "retrieved",
                        "method": "fuzzy_retrieval",
                        "similarity": sim,
                        "source_language": source_lang,
                        "target_language": target_lang,
                        "matched_source_sentence": best_sentence
                    }

        # Below threshold or unavailable
        return {
            "translation": "Translation unavailable (no match above confidence threshold).",
            "status": "unavailable",
            "method": "none",
            "similarity": 0.0,
            "source_language": source_lang,
            "target_language": target_lang,
            "matched_source_sentence": ""
        }

    def evaluate_held_out(self, test_df: pd.DataFrame, source_lang: str = "hi", target_lang: str = "unr", max_samples: Optional[int] = None) -> Dict[str, Any]:
        """
        Evaluate the retrieval baseline on held-out data.
        """
        eval_data = test_df if max_samples is None else test_df.head(max_samples)
        total = len(eval_data)
        print(f"\nEvaluating Retrieval Baseline ({source_lang} -> {target_lang}) on {total} held-out samples...", flush=True)

        hyps = []
        refs = []
        sims = []
        retrieved_count = 0
        exact_match_count = 0

        src_col = "Hindi" if source_lang == "hi" else "Mundari"
        tgt_col = "Mundari" if target_lang == "unr" else "Hindi"

        for idx, (_, row) in enumerate(eval_data.iterrows()):
            if (idx + 1) % 200 == 0 or (idx + 1) == total:
                print(f"  Processed {idx + 1}/{total} samples...", flush=True)

            src = str(row[src_col])
            ref = str(row[tgt_col])
            res = self.translate(src, source_lang=source_lang, target_lang=target_lang)

            if res["status"] == "retrieved":
                retrieved_count += 1
                hyps.append(res["translation"])
                sims.append(res["similarity"])
                if res["method"] == "exact_match":
                    exact_match_count += 1
            else:
                hyps.append("")  # Empty hypothesis for unavailable translation
                sims.append(0.0)

            refs.append(ref)

        metrics = compute_metrics(hyps, refs)
        coverage_rate = round((retrieved_count / total) * 100, 2)
        unavailable_rate = round(((total - retrieved_count) / total) * 100, 2)
        avg_sim = round(sum(sims) / len(sims), 4) if sims else 0.0

        return {
            "source_language": source_lang,
            "target_language": target_lang,
            "total_test_samples": total,
            "retrieved_count": retrieved_count,
            "coverage_rate": coverage_rate,
            "unavailable_rate": unavailable_rate,
            "average_similarity": avg_sim,
            "exact_matches_on_test": metrics["exact_matches"],
            "exact_match_accuracy": metrics["exact_match_accuracy"],
            "bleu": metrics["bleu"],
            "chrf2pp": metrics["chrf2pp"],
            "avg_length_ratio": metrics["avg_length_ratio"]
        }


def run_self_test():
    print("=" * 65)
    print("MUNDARI RETRIEVAL BASELINE & HELD-OUT EVALUATION")
    print("=" * 65)

    train_df, val_df, test_df = ensure_splits(seed=42)
    baseline = MundariRetrievalBaseline(train_df, similarity_threshold=0.85)

    # 1. Interactive test cases
    sample_hi = "हिमाचल प्रदेश के ऊना की 7 साल की बेटी नलिनी सिंह का कमाल देखिए।"
    print(f"\n[Test 1] Exact Match Test (HI -> UNR): '{sample_hi}'")
    res1 = baseline.translate(sample_hi, "hi", "unr")
    print("Result:", res1)

    unknown_hi = "अंतरिक्ष में नया उपग्रह सफलतापूर्वक प्रक्षेपित किया गया।"
    print(f"\n[Test 2] Unseen Query Test (HI -> UNR): '{unknown_hi}'")
    res2 = baseline.translate(unknown_hi, "hi", "unr")
    print("Result:", res2)

    # 2. Held-Out Test Evaluation
    print("\n" + "=" * 65)
    print("RUNNING EVALUATION ON HELD-OUT TEST SPLIT (500 SAMPLES)")
    print("=" * 65)

    hi_unr_eval = baseline.evaluate_held_out(test_df, "hi", "unr", max_samples=500)
    print("\n--- HELD-OUT RESULTS: Hindi -> Mundari ---")
    for k, v in hi_unr_eval.items():
        print(f"  {k}: {v}")

    unr_hi_eval = baseline.evaluate_held_out(test_df, "unr", "hi", max_samples=500)
    print("\n--- HELD-OUT RESULTS: Mundari -> Hindi ---")
    for k, v in unr_hi_eval.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    run_self_test()
