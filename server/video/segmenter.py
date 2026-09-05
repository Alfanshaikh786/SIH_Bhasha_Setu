"""
Subtitle Segmentation Engine
Formats text into readable, standard subtitle cues (max 2 lines, configurable length, natural splits).
"""

import re
from typing import List, Optional
from server.video.timeline import SubtitleCue


class SubtitleSegmentationConfig:
    def __init__(
        self,
        max_chars_per_line: int = 42,
        max_lines_per_cue: int = 2,
        min_duration_sec: float = 1.0,
        max_duration_sec: float = 6.5
    ):
        self.max_chars_per_line = max_chars_per_line
        self.max_lines_per_cue = max_lines_per_cue
        self.min_duration_sec = min_duration_sec
        self.max_duration_sec = max_duration_sec


def wrap_text_to_lines(text: str, max_chars_per_line: int = 42, max_lines: int = 2) -> str:
    """
    Wraps text into up to max_lines lines without splitting words awkwardly.
    """
    words = text.strip().split()
    if not words:
        return ""

    lines = []
    current_line = []
    current_len = 0

    for w in words:
        if current_len + len(w) + (1 if current_line else 0) <= max_chars_per_line:
            current_line.append(w)
            current_len += len(w) + (1 if len(current_line) > 1 else 0)
        else:
            if current_line:
                lines.append(" ".join(current_line))
            current_line = [w]
            current_len = len(w)

    if current_line:
        lines.append(" ".join(current_line))

    # If lines exceed max_lines, compress excess lines onto the last line
    if len(lines) > max_lines:
        kept = lines[:max_lines - 1]
        excess = " ".join(lines[max_lines - 1:])
        kept.append(excess)
        return "\n".join(kept)

    return "\n".join(lines)


def segment_subtitles(
    cues: List[SubtitleCue],
    config: Optional[SubtitleSegmentationConfig] = None
) -> List[SubtitleCue]:
    """
    Processes raw cues:
    1. Splits excessively long cues (> max_duration_sec) at sentence/clause boundaries proportionally.
    2. Wraps each cue's display text to max_lines with max_chars_per_line.
    3. Guarantees no empty cues, no negative duration, and monotonically increasing indices.
    """
    if not cues:
        return []

    cfg = config or SubtitleSegmentationConfig()
    segmented: List[SubtitleCue] = []

    for cue in cues:
        raw_text = cue.translated_text.strip() or cue.source_text.strip()
        if not raw_text:
            continue

        dur = cue.duration_sec

        # Check if cue duration exceeds max_duration_sec AND has multiple clauses/sentences
        if dur > cfg.max_duration_sec and len(raw_text) > cfg.max_chars_per_line * 1.5:
            # Attempt to split on punctuation marks: ., !, ?, ।, ᱾ (Ol Chiki mucad)
            parts = re.split(r'([.!?|।᱾]+(?:\s+|$))', raw_text)
            sentences = []
            cur = ""
            for p in parts:
                cur += p
                if re.search(r'[.!?|।᱾]', p) or len(cur) >= cfg.max_chars_per_line * 1.5:
                    if cur.strip():
                        sentences.append(cur.strip())
                    cur = ""
            if cur.strip():
                sentences.append(cur.strip())

            if len(sentences) > 1:
                total_chars = sum(len(s) for s in sentences)
                cur_start = cue.start_sec
                for s_idx, s in enumerate(sentences):
                    weight = len(s) / float(total_chars) if total_chars > 0 else (1.0 / len(sentences))
                    sub_dur = max(cfg.min_duration_sec, round(dur * weight, 3))
                    cur_end = min(cue.end_sec, round(cur_start + sub_dur, 3))
                    if s_idx == len(sentences) - 1:
                        cur_end = cue.end_sec

                    wrapped = wrap_text_to_lines(s, cfg.max_chars_per_line, cfg.max_lines_per_cue)
                    segmented.append(
                        SubtitleCue(
                            index=len(segmented) + 1,
                            start_sec=cur_start,
                            end_sec=cur_end,
                            source_text=s,
                            translated_text=wrapped,
                            speaker=cue.speaker,
                            confidence=cue.confidence,
                            translation_source=cue.translation_source
                        )
                    )
                    cur_start = cur_end
                continue

        # Normal cue: wrap text
        wrapped_text = wrap_text_to_lines(raw_text, cfg.max_chars_per_line, cfg.max_lines_per_cue)
        cue.translated_text = wrapped_text
        cue.index = len(segmented) + 1
        segmented.append(cue)

    # Re-index
    for idx, c in enumerate(segmented):
        c.index = idx + 1

    return segmented
