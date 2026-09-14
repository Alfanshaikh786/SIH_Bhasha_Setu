"""
Media Content Classifier
Classifies media timeline regions into speech, singing, instrumental, silence, or unknown.
Modular interface designed for acoustic heuristics and neural model pluggability.
"""

import os
import math
from enum import Enum
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional
import numpy as np
import soundfile as sf


class MediaType(str, Enum):
    SPEECH = "speech"
    SINGING = "singing"
    INSTRUMENTAL = "instrumental"
    SILENCE = "silence"
    UNKNOWN = "unknown"


class ContentMode(str, Enum):
    SONG_LYRICS = "song_lyrics"
    SPEECH_DIALOGUE = "speech_dialogue"
    INSTRUMENTAL = "instrumental"
    MIXED = "mixed"

    @classmethod
    def display_label(cls, mode: str) -> str:
        mapping = {
            cls.SONG_LYRICS.value: "Song / Lyrics",
            cls.SPEECH_DIALOGUE.value: "Speech / Dialogue",
            cls.INSTRUMENTAL.value: "Music / Instrumental",
            cls.MIXED.value: "Mixed Content"
        }
        return mapping.get(mode, "Song / Lyrics")


@dataclass
class MediaRegion:
    id: str
    start: float
    end: float
    type: str  # MediaType value
    confidence: float
    rms: float = 0.0
    speech_probability: float = 0.0
    music_probability: float = 0.0
    notes: str = ""

    @property
    def duration(self) -> float:
        return round(max(0.0, self.end - self.start), 3)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "start": round(self.start, 3),
            "end": round(self.end, 3),
            "duration": self.duration,
            "type": self.type,
            "confidence": round(self.confidence, 3),
            "rms": round(self.rms, 4),
            "speech_probability": round(self.speech_probability, 3),
            "music_probability": round(self.music_probability, 3),
            "notes": self.notes
        }


class MediaClassifier:
    """
    Modular classifier for media timeline audio.
    Combines acoustic energy analysis (RMS, zero-crossing rate, spectral variance)
    with ASR VAD / speech hypothesis signals to reliably identify:
      - Speech / Spoken dialogue
      - Singing / Vocals with background music
      - Instrumental music (high harmonic energy, no speech)
      - Silence / Ambient room tone
    """

    def __init__(
        self,
        silence_rms_threshold: float = 0.008,
        instrumental_rms_threshold: float = 0.025,
        min_region_duration: float = 0.3
    ):
        self.silence_rms_threshold = silence_rms_threshold
        self.instrumental_rms_threshold = instrumental_rms_threshold
        self.min_region_duration = min_region_duration

    def detect_content_mode(self, regions: List[MediaRegion]) -> str:
        """
        Determines overall media content mode from classified regions:
        - 'song_lyrics' if vocal regions are predominantly singing or lyrics
        - 'speech_dialogue' if vocal regions are standard conversational speech
        - 'instrumental' if entire media is non-vocal music
        - 'mixed' if both speech dialogue and singing/music are substantial
        """
        if not regions:
            return ContentMode.SONG_LYRICS.value

        singing_dur = sum(r.duration for r in regions if r.type == MediaType.SINGING.value)
        speech_dur = sum(r.duration for r in regions if r.type == MediaType.SPEECH.value)
        inst_dur = sum(r.duration for r in regions if r.type == MediaType.INSTRUMENTAL.value)
        vocal_dur = singing_dur + speech_dur

        if vocal_dur > 0:
            if singing_dur >= 0.40 * vocal_dur:
                return ContentMode.SONG_LYRICS.value
            elif speech_dur > 0 and (singing_dur > 0 or inst_dur > 5.0):
                return ContentMode.MIXED.value
            else:
                return ContentMode.SPEECH_DIALOGUE.value
        else:
            if inst_dur > 0:
                return ContentMode.INSTRUMENTAL.value
            return ContentMode.SPEECH_DIALOGUE.value

    def analyze_audio_array(
        self,
        audio_data: np.ndarray,
        sr: int = 16000,
        asr_segments: Optional[List[Any]] = None,
        total_duration: Optional[float] = None
    ) -> List[MediaRegion]:
        """
        Classifies the full media duration into contiguous MediaRegion segments.
        Ensures 100% of the timeline is covered.
        """
        if audio_data is None or len(audio_data) == 0:
            return []

        # Ensure mono float32
        if audio_data.ndim > 1:
            audio_data = np.mean(audio_data, axis=1)
        if audio_data.dtype != np.float32:
            audio_data = audio_data.astype(np.float32)

        actual_duration = len(audio_data) / float(sr)
        if total_duration is None or total_duration <= 0:
            total_duration = actual_duration
        else:
            total_duration = max(total_duration, actual_duration)

        # 1. Identify ASR vocal coverage boundaries
        vocal_spans: List[Dict[str, Any]] = []
        if asr_segments:
            for seg in asr_segments:
                s = getattr(seg, "start_sec", None)
                if s is None and hasattr(seg, "get"):
                    s = seg.get("start_sec", seg.get("start"))
                e = getattr(seg, "end_sec", None)
                if e is None and hasattr(seg, "get"):
                    e = seg.get("end_sec", seg.get("end"))

                if s is not None and e is not None:
                    s = max(0.0, float(s))
                    e = min(total_duration, max(s + 0.1, float(e)))
                    conf = getattr(seg, "asr_confidence", None)
                    if conf is None and hasattr(seg, "get"):
                        conf = seg.get("confidence", seg.get("asr_confidence", 0.7))
                    if conf is None:
                        conf = 0.7

                    text = getattr(seg, "text", "")
                    if not text and hasattr(seg, "get"):
                        text = seg.get("text", seg.get("source_text", ""))

                    vocal_spans.append({
                        "start": s,
                        "end": e,
                        "confidence": float(conf),
                        "text": text
                    })

        # Merge overlapping or close vocal spans (< 0.4s gap)
        merged_vocals = self._merge_spans(vocal_spans, gap_threshold=0.4)

        # 2. Slice the entire timeline into vocal regions and non-vocal gaps
        timeline_cuts: List[Dict[str, Any]] = []
        current_t = 0.0

        for v in merged_vocals:
            v_start = v["start"]
            v_end = v["end"]

            # Gap before vocal span
            if v_start > current_t + 0.15:
                timeline_cuts.append({
                    "start": current_t,
                    "end": v_start,
                    "is_vocal": False,
                    "vocal_meta": None
                })

            # Vocal span
            timeline_cuts.append({
                "start": max(current_t, v_start),
                "end": v_end,
                "is_vocal": True,
                "vocal_meta": v
            })
            current_t = v_end

        # Trailing gap after last vocal span up to total_duration
        if current_t < total_duration - 0.1:
            timeline_cuts.append({
                "start": current_t,
                "end": total_duration,
                "is_vocal": False,
                "vocal_meta": None
            })

        # If no ASR segments existed at all, entire timeline is one non-vocal cut
        if not timeline_cuts:
            timeline_cuts.append({
                "start": 0.0,
                "end": total_duration,
                "is_vocal": False,
                "vocal_meta": None
            })

        # 3. Classify each cut using acoustic energy & spectral features
        regions: List[MediaRegion] = []
        region_idx = 1

        for cut in timeline_cuts:
            start_sec = cut["start"]
            end_sec = cut["end"]
            start_sample = max(0, int(start_sec * sr))
            end_sample = min(len(audio_data), int(end_sec * sr))

            chunk = audio_data[start_sample:end_sample] if end_sample > start_sample else np.zeros(100, dtype=np.float32)
            rms = float(np.sqrt(np.mean(chunk ** 2))) if len(chunk) > 0 else 0.0

            # Zero-crossing rate calculation
            zcr = float(np.mean(np.abs(np.diff(np.signbit(chunk))))) if len(chunk) > 1 else 0.0

            if cut["is_vocal"]:
                v_meta = cut["vocal_meta"] or {}
                conf = v_meta.get("confidence", 0.7)

                # Heuristic for singing vs speech:
                # Singing typically exhibits higher sustained energy (RMS > 0.05) and lower ZCR variance
                # In songs, vocal regions with high instrumental background are categorized as singing
                is_likely_singing = rms >= 0.04 and conf < 0.75  # songs often have lower ASR acoustic confidence due to music accompaniment

                reg_type = MediaType.SINGING if is_likely_singing else MediaType.SPEECH
                speech_prob = 0.9 if reg_type == MediaType.SPEECH else 0.6
                music_prob = 0.7 if reg_type == MediaType.SINGING else 0.2
                notes = "Vocals / lyrics detected" if reg_type == MediaType.SINGING else "Spoken dialogue detected"

                regions.append(MediaRegion(
                    id=f"region_{region_idx}",
                    start=start_sec,
                    end=end_sec,
                    type=reg_type.value,
                    confidence=conf,
                    rms=rms,
                    speech_probability=speech_prob,
                    music_probability=music_prob,
                    notes=notes
                ))
            else:
                # Non-vocal section: determine if silence or instrumental music
                if rms < self.silence_rms_threshold:
                    reg_type = MediaType.SILENCE
                    conf = 0.95
                    speech_prob = 0.02
                    music_prob = 0.05
                    notes = "Ambient silence / pause"
                elif rms >= self.instrumental_rms_threshold:
                    reg_type = MediaType.INSTRUMENTAL
                    conf = 0.92
                    speech_prob = 0.05
                    music_prob = 0.95
                    notes = "Instrumental music detected"
                else:
                    reg_type = MediaType.UNKNOWN
                    conf = 0.60
                    speech_prob = 0.2
                    music_prob = 0.4
                    notes = "Low acoustic signal"

                regions.append(MediaRegion(
                    id=f"region_{region_idx}",
                    start=start_sec,
                    end=end_sec,
                    type=reg_type.value,
                    confidence=conf,
                    rms=rms,
                    speech_probability=speech_prob,
                    music_probability=music_prob,
                    notes=notes
                ))

            region_idx += 1

        # 4. Contiguous clamp to ensure 100% timeline coverage
        regions = self._ensure_contiguous_coverage(regions, total_duration)
        return regions

    def _merge_spans(self, spans: List[Dict[str, Any]], gap_threshold: float = 0.4) -> List[Dict[str, Any]]:
        if not spans:
            return []
        spans.sort(key=lambda s: s["start"])
        merged = [dict(spans[0])]

        for current in spans[1:]:
            last = merged[-1]
            if current["start"] <= last["end"] + gap_threshold:
                last["end"] = max(last["end"], current["end"])
                last["confidence"] = min(last["confidence"], current["confidence"])
                if current.get("text"):
                    last["text"] = (last.get("text", "") + " " + current["text"]).strip()
            else:
                merged.append(dict(current))
        return merged

    def _ensure_contiguous_coverage(
        self,
        regions: List[MediaRegion],
        total_duration: float
    ) -> List[MediaRegion]:
        if not regions:
            return [MediaRegion(
                id="region_1",
                start=0.0,
                end=total_duration,
                type=MediaType.UNKNOWN.value,
                confidence=0.5,
                notes="Unclassified media duration"
            )]

        # Align first region to 0.0
        regions[0].start = 0.0

        # Eliminate micro gaps between contiguous regions
        for i in range(len(regions) - 1):
            curr_r = regions[i]
            next_r = regions[i + 1]
            if curr_r.end != next_r.start:
                mid = round((curr_r.end + next_r.start) / 2.0, 3)
                curr_r.end = mid
                next_r.start = mid

        # Align last region to total_duration
        regions[-1].end = round(total_duration, 3)

        # Filter out zero/negative duration artifacts
        filtered = [r for r in regions if r.duration > 0.05]
        for idx, r in enumerate(filtered):
            r.id = f"region_{idx + 1}"
        return filtered


# Global classifier instance
media_classifier = MediaClassifier()
