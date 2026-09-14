"""
Media Timeline Coverage Analyzer
Calculates explicit timeline duration breakdowns and distinguishes between:
1. Timeline Coverage (Always 100% of the media file duration)
2. Subtitle Coverage (Duration actively covered by vocal dialogue/lyrics cues)
"""

from typing import List, Dict, Any, Optional
from server.video.media_classifier import MediaRegion, MediaType


class MediaCoverageAnalyzer:
    """
    Computes rigorous coverage statistics over media duration,
    ensuring users never confuse instrumental pauses with video truncation.
    """

    @staticmethod
    def compute_coverage(
        total_duration_sec: float,
        media_regions: List[MediaRegion],
        subtitle_cues: Optional[List[Any]] = None
    ) -> Dict[str, Any]:
        total_duration = round(max(0.0, float(total_duration_sec)), 3)
        if total_duration == 0.0 and media_regions:
            total_duration = round(max(r.end for r in media_regions), 3)

        speech_sec = 0.0
        singing_sec = 0.0
        instrumental_sec = 0.0
        silence_sec = 0.0
        unknown_sec = 0.0

        for r in media_regions:
            dur = r.duration
            t = r.type.lower()
            if t == MediaType.SPEECH.value:
                speech_sec += dur
            elif t == MediaType.SINGING.value:
                singing_sec += dur
            elif t == MediaType.INSTRUMENTAL.value:
                instrumental_sec += dur
            elif t == MediaType.SILENCE.value:
                silence_sec += dur
            else:
                unknown_sec += dur

        vocal_total_sec = round(speech_sec + singing_sec, 3)
        instrumental_sec = round(instrumental_sec, 3)
        silence_sec = round(silence_sec, 3)
        unknown_sec = round(unknown_sec, 3)

        # Compute subtitle coverage from cues
        subtitle_coverage_sec = 0.0
        if subtitle_cues:
            # Union of cue intervals
            cue_intervals = []
            for c in subtitle_cues:
                s = getattr(c, "start_sec", None)
                if s is None and isinstance(c, dict):
                    s = c.get("start_sec", c.get("start"))
                e = getattr(c, "end_sec", None)
                if e is None and isinstance(c, dict):
                    e = c.get("end_sec", c.get("end"))
                if s is not None and e is not None and e > s:
                    cue_intervals.append((float(s), float(e)))

            cue_intervals.sort(key=lambda x: x[0])
            merged_intervals = []
            for start, end in cue_intervals:
                if not merged_intervals:
                    merged_intervals.append([start, end])
                else:
                    prev = merged_intervals[-1]
                    if start <= prev[1]:
                        prev[1] = max(prev[1], end)
                    else:
                        merged_intervals.append([start, end])

            subtitle_coverage_sec = round(sum(end - start for start, end in merged_intervals), 3)
        else:
            subtitle_coverage_sec = vocal_total_sec

        # Timeline coverage is 100% when regions span from 0 to total_duration
        covered_regions_span = sum(r.duration for r in media_regions) if media_regions else 0.0
        timeline_coverage_pct = 100.0 if (total_duration > 0 and covered_regions_span >= (total_duration - 0.2)) else (
            round((covered_regions_span / total_duration) * 100.0, 1) if total_duration > 0 else 100.0
        )

        return {
            "total_duration_sec": total_duration,
            "recognized_speech_sec": round(speech_sec, 3),
            "recognized_singing_sec": round(singing_sec, 3),
            "vocal_total_sec": vocal_total_sec,
            "instrumental_sec": instrumental_sec,
            "silence_sec": silence_sec,
            "unclassified_sec": unknown_sec,
            "subtitle_coverage_sec": subtitle_coverage_sec,
            "subtitle_coverage_pct": round((subtitle_coverage_sec / total_duration) * 100.0, 1) if total_duration > 0 else 0.0,
            "timeline_coverage_pct": timeline_coverage_pct,
            "summary_label": f"{vocal_total_sec}s speech/lyrics, {instrumental_sec}s music ({timeline_coverage_pct}% timeline)"
        }
