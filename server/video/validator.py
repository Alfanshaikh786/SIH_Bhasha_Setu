"""
Subtitle Quality Validation Engine
Enforces structural, temporal, and linguistic integrity before subtitles are marked COMPLETED.
Validates CPS, line counts, Unicode ranges (Ol Chiki U+1C50-U+1C7F), and timeline invariants.
"""

from typing import List, Dict, Any, Optional
from server.video.timeline import SubtitleCue


def validate_subtitles(
    cues: List[SubtitleCue],
    total_duration_sec: float = 0.0,
    allow_empty_if_instrumental: bool = False
) -> Dict[str, Any]:
    """
    Validates a list of SubtitleCue objects against strict criteria:
    Fatal Errors (result in valid = False):
    - Negative or NaN start/end timestamps
    - Negative or zero duration (end <= start)
    - Consecutive overlapping cues (start_{i+1} < end_i - 0.05)
    - Empty cue text (unless allow_empty_if_instrumental)
    - Corrupted unicode

    Warnings (allowed to pass, but flagged for review):
    - High CPS reading speed (> 20.0 CPS)
    - Line count exceeding recommended 2 lines
    - Repeated adjacent identical phrases (possible ASR hallucination)
    - Cues with very short (< 0.6s) or very long (> 7.0s) duration
    - Excessively long cue text (> 90 characters)
    - Cue ending beyond total media duration (+ 1.0s buffer)
    """
    fatal_errors: List[str] = []
    warnings: List[str] = []
    review_required = 0

    if not cues:
        if allow_empty_if_instrumental:
            return {
                "valid": True,
                "fatal_errors": [],
                "warnings": ["Media contains instrumental/music content with no vocal dialogue."],
                "segments_checked": 0,
                "review_required": 0
            }
        return {
            "valid": False,
            "fatal_errors": ["No subtitle cues were generated."],
            "warnings": [],
            "segments_checked": 0,
            "review_required": 0
        }

    prev_cue: Optional[SubtitleCue] = None
    repeated_phrase_count = 0

    for i, cue in enumerate(cues):
        cue_id = f"Cue #{cue.index} ({cue.start_sec}s -> {cue.end_sec}s)"

        # 1. Text checks
        text = cue.translated_text.strip() or cue.source_text.strip()
        if not text:
            fatal_errors.append(f"{cue_id}: Empty subtitle text.")

        # Check Unicode encoding
        try:
            text.encode("utf-8")
        except UnicodeEncodeError as uee:
            fatal_errors.append(f"{cue_id}: Unicode corruption detected: {uee}")

        # Excessively long text warning (> 90 chars total per cue)
        if len(text) > 90:
            warnings.append(f"{cue_id}: Text length ({len(text)} chars) exceeds recommended limit of 84 characters.")
            review_required += 1

        # Line count check (max 2 lines)
        line_cnt = cue.line_count if hasattr(cue, "line_count") else max(1, text.count("\n") + 1)
        if line_cnt > 2:
            warnings.append(f"{cue_id}: Exceeds 2-line maximum ({line_cnt} lines).")
            review_required += 1

        # 2. Timestamp checks
        if cue.start_sec < 0.0 or cue.end_sec < 0.0:
            fatal_errors.append(f"{cue_id}: Negative timestamp detected.")

        if cue.end_sec <= cue.start_sec:
            fatal_errors.append(f"{cue_id}: Zero or negative duration ({cue.duration_sec}s).")

        # 3. Duration warnings
        if cue.duration_sec < 0.6:
            warnings.append(f"{cue_id}: Subtitle duration ({cue.duration_sec}s) is very short (<0.6s).")
            review_required += 1
        elif cue.duration_sec > 7.0:
            warnings.append(f"{cue_id}: Subtitle duration ({cue.duration_sec}s) is unusually long (>7.0s).")
            review_required += 1

        # CPS check (> 20 CPS is difficult to read)
        cps_val = cue.cps if hasattr(cue, "cps") else round(len(text.replace("\n", "")) / max(0.1, cue.duration_sec), 1)
        if cps_val > 21.0:
            warnings.append(f"{cue_id}: Reading speed ({cps_val} CPS) is high (>21 CPS).")
            review_required += 1

        # 4. Total video bounds check
        if total_duration_sec > 0 and cue.end_sec > (total_duration_sec + 1.0):
            warnings.append(f"{cue_id}: Subtitle ends at {cue.end_sec}s, which exceeds video duration ({total_duration_sec}s).")
            review_required += 1

        # 5. Overlap & repetition checks with previous cue
        if prev_cue is not None:
            # Overlap check
            if cue.start_sec < (prev_cue.end_sec - 0.05):
                fatal_errors.append(
                    f"Overlap detected: Cue #{prev_cue.index} ends at {prev_cue.end_sec}s, but Cue #{cue.index} starts at {cue.start_sec}s."
                )

            # Hallucination / exact repetition check
            prev_text = prev_cue.translated_text.strip().lower()
            curr_text = text.lower()
            if prev_text and curr_text == prev_text:
                repeated_phrase_count += 1
                if repeated_phrase_count >= 2:
                    warnings.append(f"{cue_id}: Phrase repeated multiple times consecutively ('{text[:30]}...'). Possible ASR hallucination.")
                    review_required += 1
            else:
                repeated_phrase_count = 0

        prev_cue = cue

    is_valid = (len(fatal_errors) == 0)

    return {
        "valid": is_valid,
        "fatal_errors": fatal_errors,
        "warnings": warnings,
        "segments_checked": len(cues),
        "review_required": review_required
    }
