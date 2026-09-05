"""
SRT and WebVTT Formatters for Subtitle Generation
Generates compliant, standard subtitle strings with full UTF-8 and Ol Chiki support.
"""

from typing import List
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


def generate_srt(cues: List[SubtitleCue]) -> str:
    """
    Generates standard SubRip (.srt) subtitle string.
    """
    lines = []
    for cue in cues:
        text = (cue.translated_text or cue.source_text).strip()
        if not text:
            continue
        start_ts = format_seconds_to_srt_time(cue.start_sec)
        end_ts = format_seconds_to_srt_time(cue.end_sec)

        lines.append(str(cue.index))
        lines.append(f"{start_ts} --> {end_ts}")
        lines.append(text)
        lines.append("")  # Empty line separator

    return "\n".join(lines).strip() + "\n"


def generate_vtt(cues: List[SubtitleCue]) -> str:
    """
    Generates standard WebVTT (.vtt) subtitle string.
    """
    lines = ["WEBVTT", ""]
    for cue in cues:
        text = (cue.translated_text or cue.source_text).strip()
        if not text:
            continue
        start_ts = format_seconds_to_vtt_time(cue.start_sec)
        end_ts = format_seconds_to_vtt_time(cue.end_sec)

        lines.append(str(cue.index))
        lines.append(f"{start_ts} --> {end_ts}")
        lines.append(text)
        lines.append("")  # Empty line separator

    return "\n".join(lines).strip() + "\n"
