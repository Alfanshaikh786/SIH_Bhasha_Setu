"""
Script Detector for Mundari Machine Translation Research Pipeline.

Decouples language (Mundari, ISO 639-3: unr) from script representations:
- Devanagari (U+0900 - U+097F) -> Deva
- Nag Mundari / Mundari Bani (U+1E4D0 - U+1E4FF) -> Nagm
- Latin / Romanized (U+0041-005A, U+0061-007A, extended Latin) -> Latn
- Ol Chiki (U+1C50 - U+1C7F) -> Olck [FLAGGED AS SANTALI CONTAMINATION]

Ensures Unicode NFC normalization and flags Santali contamination.
"""

import sys
import unicodedata
from typing import Dict, Any, Optional

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def is_devanagari(char: str) -> bool:
    cp = ord(char)
    return 0x0900 <= cp <= 0x097F or 0xA8E0 <= cp <= 0xA8FF


def is_nag_mundari(char: str) -> bool:
    # Nag Mundari / Mundari Bani: U+1E4D0 – U+1E4FF (Unicode 15.0+)
    cp = ord(char)
    return 0x1E4D0 <= cp <= 0x1E4FF


def is_latin(char: str) -> bool:
    cp = ord(char)
    # Basic Latin, Latin-1 Supplement, Latin Extended-A, Latin Extended-B
    return (
        (0x0041 <= cp <= 0x005A) or  # A-Z
        (0x0061 <= cp <= 0x007A) or  # a-z
        (0x00C0 <= cp <= 0x00FF) or  # Latin-1 letters
        (0x0100 <= cp <= 0x024F)     # Latin Extended-A & B
    )


def is_ol_chiki(char: str) -> bool:
    # Ol Chiki script for Santali: U+1C50 – U+1C7F
    cp = ord(char)
    return 0x1C50 <= cp <= 0x1C7F


def detect_script(text: Optional[str]) -> Dict[str, Any]:
    """
    Detect script distribution in input text after Unicode NFC normalization.

    Returns:
        dict containing:
        - text: original input
        - normalized_text: Unicode NFC normalized text
        - script_counts: character counts for Deva, Nagm, Latn, Olck, Other
        - dominant_script: script with highest count (or 'None' if empty)
        - mixed_script: boolean indicating presence of multiple scripts
        - possible_santali_contamination: boolean set to True if any Ol Chiki character is found
    """
    if text is None:
        text = ""

    normalized = unicodedata.normalize("NFC", text)

    counts = {
        "Deva": 0,
        "Nagm": 0,
        "Latn": 0,
        "Olck": 0,
        "Other": 0
    }

    for char in normalized:
        if char.isspace() or unicodedata.category(char).startswith("P"):
            continue
        if is_devanagari(char):
            counts["Deva"] += 1
        elif is_nag_mundari(char):
            counts["Nagm"] += 1
        elif is_latin(char):
            counts["Latn"] += 1
        elif is_ol_chiki(char):
            counts["Olck"] += 1
        else:
            counts["Other"] += 1

    primary_counts = {
        "Deva": counts["Deva"],
        "Nagm": counts["Nagm"],
        "Latn": counts["Latn"],
        "Olck": counts["Olck"]
    }

    total_letters = sum(primary_counts.values())
    present_scripts = [s for s, c in primary_counts.items() if c > 0]

    dominant_script = "None"
    if total_letters > 0:
        dominant_script = max(primary_counts.items(), key=lambda x: x[1])[0]

    mixed_script = len(present_scripts) > 1
    possible_santali_contamination = primary_counts["Olck"] > 0

    return {
        "text": text,
        "normalized_text": normalized,
        "script_counts": primary_counts,
        "dominant_script": dominant_script,
        "mixed_script": mixed_script,
        "possible_santali_contamination": possible_santali_contamination
    }


def run_self_test():
    """Executable self-tests covering Devanagari, Nag Mundari, Latin, and Ol Chiki."""
    test_cases = [
        ("Hindi Devanagari", "नमस्ते, आप कैसे हैं?"),
        ("Mundari in Devanagari", "जोहार, आमाः नुतूम चिकना?"),
        ("Mundari in Nag Mundari (Bani)", "\U0001E4D0\U0001E4D1\U0001E4D2 \U0001E4D5\U0001E4D6"),
        ("Romanized Mundari (Latin)", "Johar, amah nutum chikna?"),
        ("Santali in Ol Chiki (Contamination test)", "\u1C5A\u1C5B\u1C5E\u1C64 \u1C5F\u1C62\u1C64"),
        ("Mixed Hindi with Ol Chiki contamination", "यह वाक्य \u1C5A\u1C5B है।")
    ]

    print("=" * 65)
    print("MUNDARI SCRIPT DETECTOR SELF-TEST")
    print("=" * 65)

    for label, sample in test_cases:
        res = detect_script(sample)
        print(f"Label: {label}")
        print(f"  Input: {res['text']}")
        print(f"  Counts: {res['script_counts']}")
        print(f"  Dominant Script: {res['dominant_script']}")
        print(f"  Mixed Script: {res['mixed_script']}")
        print(f"  Santali Contamination Flag: {res['possible_santali_contamination']}")
        print("-" * 65)


if __name__ == "__main__":
    run_self_test()
