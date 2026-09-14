"""
Timeline Preservation and Audio-Video Alignment Utilities
Ensures strict invariance of original media timeline timestamps.
Extends SubtitleCue with confidence gating, media types, review states, CPS, and provenance.
"""

from typing import List, Dict, Any, Optional
import numpy as np


class SubtitleCue:
    """
    Represents a single validated subtitle cue bound to the original media timeline.
    Supports recognition confidence, media classification, provenance, and verification states.
    """
    def __init__(
        self,
        index: int,
        start_sec: float,
        end_sec: float,
        source_text: str,
        translated_text: Optional[str] = None,
        romanized_text: Optional[str] = None,
        tts_text: Optional[str] = None,
        speaker: str = "Speaker",
        confidence: Optional[float] = None,
        recognition_confidence: Optional[float] = None,
        translation_source: str = "original",
        domain: Optional[str] = None,
        source_language: str = "auto",
        target_language: str = "sat",
        target_script: str = "Ol Chiki",
        media_type: str = "speech",
        review_status: Optional[str] = None,
        translation_status: str = "MACHINE_TRANSLATED",
        verification_status: str = "UNVERIFIED",
        provenance: Optional[Dict[str, str]] = None,
        is_stale: bool = False,
        audio_available: bool = False,
        tts_status: str = "IDLE"
    ):
        self.index = index
        self.start_sec = round(float(start_sec), 3)
        self.end_sec = round(float(end_sec), 3)
        self.source_text = source_text.strip()
        self.translated_text = translated_text.strip() if translated_text else self.source_text
        self.romanized_text = romanized_text.strip() if romanized_text else ""
        self.tts_text = tts_text.strip() if tts_text else (self.romanized_text or self.translated_text)
        self.speaker = speaker

        # Centralized confidence handling
        eff_conf = recognition_confidence if recognition_confidence is not None else confidence
        self.confidence = eff_conf
        self.recognition_confidence = eff_conf

        self.translation_source = translation_source
        self.domain = domain
        self.source_language = source_language
        self.target_language = target_language
        self.target_script = target_script
        self.media_type = media_type

        # Intelligent Review Status determination
        if review_status:
            self.review_status = review_status
        else:
            if eff_conf is not None and eff_conf < 0.65:
                self.review_status = "REVIEW_REQUIRED"
            else:
                self.review_status = "AUTO_GENERATED"

        self.translation_status = translation_status
        self.verification_status = verification_status
        self.is_stale = is_stale

        # Provenance metadata
        if provenance is not None:
            self.provenance = provenance
        else:
            self.provenance = {
                "recognition": "faster-whisper",
                "translation": self.translation_source,
                "tts": "indic-parler-tts-fallback"
            }

        self.audio_available = audio_available
        self.tts_status = tts_status

    @property
    def duration_sec(self) -> float:
        return round(max(0.05, self.end_sec - self.start_sec), 3)

    @property
    def character_count(self) -> int:
        return len(self.translated_text or self.source_text)

    @property
    def line_count(self) -> int:
        text = self.translated_text or self.source_text
        return max(1, text.count("\n") + 1)

    @property
    def cps(self) -> float:
        dur = self.duration_sec
        if dur <= 0:
            return 0.0
        # Calculate CPS based on visible characters
        vis_chars = len(self.translated_text.replace("\n", "").strip())
        return round(vis_chars / dur, 1)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "index": self.index,
            "id": f"cue_{self.index}",
            "start_sec": self.start_sec,
            "end_sec": self.end_sec,
            "duration_sec": self.duration_sec,
            "source_text": self.source_text,
            "text": self.translated_text,
            "translated_text": self.translated_text,
            "romanized_text": self.romanized_text,
            "tts_text": self.tts_text,
            "speaker": self.speaker,
            "confidence": self.confidence,
            "recognition_confidence": self.recognition_confidence,
            "translation_source": self.translation_source,
            "domain": self.domain,
            "source_language": self.source_language,
            "target_language": self.target_language,
            "target_script": self.target_script,
            "media_type": self.media_type,
            "review_status": self.review_status,
            "translation_status": self.translation_status,
            "verification_status": self.verification_status,
            "provenance": self.provenance,
            "is_stale": self.is_stale,
            "cps": self.cps,
            "line_count": self.line_count,
            "character_count": self.character_count,
            "audio_available": self.audio_available,
            "tts_status": self.tts_status
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
        if start is None and isinstance(seg, dict):
            start = seg.get("start_sec", seg.get("start"))

        end = getattr(seg, "end_sec", None)
        if end is None and isinstance(seg, dict):
            end = seg.get("end_sec", seg.get("end"))

        text = getattr(seg, "text", "")
        if not text and isinstance(seg, dict):
            text = seg.get("text", seg.get("source_text", ""))

        if start is None or end is None:
            continue

        start = max(0.0, float(start))
        end = max(start + 0.1, float(end))

        if total_duration_sec > 0:
            end = min(end, total_duration_sec)

        # Enforce no negative duration
        if end <= start:
            end = start + 0.5

        speaker = getattr(seg, "speaker", None)
        if not speaker and isinstance(seg, dict):
            speaker = seg.get("speaker")
        if not speaker:
            speaker = f"Speaker {1 if idx % 2 == 0 else 2}"

        conf = getattr(seg, "asr_confidence", None)
        if conf is None and isinstance(seg, dict):
            conf = seg.get("confidence", seg.get("asr_confidence"))

        cues.append(
            SubtitleCue(
                index=idx + 1,
                start_sec=start,
                end_sec=end,
                source_text=text,
                speaker=speaker,
                confidence=conf,
                recognition_confidence=conf
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


def generate_speech_snap_points(
    cues: List[SubtitleCue],
    min_silence_sec: float = 0.20
) -> List[Dict[str, Any]]:
    """
    Generates candidate speech snap points (speech_start, speech_end, pause, speaker_change)
    from subtitle timeline cues for precision synchronization.
    """
    if not cues:
        return []

    raw_points: List[Dict[str, Any]] = []

    for i, cue in enumerate(cues):
        conf = cue.confidence if cue.confidence is not None else 0.90

        # 1. Speech start boundary
        raw_points.append({
            "timestamp": cue.start_sec,
            "type": "speech_start",
            "confidence": conf,
            "label": f"Cue #{cue.index} Start"
        })

        # 2. Speech end boundary
        raw_points.append({
            "timestamp": cue.end_sec,
            "type": "speech_end",
            "confidence": conf,
            "label": f"Cue #{cue.index} End"
        })

        # 3. Inter-cue silence pause and speaker changes
        if i < len(cues) - 1:
            next_cue = cues[i + 1]
            gap = next_cue.start_sec - cue.end_sec

            if gap >= min_silence_sec:
                pause_center = round((cue.end_sec + next_cue.start_sec) / 2.0, 3)
                raw_points.append({
                    "timestamp": pause_center,
                    "type": "pause",
                    "confidence": 0.85,
                    "label": f"Pause ({gap:.2f}s)"
                })

            if cue.speaker and next_cue.speaker and cue.speaker != next_cue.speaker:
                raw_points.append({
                    "timestamp": next_cue.start_sec,
                    "type": "speaker_change",
                    "confidence": 0.95,
                    "speaker": next_cue.speaker,
                    "label": f"Speaker: {next_cue.speaker}"
                })

    raw_points.sort(key=lambda p: p["timestamp"])

    type_priority = {
        "speaker_change": 4,
        "speech_start": 3,
        "speech_end": 2,
        "pause": 1
    }

    deduplicated: List[Dict[str, Any]] = []
    for pt in raw_points:
        if not deduplicated:
            deduplicated.append(pt)
            continue

        last = deduplicated[-1]
        if abs(pt["timestamp"] - last["timestamp"]) < 0.04:
            if type_priority.get(pt["type"], 0) > type_priority.get(last["type"], 0):
                deduplicated[-1] = pt
        else:
            deduplicated.append(pt)

    return deduplicated
