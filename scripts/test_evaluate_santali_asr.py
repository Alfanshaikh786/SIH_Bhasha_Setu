"""
Unit Test Suite for Santali ASR Evaluation Math & Metric Calculators
Verifies CER, WER, Levenshtein, Exact Match, and SNR calculation on authentic Ol Chiki strings.
"""

import sys
import os
import unittest
from pathlib import Path

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
from scripts.evaluate_santali_asr import (
    calculate_levenshtein,
    calculate_cer,
    calculate_wer,
    is_exact_match,
    estimate_snr_db
)


class TestSantaliASREvaluationMath(unittest.TestCase):

    def test_levenshtein_identical(self):
        # ᱡᱚᱦᱟᱨ (Johar)
        s = "ᱡᱚᱦᱟᱨ"
        self.assertEqual(calculate_levenshtein(list(s), list(s)), 0)

    def test_levenshtein_substitution(self):
        # ᱡᱚᱦᱟᱨ vs ᱡᱚᱦᱟᱞ (1 character substitution)
        ref = list("ᱡᱚᱦᱟᱨ")
        hyp = list("ᱡᱚᱦᱟᱞ")
        self.assertEqual(calculate_levenshtein(ref, hyp), 1)

    def test_levenshtein_insertion_deletion(self):
        ref = list("ᱡᱚᱦᱟᱨ") # 5 chars
        hyp = list("ᱡᱚᱦᱟ")  # 4 chars (1 deletion)
        self.assertEqual(calculate_levenshtein(ref, hyp), 1)

        hyp2 = list("ᱡᱚᱦᱟᱨᱟ") # 6 chars (1 insertion)
        self.assertEqual(calculate_levenshtein(ref, hyp2), 1)

    def test_cer_calculation(self):
        ref = "ᱡᱚᱦᱟᱨ" # 5 chars
        # 1 deletion -> CER = 1/5 = 0.20
        hyp = "ᱡᱚᱦᱟ"
        self.assertAlmostEqual(calculate_cer(ref, hyp), 0.20, places=4)

        # Perfect match -> CER = 0.0
        self.assertAlmostEqual(calculate_cer(ref, ref), 0.0, places=4)

        # Complete mismatch (5 substitutions) -> CER = 1.0
        hyp_diff = "ᱟᱢᱫᱚᱪ"
        self.assertAlmostEqual(calculate_cer(ref, hyp_diff), 1.0, places=4)

    def test_wer_calculation(self):
        ref = "ᱡᱚᱦᱟᱨ ᱜᱟᱛᱮ ᱪᱮᱫ ᱞᱮᱠᱟ" # 4 words
        # 1 word substituted -> WER = 1/4 = 0.25
        hyp = "ᱡᱚᱦᱟᱨ ᱯᱮᱲᱟ ᱪᱮᱫ ᱞᱮᱠᱟ"
        self.assertAlmostEqual(calculate_wer(ref, hyp), 0.25, places=4)

        # Perfect match -> WER = 0.0
        self.assertAlmostEqual(calculate_wer(ref, ref), 0.0, places=4)

    def test_exact_match_normalization(self):
        ref = " ᱡᱚᱦᱟᱨ   ᱜᱟᱛᱮ "
        hyp = "ᱡᱚᱦᱟᱨ ᱜᱟᱛᱮ"
        # Excess whitespace normalized
        self.assertTrue(is_exact_match(ref, hyp))

        hyp_diff = "ᱡᱚᱦᱟᱨ ᱯᱮᱲᱟ"
        self.assertFalse(is_exact_match(ref, hyp_diff))

    def test_snr_estimation(self):
        # Pure silence
        silence = np.zeros(16000, dtype=np.float32)
        snr_silence = estimate_snr_db(silence)
        self.assertEqual(snr_silence, 0.0)

        # Intermittent signal (0.5s speech, 0.5s ambient noise)
        t = np.linspace(0, 1.0, 16000, endpoint=False)
        audio = np.random.normal(0, 0.005, 16000).astype(np.float32)
        audio[:8000] += (0.5 * np.sin(2 * np.pi * 440 * t[:8000])).astype(np.float32)
        snr = estimate_snr_db(audio)
        self.assertGreater(snr, 15.0)


if __name__ == "__main__":
    unittest.main()
