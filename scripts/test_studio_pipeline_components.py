"""
Direct Component Test for Bhasha Setu Video Subtitle & Studio Backend Engine
Validates all pipeline stages, timeline preservation, translation, formatting, and validation.
"""

import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

reconfigure_stdout = getattr(sys.stdout, "reconfigure", None)
if callable(reconfigure_stdout):
    reconfigure_stdout(encoding="utf-8")

from server.video.timeline import preserve_media_timeline, SubtitleCue
from server.video.segmenter import segment_subtitles, wrap_text_to_lines, SubtitleSegmentationConfig
from server.video.translator import translate_subtitle_text
from server.video.validator import validate_subtitles
from server.video.formatters import generate_srt, generate_vtt
from server.video.job_manager import SubtitleJob, JobState


def test_translation_engine():
    print("--- Testing Translation Bridge ---")
    # Tier 1 Phrase Bank
    t1 = translate_subtitle_text("Hello", "eng", "sat")
    assert t1["success"] is True
    assert t1["text"] == "ᱡᱚᱦᱟᱨ"
    assert t1["source"] == "phrase_bank"
    print("✓ Tier 1 Phrase Bank:", t1["text"])

    # Identity
    t2 = translate_subtitle_text("Test", "eng", "eng")
    assert t2["success"] is True
    assert t2["text"] == "Test"
    print("✓ Identity mapping verified")

    # Scope Restriction (Mundari & Ho must be rejected)
    t_unr = translate_subtitle_text("Hello", "eng", "unr")
    assert t_unr["success"] is False
    assert "Phase 2" in t_unr["error"]
    print("✓ Mundari scope rejection verified:", t_unr["error"])

    t_hoc = translate_subtitle_text("Hello", "eng", "hoc")
    assert t_hoc["success"] is False
    assert "Phase 3" in t_hoc["error"]
    print("✓ Ho scope rejection verified:", t_hoc["error"])


def test_timeline_and_segmentation():
    print("\n--- Testing Timeline Preservation & Segmentation ---")
    
    class RawSegment:
        def __init__(self, start, end, text):
            self.start_sec = start
            self.end_sec = end
            self.text = text
            self.speaker = "Speaker 1"
            self.asr_confidence = 0.94

    raw = [
        RawSegment(0.0, 3.2, "Hello and welcome to Bhasha Setu."),
        RawSegment(3.5, 7.0, "This is an automated tribal video subtitling pipeline.")
    ]

    cues = preserve_media_timeline(raw, total_duration_sec=10.0)
    assert len(cues) == 2
    assert cues[0].start_sec == 0.0
    assert cues[0].end_sec == 3.2
    assert cues[1].start_sec == 3.5
    print("✓ Timeline invariance verified. Silence period 3.2s -> 3.5s preserved.")

    # Test Line Wrapping
    long_text = "This is a very long line of text that exceeds forty-two characters and should be neatly wrapped into two lines."
    wrapped = wrap_text_to_lines(long_text, max_chars_per_line=42, max_lines=2)
    lines = wrapped.split("\n")
    assert len(lines) <= 2
    print(f"✓ Wrapped text into {len(lines)} lines: {[len(l) for l in lines]}")


def test_formatters_and_validation():
    print("\n--- Testing Formatters & Quality Validation ---")
    cues = [
        SubtitleCue(
            index=1,
            start_sec=1.5,
            end_sec=4.25,
            source_text="Hello",
            translated_text="ᱡᱚᱦᱟᱨ",
            speaker="Speaker 1",
            confidence=0.95
        )
    ]

    srt = generate_srt(cues)
    assert "00:00:01,500 --> 00:00:04,250" in srt
    assert "ᱡᱚᱦᱟᱨ" in srt
    print("✓ SRT generation with Ol Chiki Unicode verified")

    vtt = generate_vtt(cues)
    assert vtt.startswith("WEBVTT")
    assert "00:00:01.500 --> 00:00:04.250" in vtt
    print("✓ WebVTT generation with Ol Chiki Unicode verified")

    val = validate_subtitles(cues, total_duration_sec=5.0)
    assert val["valid"] is True
    assert len(val["fatal_errors"]) == 0
    print("✓ Quality validation passed with 0 fatal errors")


def test_job_manager_dict():
    print("\n--- Testing Job Manager to_dict Full Cues ---")
    job = SubtitleJob(
        job_id="test-123",
        video_path="fake.mp4",
        original_filename="fake.mp4",
        source_lang="eng",
        target_lang="sat"
    )
    job.cues = [{"index": i, "text": f"Cue {i}"} for i in range(75)]
    d = job.to_dict()
    assert len(d["preview_segments"]) == 75, f"Expected 75 cues, got {len(d['preview_segments'])}"
    print(f"✓ to_dict returns all {len(d['preview_segments'])} cues without truncation")


if __name__ == "__main__":
    test_translation_engine()
    test_timeline_and_segmentation()
    test_formatters_and_validation()
    test_job_manager_dict()
    print("\n========================================")
    print("ALL BACKEND COMPONENT TESTS PASSED!")
    print("========================================")
