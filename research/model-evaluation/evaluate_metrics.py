"""
Evaluation Metrics Suite for Mundari Machine Translation.

Calculates standard machine translation metrics:
- SacreBLEU (BLEU-4)
- chrF2++ (Character n-gram F-score with word n-grams)
- Exact Match (after Unicode NFC normalization)
- Length Ratio (prediction / reference)
"""

import sys
import unicodedata
from typing import List, Dict, Any

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

try:
    import sacrebleu
    HAS_SACREBLEU = True
except ImportError:
    HAS_SACREBLEU = False


def compute_metrics(hypotheses: List[str], references: List[str]) -> Dict[str, Any]:
    """
    Compute standard machine translation metrics on aligned hypotheses and references.

    Args:
        hypotheses: List of model predictions or retrieved translations.
        references: List of target ground-truth reference translations.

    Returns:
        Dict with bleuscore, chrf2pp, exact_match_accuracy, avg_length_ratio, total_samples.
    """
    if len(hypotheses) != len(references):
        raise ValueError(f"Length mismatch: {len(hypotheses)} hypotheses vs {len(references)} references.")

    total = len(hypotheses)
    if total == 0:
        return {
            "total_samples": 0,
            "exact_match_accuracy": 0.0,
            "bleu": 0.0,
            "chrf2pp": 0.0,
            "avg_length_ratio": 0.0
        }

    # Normalize NFC
    norm_hyps = [unicodedata.normalize("NFC", str(h).strip()) for h in hypotheses]
    norm_refs = [unicodedata.normalize("NFC", str(r).strip()) for r in references]

    # Exact match
    exact_matches = sum(1 for h, r in zip(norm_hyps, norm_refs) if h == r and h != "")
    exact_match_acc = round((exact_matches / total) * 100, 2)

    # Length ratios
    ratios = []
    for h, r in zip(norm_hyps, norm_refs):
        len_r = len(r)
        len_h = len(h)
        if len_r > 0:
            ratios.append(len_h / len_r)
        else:
            ratios.append(1.0 if len_h == 0 else 0.0)
    avg_length_ratio = round(sum(ratios) / len(ratios), 4)

    # BLEU & chrF2++ via sacrebleu
    bleu_score = 0.0
    chrf_score = 0.0
    metric_signature = ""

    if HAS_SACREBLEU:
        # Filter out cases where both might be empty to avoid division error
        # SacreBLEU takes refs as list of lists (one per reference set)
        valid_pairs = [(h, r) for h, r in zip(norm_hyps, norm_refs) if len(r) > 0]
        if valid_pairs:
            eval_hyps = [p[0] if p[0] else " " for p in valid_pairs]
            eval_refs = [[p[1] for p in valid_pairs]]

            bleu = sacrebleu.corpus_bleu(eval_hyps, eval_refs)
            bleu_score = round(bleu.score, 2)

            chrf = sacrebleu.corpus_chrf(eval_hyps, eval_refs, word_order=2)
            chrf_score = round(chrf.score, 2)
            metric_signature = str(chrf)
    else:
        print("Warning: sacrebleu not available; BLEU and chrF cannot be computed.")

    return {
        "total_samples": total,
        "exact_matches": exact_matches,
        "exact_match_accuracy": exact_match_acc,
        "bleu": bleu_score,
        "chrf2pp": chrf_score,
        "avg_length_ratio": avg_length_ratio,
        "has_sacrebleu": HAS_SACREBLEU,
        "signature": metric_signature
    }


def run_self_test():
    print("=" * 65)
    print("EVALUATION METRICS SUITE SELF-TEST")
    print("=" * 65)
    hyps = [
        "हनिः दङ हतोम हुनरीः",
        "नेअं नतेनते नेका सहानुभूतिपुरा",
        "गलत अनुवाद"
    ]
    refs = [
        "हनिः दङ हतोम हुनरीः",
        "नेअं नतेनते नेका सहानुभूतिपुरा",
        "हिमाचल राइज रेयाः ऊना"
    ]
    res = compute_metrics(hyps, refs)
    print("Test Results:")
    for k, v in res.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    run_self_test()
