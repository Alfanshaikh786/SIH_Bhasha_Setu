"""
Timeline Preservation and Audio-Video Alignment Utilities
Ensures strict invariance of original media timeline timestamps.
"""

from typing import List, Dict, Any, Optional
import numpy as np


class SubtitleCue:
    """
    Represents a single validated subtitle cue bound to the original media timeline.
    """
    def __init__(
        self,
        index: int,
        start_sec: float,
        end_sec: float,
        source_text: str,
        translated_text: Optional[str] = None,
        speaker: str = "Speaker",
        confidence: Optional[float] = None,
        translation_source: str = "original"
    ):
        self.index = index
        self.start_sec = round(float(start_sec), 3)
        self.end_sec = round(float(end_sec), 3)
        self.source_text = source_text.strip()
        self.translated_text = translated_text.strip() if translated_text else self.source_text
        self.speaker = speaker
        self.confidence = confidence
        self.translation_source = translation_source

    @property
    def duration_sec(self) -> float:
        return round(self.end_sec - self.start_sec, 3)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "index": self.index,
            "start_sec": self.start_sec,
            "end_sec": self.end_sec,
            "duration_sec": self.duration_sec,
            "source_text": self.source_text,
            "text": self.translated_text,
            "translated_text": self.translated_text,
            "speaker": self.speaker,
            "confidence": self.confidence,
            "translation_source": self.translation_source
        }


def preserve_media_timeline(
    raw_segments: List[Any],
    total_duration_sec: float,
    min_gap_sec: float = 0.05
) -> List[SubtitleCue]:
    """
    Enforces timeline preservation invariants:
    1. Timestamps match the absolute media timeline (silence periods are never squashed).
    2. Start times must be strictly monotonic (start_i <= start_{i+1}).
    3. Overlaps are resolved by clamping end_i to (start_{i+1} - min_gap_sec).
    4. End times never exceed total media duration.
    5. Duration must be positive (end > start).
    """
    if not raw_segments:
        return []

    cues: List[SubtitleCue] = []
    
    for idx, seg in enumerate(raw_segments):
        start = getattr(seg, "start_sec", None)
        end = getattr(seg, "end_sec", None)
        text = getattr(seg, "text", "")

        if start is None or end is None:
            continue

        start = max(0.0, float(start))
        end = max(start + 0.1, float(end))

        if total_duration_sec > 0:
            end = min(end, total_duration_sec)

        # Enforce no negative duration
        if end <= start:
            end = start + 0.5

        speaker = getattr(seg, "speaker", f"Speaker {1 if idx % 2 == 0 else 2}")
        conf = getattr(seg, "asr_confidence", None)

        cues.append(
            SubtitleCue(
                index=idx + 1,
                start_sec=start,
                end_sec=end,
                source_text=text,
                speaker=speaker,
                confidence=conf
            )
        )

    # Sort strictly by start time
    cues.sort(key=lambda c: c.start_sec)

    # Resolve overlaps without squashing silence
    for i in range(len(cues) - 1):
        curr_cue = cues[i]
        next_cue = cues[i + 1]

        if curr_cue.end_sec > next_cue.start_sec:
            # Clamp current end to slightly before next start
            adjusted_end = max(curr_cue.start_sec + 0.3, next_cue.start_sec - min_gap_sec)
            curr_cue.end_sec = round(adjusted_end, 3)

        # Re-index
        curr_cue.index = i + 1

    if cues:
        cues[-1].index = len(cues)

    return cues
