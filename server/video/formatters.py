"""
SRT and WebVTT Formatters for Subtitle Generation
Generates compliant, standard subtitle strings with full UTF-8 and Ol Chiki support.
"""

from typing import List, Any
from server.video.timeline import SubtitleCue


def format_seconds_to_srt_time(seconds: float) -> str:
    """
    Converts float seconds into SRT timestamp: HH:MM:SS,mmm
    Example: 63.456 -> 00:01:03,456
    """
    total_ms = int(round(max(0.0, seconds) * 1000))
    hours = total_ms // 3600000
    total_ms %= 3600000
    minutes = total_ms // 60000
    total_ms %= 60000
    secs = total_ms // 1000
    ms = total_ms % 1000
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"


def format_seconds_to_vtt_time(seconds: float) -> str:
    """
    Converts float seconds into WebVTT timestamp: HH:MM:SS.mmm
    Example: 63.456 -> 00:01:03.456
    """
    total_ms = int(round(max(0.0, seconds) * 1000))
    hours = total_ms // 3600000
    total_ms %= 3600000
    minutes = total_ms // 60000
    total_ms %= 60000
    secs = total_ms // 1000
    ms = total_ms % 1000
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{ms:03d}"


def generate_srt(cues: List[Any]) -> str:
    """
    Generates standard SubRip (.srt) subtitle string. Supports SubtitleCue objects or dicts.
    """
    lines = []
    for cue in cues:
        start_sec = getattr(cue, "start_sec", None) if hasattr(cue, "start_sec") else cue.get("start_sec", 0.0)
        end_sec = getattr(cue, "end_sec", None) if hasattr(cue, "end_sec") else cue.get("end_sec", 0.0)
        idx = getattr(cue, "index", None) if hasattr(cue, "index") else cue.get("index", 1)
        trans = getattr(cue, "translated_text", "") if hasattr(cue, "translated_text") else cue.get("translated_text", "")
        src = getattr(cue, "source_text", "") if hasattr(cue, "source_text") else cue.get("source_text", "")
        text = (trans or src).strip()
        if not text:
            continue
        start_ts = format_seconds_to_srt_time(float(start_sec or 0.0))
        end_ts = format_seconds_to_srt_time(float(end_sec or 0.0))

        lines.append(str(idx))
        lines.append(f"{start_ts} --> {end_ts}")
        lines.append(text)
        lines.append("")  # Empty line separator

    return "\n".join(lines).strip() + "\n"


def generate_vtt(cues: List[Any]) -> str:
    """
    Generates standard WebVTT (.vtt) subtitle string. Supports SubtitleCue objects or dicts.
    """
    lines = ["WEBVTT", ""]
    for cue in cues:
        start_sec = getattr(cue, "start_sec", None) if hasattr(cue, "start_sec") else cue.get("start_sec", 0.0)
        end_sec = getattr(cue, "end_sec", None) if hasattr(cue, "end_sec") else cue.get("end_sec", 0.0)
        idx = getattr(cue, "index", None) if hasattr(cue, "index") else cue.get("index", 1)
        trans = getattr(cue, "translated_text", "") if hasattr(cue, "translated_text") else cue.get("translated_text", "")
        src = getattr(cue, "source_text", "") if hasattr(cue, "source_text") else cue.get("source_text", "")
        text = (trans or src).strip()
        if not text:
            continue
        start_ts = format_seconds_to_vtt_time(float(start_sec or 0.0))
        end_ts = format_seconds_to_vtt_time(float(end_sec or 0.0))

        lines.append(str(idx))
        lines.append(f"{start_ts} --> {end_ts}")
        lines.append(text)
        lines.append("")  # Empty line separator

    return "\n".join(lines).strip() + "\n"
