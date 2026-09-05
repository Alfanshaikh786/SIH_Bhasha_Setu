"""
Hallucination, Degeneration, and Contamination Detector for Phase 4B.

Detects standard neural sequence-to-sequence pathology modes:
1. Source Copying (e.g. Hindi input copied verbatim as Mundari)
2. Script Mismatch (e.g. unexpected Latin characters where Devanagari expected)
3. Excessive Repetition (degenerate looping n-grams, e.g. "शब्द शब्द शब्द शब्द")
4. Empty or Whitespace-Only Translations
5. Suspicious Length Divergences (ratio < 0.2 or > 3.5)
6. Santali Ol Chiki Contamination (U+1C50 - U+1C7F)
"""

import sys
import unicodedata
from typing import Dict, Any, List

BASE_DIR = os_path = None
try:
    import os
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    sys.path.insert(0, os.path.join(BASE_DIR, "research", "mundari-mt"))
    from script_detector import detect_script
except Exception:
    pass

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def audit_translation(
    source_text: str,
    hypothesis_text: str,
    expected_target_lang: str = "unr",
    expected_script: str = "Deva"
) -> Dict[str, Any]:
    """
    Audits a single translation hypothesis against safety and fidelity criteria.
    """
    s_norm = unicodedata.normalize("NFC", source_text.strip())
    h_norm = unicodedata.normalize("NFC", hypothesis_text.strip())

    flags = []
    severity = "NONE"

    # 1. Empty Translation
    if not h_norm:
        flags.append("EMPTY_TRANSLATION: Output string is completely empty or whitespace-only.")
        severity = "HIGH"

    # 2. Source Copying
    elif s_norm.lower() == h_norm.lower() and len(s_norm) > 3:
        flags.append("SOURCE_COPYING: Target output is an exact verbatim copy of the source sentence.")
        severity = "HIGH"

    # 3. Excessive Repetition (Degeneration)
    tokens = h_norm.split()
    if len(tokens) >= 4:
        for i in range(len(tokens) - 3):
            if tokens[i] == tokens[i+1] == tokens[i+2] == tokens[i+3]:
                flags.append(f"EXCESSIVE_REPETITION: Token '{tokens[i]}' repeats 4+ consecutive times.")
                severity = "HIGH"
                break

    # 4. Length Ratio Anomalies
    len_s = len(s_norm)
    len_h = len(h_norm)
    if len_s > 0 and len_h > 0:
        ratio = len_h / len_s
        if ratio < 0.20:
            flags.append(f"SUSPICIOUS_LENGTH_SHORT: Translation length ratio is extremely compressed ({ratio:.2f} < 0.20).")
            if severity != "HIGH":
                severity = "MEDIUM"
        elif ratio > 3.50:
            flags.append(f"SUSPICIOUS_LENGTH_LONG: Translation length ratio is extremely bloated ({ratio:.2f} > 3.50).")
            if severity != "HIGH":
                severity = "MEDIUM"

    # 5. Script Mismatch & Santali Ol Chiki Contamination
    ol_chiki_chars = [c for c in h_norm if 0x1C50 <= ord(c) <= 0x1C7F]
    if ol_chiki_chars:
        flags.append(
            f"SANTALI_CONTAMINATION: Detected {len(ol_chiki_chars)} Ol Chiki characters ({''.join(ol_chiki_chars[:5])}). "
            "Mundari does not use Ol Chiki; possible Santali dataset cross-contamination."
        )
        severity = "CRITICAL"

    devanagari_chars = [c for c in h_norm if 0x0900 <= ord(c) <= 0x097F]
    latin_chars = [c for c in h_norm if (0x0041 <= ord(c) <= 0x005A) or (0x0061 <= ord(c) <= 0x007A)]

    if expected_script == "Deva" and len(devanagari_chars) == 0 and len(latin_chars) > 5:
        flags.append("SCRIPT_MISMATCH: Expected Devanagari output, but received purely Latin/English text.")
        if severity not in ["CRITICAL", "HIGH"]:
            severity = "HIGH"

    return {
        "source": s_norm,
        "hypothesis": h_norm,
        "is_clean": len(flags) == 0,
        "severity": severity,
        "flags": flags,
        "char_ratio": round(len_h / len_s, 2) if len_s > 0 else 0.0,
        "ol_chiki_detected": len(ol_chiki_chars) > 0
    }


def run_self_test():
    print("=" * 70)
    print("PHASE 4B: HALLUCINATION & CONTAMINATION DETECTOR SELF-TEST")
    print("=" * 70)

    test_scenarios = [
        ("Clean Mundari Translation", "नमस्ते, आप कैसे हैं?", "जोहार, आमाः नुतूम चिकना?"),
        ("Source Copying", "यह बहुत सुंदर गांव है।", "यह बहुत सुंदर गांव है।"),
        ("Excessive Repetition", "पानी लाओ", "दः दः दः दः दः"),
        ("Empty Output", "किताब पढ़ो", ""),
        ("Ol Chiki Contamination", "हम स्कूल जा रहे हैं", "ᱚᱞ ᱪᱤᱠᱤ ᱟᱞᱮ"),
        ("Extreme Length Bloat", "हाँ", "यह बहुत ही लंबा और असामान्य रूप से विस्तृत अनुवाद है जो अस्वाभाविक प्रतीत होता है।")
    ]

    for label, src, hyp in test_scenarios:
        res = audit_translation(src, hyp, expected_target_lang="unr", expected_script="Deva")
        print(f"\nScenario: {label}")
        print(f"  Source:     {res['source']}")
        print(f"  Hypothesis: {res['hypothesis']}")
        print(f"  Is Clean:   {res['is_clean']} (Severity: {res['severity']})")
        if res["flags"]:
            print(f"  Flags:      {res['flags']}")


if __name__ == "__main__":
    run_self_test()
