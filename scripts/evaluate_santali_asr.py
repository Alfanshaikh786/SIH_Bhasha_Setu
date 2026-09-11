"""
Bhasha Setu — Empirical Santali ASR Accuracy & Performance Evaluator

Computes Character Error Rate (CER), Word Error Rate (WER), Exact Match Rate,
ASR Confidence, Audio Duration, Inference Latency, and Real-Time Factor (RTF)
against human-annotated ground-truth Ol Chiki speech data.

DO NOT invent or fabricate ground-truth transcripts.
If no human-annotated corpus is available, reports:
"Accuracy measurement pending human-annotated Santali corpus."
"""

import sys
import os
import io
import time
import argparse
import csv
import json
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np

# ---------------------------------------------------------------------------
# Metric Calculation Utilities
# ---------------------------------------------------------------------------

def calculate_levenshtein(seq1: list, seq2: list) -> int:
    """
    Computes Levenshtein edit distance between two sequences (characters or words).
    Returns total minimum edits (insertions + deletions + substitutions).
    """
    m, n = len(seq1), len(seq2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if seq1[i - 1] == seq2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])

    return dp[m][n]


def calculate_cer(reference: str, hypothesis: str) -> float:
    """
    Computes Character Error Rate (CER).
    CER = Levenshtein(ref_chars, hyp_chars) / len(ref_chars)
    """
    ref_clean = " ".join(reference.strip().split())
    hyp_clean = " ".join(hypothesis.strip().split())

    ref_chars = list(ref_clean)
    hyp_chars = list(hyp_clean)

    if not ref_chars:
        return 0.0 if not hyp_chars else 1.0

    edits = calculate_levenshtein(ref_chars, hyp_chars)
    return edits / len(ref_chars)


def calculate_wer(reference: str, hypothesis: str) -> float:
    """
    Computes Word Error Rate (WER).
    WER = Levenshtein(ref_words, hyp_words) / len(ref_words)
    """
    ref_words = reference.strip().split()
    hyp_words = hypothesis.strip().split()

    if not ref_words:
        return 0.0 if not hyp_words else 1.0

    edits = calculate_levenshtein(ref_words, hyp_words)
    return edits / len(ref_words)


def is_exact_match(reference: str, hypothesis: str) -> bool:
    """
    Checks exact match after normalizing contiguous whitespace.
    """
    ref_norm = " ".join(reference.strip().split())
    hyp_norm = " ".join(hypothesis.strip().split())
    return ref_norm == hyp_norm


def estimate_snr_db(audio: np.ndarray, sr: int = 16000, frame_ms: int = 30) -> float:
    """
    Estimates acoustic Signal-to-Noise Ratio (SNR) in dB from waveform.
    Uses 15th percentile energy for noise floor and 85th percentile for speech.
    """
    if len(audio) == 0:
        return 0.0
    frame_len = int(sr * (frame_ms / 1000.0))
    if frame_len <= 0 or len(audio) < frame_len:
        return 20.0

    num_frames = len(audio) // frame_len
    energies = [
        np.sqrt(np.mean(audio[i * frame_len : (i + 1) * frame_len] ** 2))
        for i in range(num_frames)
    ]
    if not energies:
        return 0.0

    noise_rms = max(float(np.percentile(energies, 15)), 1e-6)
    speech_rms = max(float(np.percentile(energies, 85)), 1e-6)

    if speech_rms <= noise_rms:
        return 0.0
    snr = 20.0 * np.log10(speech_rms / noise_rms)
    return float(snr)


# ---------------------------------------------------------------------------
# Dataset Formatting Guidelines
# ---------------------------------------------------------------------------

DATASET_FORMAT_SPEC = """
=============================================================================
           BHASHA SETU — SANTALI ASR GROUND-TRUTH DATASET SPECIFICATION
=============================================================================

To measure genuine empirical accuracy (CER/WER) without fabrication, provide
a human-annotated Santali speech corpus meeting the following specifications:

1. DIRECTORY STRUCTURE:
   data/
     └── santali_eval/
         ├── manifest.csv          <- Annotation metadata file
         └── audio/                <- Directory containing raw recordings
             ├── sample_001.wav
             ├── sample_002.wav
             └── ...

2. MANIFEST SCHEMA (manifest.csv):
   Required columns (CSV header):
   sample_id,audio_file,ground_truth,environment,speaker_id

   Example rows:
   sample_001,sample_001.wav,ᱡᱚᱦᱟᱨ ᱜᱟᱛᱮ,clean,SPK_01
   sample_002,sample_002.wav,ᱟᱢ ᱫᱚ ᱪᱮᱫ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱢᱟ?,noisy,SPK_02
   sample_003,sample_003.wav,ᱤᱧ ᱫᱚ ᱱᱟᱯᱟᱭ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ,clean,SPK_01

3. FIELD SPECIFICATIONS:
   - sample_id: Unique alphanumeric identifier.
   - audio_file: Filename in audio/ folder (WAV, FLAC, or OGG).
   - ground_truth: Verified native Ol Chiki script (Unicode U+1C50–U+1C7F).
     * Must be verified by native Santali speakers.
     * No Latin transliteration or Devanagari in ground_truth column.
   - environment: 'clean' (studio/quiet room) or 'noisy' (classroom/street).
     (If left empty, evaluator automatically computes acoustic SNR).
   - speaker_id: Optional identifier for gender/age/dialect coverage.

4. AUDIO RECORDING STANDARDS:
   - Format: PCM WAV 16-bit mono.
   - Sample Rate: 16,000 Hz (auto-resampled if 44.1kHz / 48kHz).
   - Length: 1.0s to 15.0s per utterance.
   - Diversity: Both short classroom commands and continuous conversational speech.

5. RUNNING THE EVALUATION ONCE ANNOTATED DATA IS PLACED:
   python scripts/evaluate_santali_asr.py --manifest data/santali_eval/manifest.csv --audio-dir data/santali_eval/audio/
=============================================================================
"""


# ---------------------------------------------------------------------------
# Evaluator Engine
# ---------------------------------------------------------------------------

class SantaliASREvaluator:
    def __init__(
        self,
        manifest_path: Optional[str] = None,
        audio_dir: Optional[str] = None,
        snr_threshold: float = 15.0,
        duration_threshold: float = 3.0
    ):
        self.manifest_path = Path(manifest_path) if manifest_path else None
        self.audio_dir = Path(audio_dir) if audio_dir else None
        self.snr_threshold = snr_threshold
        self.duration_threshold = duration_threshold
        self._engine = None

    def _get_engine(self):
        if self._engine is None:
            try:
                from server.asr.router import asr_router
                self._engine = asr_router.get_engine("sat")
            except Exception as e:
                raise RuntimeError(f"Failed to initialize Santali ASR engine: {e}")
        return self._engine

    def load_manifest(self) -> List[Dict[str, Any]]:
        """
        Loads and validates the manifest file.
        Returns list of verified annotation records.
        """
        if not self.manifest_path or not self.manifest_path.exists():
            return []

        samples = []
        if self.manifest_path.suffix.lower() == ".jsonl":
            with open(self.manifest_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        samples.append(json.loads(line))
        else:
            with open(self.manifest_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    samples.append(row)

        valid_samples = []
        for row in samples:
            audio_file = row.get("audio_file") or row.get("audio_path") or row.get("audio")
            ground_truth = row.get("ground_truth") or row.get("transcript") or row.get("text")
            sample_id = row.get("sample_id") or row.get("id") or (Path(audio_file).stem if audio_file else "unknown")
            env = row.get("environment") or row.get("noise") or ""
            spk = row.get("speaker_id") or row.get("speaker") or "unknown"

            if audio_file and ground_truth:
                valid_samples.append({
                    "sample_id": sample_id,
                    "audio_file": audio_file,
                    "ground_truth": ground_truth.strip(),
                    "environment": env.lower().strip(),
                    "speaker_id": spk
                })

        return valid_samples

    def evaluate_sample(self, sample: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Runs neural ASR on an authentic audio file and computes all metrics.
        """
        audio_name = sample["audio_file"]
        if self.audio_dir and (self.audio_dir / audio_name).exists():
            audio_path = self.audio_dir / audio_name
        elif Path(audio_name).exists():
            audio_path = Path(audio_name)
        else:
            print(f"[WARNING] Audio file not found: {audio_name} — skipping.")
            return None

        # Load and preprocess audio
        try:
            from server.audio.preprocessing import preprocess_audio_pipeline
            with open(audio_path, "rb") as f:
                audio_bytes = f.read()
            audio_data, duration_sec = preprocess_audio_pipeline(audio_bytes)
        except Exception as e:
            print(f"[ERROR] Failed to load/preprocess {audio_path}: {e}")
            return None

        if duration_sec <= 0:
            return None

        # Compute SNR if environment was not explicitly tagged
        snr_db = estimate_snr_db(audio_data)
        env = sample["environment"]
        if not env or env not in ["clean", "noisy"]:
            env = "clean" if snr_db >= self.snr_threshold else "noisy"

        # Run Neural ASR Model
        engine = self._get_engine()
        t0 = time.perf_counter()
        segments = engine.transcribe(audio_data, 16000)
        t1 = time.perf_counter()

        inference_time_sec = t1 - t0
        rtf = inference_time_sec / max(duration_sec, 0.001)

        prediction = " ".join(seg.text for seg in segments).strip()
        confidences = [seg.confidence for seg in segments if seg.confidence > 0]
        avg_confidence = float(np.mean(confidences)) if confidences else 0.0

        ground_truth = sample["ground_truth"]
        cer = calculate_cer(ground_truth, prediction)
        wer = calculate_wer(ground_truth, prediction)
        exact_match = is_exact_match(ground_truth, prediction)

        return {
            "sample_id": sample["sample_id"],
            "audio_file": sample["audio_file"],
            "ground_truth": ground_truth,
            "prediction": prediction,
            "cer": cer,
            "wer": wer,
            "exact_match": exact_match,
            "confidence": avg_confidence,
            "duration_sec": duration_sec,
            "inference_time_sec": inference_time_sec,
            "rtf": rtf,
            "snr_db": snr_db,
            "environment": env,
            "is_short": duration_sec < self.duration_threshold
        }

    def run(self, output_markdown: Optional[str] = None) -> Tuple[bool, str]:
        """
        Executes full benchmark evaluation.
        If no dataset is found, reports mandatory pending notice without fabrication.
        """
        samples = self.load_manifest()

        if not samples:
            banner_sep = "=" * 75
            msg = (
                f"\n{banner_sep}\n"
                f"  BHASHA SETU — SANTALI ASR ACCURACY EVALUATION\n"
                f"{banner_sep}\n\n"
                "STATUS: Accuracy measurement pending human-annotated Santali corpus.\n\n"
                "REASON: No human-annotated ground-truth audio/transcript manifest was found.\n"
                "POLICY: Bhasha Setu strictly adheres to responsible AI engineering.\n"
                "        Zero fabricated transcripts, synthetic audio, or falsified WER/CER\n"
                "        scores are generated in the absence of authentic empirical data.\n\n"
                + DATASET_FORMAT_SPEC
            )
            print(msg)
            if output_markdown:
                out_path = Path(output_markdown)
                out_path.parent.mkdir(parents=True, exist_ok=True)
                with open(out_path, "w", encoding="utf-8") as f:
                    f.write("# Santali ASR Accuracy Evaluation Report\n\n")
                    f.write("**Status:** `Accuracy measurement pending human-annotated Santali corpus.`\n\n")
                    f.write("> [!IMPORTANT]\n")
                    f.write("> **Empirical Rigor Policy:** Recognition accuracy (WER/CER) is strictly not\n")
                    f.write("> reported until measured against a human-annotated ground-truth corpus.\n")
                    f.write("> Zero synthetic or fabricated test data was used.\n\n")
                    f.write("```\n" + DATASET_FORMAT_SPEC + "\n```\n")
            return False, msg

        # Evaluate all available samples
        results = []
        print(f"Loaded {len(samples)} ground-truth samples. Running neural inference...")
        for idx, sample in enumerate(samples, 1):
            res = self.evaluate_sample(sample)
            if res:
                results.append(res)
                print(f"[{idx}/{len(samples)}] Sample {res['sample_id']}: CER={res['cer']:.2%}, WER={res['wer']:.2%}, RTF={res['rtf']:.3f}x")

        if not results:
            err_msg = "No audio files could be resolved from the manifest."
            print(err_msg)
            return False, err_msg

        # Compute aggregate metrics
        avg_cer = float(np.mean([r["cer"] for r in results]))
        avg_wer = float(np.mean([r["wer"] for r in results]))
        exact_match_rate = float(np.mean([1.0 if r["exact_match"] else 0.0 for r in results]))
        avg_confidence = float(np.mean([r["confidence"] for r in results]))
        avg_rtf = float(np.mean([r["rtf"] for r in results]))
        total_duration = sum(r["duration_sec"] for r in results)
        total_inference = sum(r["inference_time_sec"] for r in results)

        # Slices
        clean_subset = [r for r in results if r["environment"] == "clean"]
        noisy_subset = [r for r in results if r["environment"] == "noisy"]
        short_subset = [r for r in results if r["is_short"]]
        long_subset = [r for r in results if not r["is_short"]]

        def get_subset_metrics(sub: List[Dict[str, Any]]) -> Dict[str, Any]:
            if not sub:
                return {"count": 0, "cer": 0.0, "wer": 0.0, "exact": 0.0, "conf": 0.0, "rtf": 0.0}
            return {
                "count": len(sub),
                "cer": float(np.mean([r["cer"] for r in sub])),
                "wer": float(np.mean([r["wer"] for r in sub])),
                "exact": float(np.mean([1.0 if r["exact_match"] else 0.0 for r in sub])),
                "conf": float(np.mean([r["confidence"] for r in sub])),
                "rtf": float(np.mean([r["rtf"] for r in sub])),
            }

        m_clean = get_subset_metrics(clean_subset)
        m_noisy = get_subset_metrics(noisy_subset)
        m_short = get_subset_metrics(short_subset)
        m_long = get_subset_metrics(long_subset)

        # Format Markdown Report
        lines = []
        lines.append("# Santali ASR Empirical Accuracy Evaluation Report")
        lines.append("")
        lines.append(f"**Date:** {time.strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append(f"**Evaluated Samples:** {len(results)}")
        lines.append(f"**Total Audio Duration:** {total_duration:.2f}s")
        lines.append(f"**Total Inference Time:** {total_inference:.2f}s")
        lines.append("")
        lines.append("## 1. Aggregate Benchmark Results")
        lines.append("")
        lines.append("| Metric | Aggregate Value | Description |")
        lines.append("| :--- | :---: | :--- |")
        lines.append(f"| **Average CER** | **{avg_cer:.2%}** | Character Error Rate (Levenshtein over Unicode Ol Chiki characters) |")
        lines.append(f"| **Average WER** | **{avg_wer:.2%}** | Word Error Rate (Levenshtein over whitespace-tokenized words) |")
        lines.append(f"| **Exact Match Rate** | **{exact_match_rate:.2%}** | Strict 100% character-for-character match |")
        lines.append(f"| **Average Acoustic Confidence** | **{avg_confidence:.2%}** | Model CTC frame softmax posterior |")
        lines.append(f"| **Average RTF** | **{avg_rtf:.3f}x** | Real-Time Factor (Inference time / Audio duration) |")
        lines.append("")
        lines.append("## 2. Disaggregated Category Breakdown")
        lines.append("")
        lines.append("| Condition / Slice | Count | Avg CER | Avg WER | Exact Match | Avg Confidence | Avg RTF |")
        lines.append("| :--- | :---: | :---: | :---: | :---: | :---: | :---: |")
        lines.append(f"| **Clean Audio (SNR ≥ 15dB)** | {m_clean['count']} | {m_clean['cer']:.2%} | {m_clean['wer']:.2%} | {m_clean['exact']:.2%} | {m_clean['conf']:.2%} | {m_clean['rtf']:.3f}x |")
        lines.append(f"| **Noisy Audio (SNR < 15dB)** | {m_noisy['count']} | {m_noisy['cer']:.2%} | {m_noisy['wer']:.2%} | {m_noisy['exact']:.2%} | {m_noisy['conf']:.2%} | {m_noisy['rtf']:.3f}x |")
        lines.append(f"| **Short Utterances (< 3.0s)** | {m_short['count']} | {m_short['cer']:.2%} | {m_short['wer']:.2%} | {m_short['exact']:.2%} | {m_short['conf']:.2%} | {m_short['rtf']:.3f}x |")
        lines.append(f"| **Long Utterances (≥ 3.0s)** | {m_long['count']} | {m_long['cer']:.2%} | {m_long['wer']:.2%} | {m_long['exact']:.2%} | {m_long['conf']:.2%} | {m_long['rtf']:.3f}x |")
        lines.append("")
        lines.append("## 3. Per-Sample Evaluation Log")
        lines.append("")
        lines.append("| Sample | Ground Truth | Prediction | CER | WER | Confidence | RTF |")
        lines.append("| :--- | :--- | :--- | --: | --: | ---------: | --: |")
        for r in results:
            gt_disp = r["ground_truth"].replace("|", "\\|")
            pr_disp = r["prediction"].replace("|", "\\|")
            lines.append(f"| `{r['sample_id']}` | {gt_disp} | {pr_disp} | {r['cer']:.2%} | {r['wer']:.2%} | {r['confidence']:.2%} | {r['rtf']:.3f}x |")
        lines.append("")

        report_content = "\n".join(lines)
        print("\n" + report_content)

        if output_markdown:
            out_path = Path(output_markdown)
            out_path.parent.mkdir(parents=True, exist_ok=True)
            with open(out_path, "w", encoding="utf-8") as f:
                f.write(report_content)
            print(f"\n[INFO] Evaluation report saved to: {out_path.resolve()}")

        return True, report_content


# ---------------------------------------------------------------------------
# CLI Entry Point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Empirical Santali ASR Accuracy & Performance Benchmark"
    )
    parser.add_argument(
        "--manifest",
        type=str,
        default=None,
        help="Path to manifest CSV or JSONL file containing ground-truth annotations"
    )
    parser.add_argument(
        "--audio-dir",
        type=str,
        default=None,
        help="Directory containing the authentic Santali audio files"
    )
    parser.add_argument(
        "--output",
        type=str,
        default=str(PROJECT_ROOT / "reports" / "SANTALI_ASR_ACCURACY_EVALUATION.md"),
        help="Path to save the generated Markdown evaluation report"
    )
    parser.add_argument(
        "--snr-threshold",
        type=float,
        default=15.0,
        help="Acoustic SNR threshold in dB to distinguish clean vs noisy audio (default: 15.0)"
    )
    parser.add_argument(
        "--duration-threshold",
        type=float,
        default=3.0,
        help="Duration threshold in seconds to distinguish short vs long utterances (default: 3.0)"
    )
    parser.add_argument(
        "--format-help",
        action="store_true",
        help="Display the required ground-truth dataset format and exit"
    )

    args = parser.parse_args()

    if args.format_help:
        print(DATASET_FORMAT_SPEC)
        return

    # Check default potential manifest paths if not explicitly provided
    manifest_path = args.manifest
    audio_dir = args.audio_dir

    default_candidates = [
        (PROJECT_ROOT / "data" / "santali_eval" / "manifest.csv", PROJECT_ROOT / "data" / "santali_eval" / "audio"),
        (PROJECT_ROOT / "data" / "eval" / "manifest.csv", PROJECT_ROOT / "data" / "eval" / "audio"),
        (PROJECT_ROOT / "eval_manifest.csv", PROJECT_ROOT / "audio"),
    ]

    if not manifest_path:
        for m_cand, a_cand in default_candidates:
            if m_cand.exists():
                manifest_path = str(m_cand)
                audio_dir = str(a_cand)
                break

    evaluator = SantaliASREvaluator(
        manifest_path=manifest_path,
        audio_dir=audio_dir,
        snr_threshold=args.snr_threshold,
        duration_threshold=args.duration_threshold
    )

    evaluator.run(output_markdown=args.output)


if __name__ == "__main__":
    main()
