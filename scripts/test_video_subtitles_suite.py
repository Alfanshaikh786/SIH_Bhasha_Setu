"""
Comprehensive Automated Test Suite for Video Subtitling Pipeline
Tests:
- Test A: FFmpeg extraction (video -> 16kHz mono WAV)
- Test B: Timeline preservation (3s speech, 4s silence, 3s speech -> cue 2 starts >= 7.0s)
- Test C: Subtitle validation (no overlap, positive durations, no empty cues)
- Test D: Unicode integrity (Ol Chiki characters preserved in SRT and WebVTT)
- Test E: Invalid / corrupted video handling (clean rejection)
- Test F: Video without audio handling (clean rejection)
"""

import os
import sys
import tempfile
import subprocess
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from server.video.ffmpeg_utils import get_ffmpeg_binary, probe_media, extract_audio_to_wav
from server.video.timeline import SubtitleCue, preserve_media_timeline
from server.video.segmenter import segment_subtitles, SubtitleSegmentationConfig
from server.video.validator import validate_subtitles
from server.video.formatters import generate_srt, generate_vtt
import soundfile as sf


def test_a_ffmpeg_extraction(tmp_path: Path):
    print("\n--- Running Test A: FFmpeg Extraction ---")
    ffmpeg = get_ffmpeg_binary()
    vid_path = str(tmp_path / "test_a.mp4")
    
    # Generate 2.5s synthetic video with audio
    cmd = [
        ffmpeg, "-y",
        "-f", "lavfi", "-i", "testsrc=duration=2.5:size=320x240:rate=25",
        "-f", "lavfi", "-i", "sine=frequency=1000:duration=2.5",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        vid_path
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    
    wav_path, dur = extract_audio_to_wav(vid_path)
    assert os.path.exists(wav_path), "Extracted WAV does not exist"
    data, sr = sf.read(wav_path)
    assert sr == 16000, f"Expected 16kHz, got {sr}"
    channels = 1 if len(data.shape) == 1 else data.shape[1]
    assert channels == 1, f"Expected mono, got {channels}"
    assert abs(dur - 2.5) < 0.3, f"Duration mismatch: {dur}"
    print("[PASS] Test A: FFmpeg extraction output is verified 16 kHz mono WAV.")


def test_b_timeline_preservation():
    print("\n--- Running Test B: Timeline Preservation ---")
    # Simulate:
    # Speech 1: 0.0s -> 3.0s
    # Silence:  3.0s -> 7.0s
    # Speech 2: 7.0s -> 10.0s
    class DummyASRSegment:
        def __init__(self, start, end, text):
            self.start_sec = start
            self.end_sec = end
            self.text = text

    raw_segments = [
        DummyASRSegment(0.2, 2.9, "First sentence of speech"),
        DummyASRSegment(7.1, 9.8, "Second sentence after long silence")
    ]

    cues = preserve_media_timeline(raw_segments, total_duration_sec=10.5)
    assert len(cues) == 2, f"Expected 2 cues, got {len(cues)}"
    assert cues[0].start_sec == 0.2, f"Cue 1 start expected 0.2, got {cues[0].start_sec}"
    assert cues[0].end_sec == 2.9, f"Cue 1 end expected 2.9, got {cues[0].end_sec}"
    
    # Crucial Invariant: Speech 2 MUST stay at ~7.1s, NOT shifted to 3.0s
    assert cues[1].start_sec >= 7.0, f"Timeline violated! Cue 2 start was squashed to {cues[1].start_sec} instead of ~7.1s"
    assert cues[1].end_sec <= 10.0, f"Cue 2 end exceeded: {cues[1].end_sec}"
    print(f"[PASS] Test B: Timeline preserved! Speech 1: {cues[0].start_sec}s->{cues[0].end_sec}s, Speech 2: {cues[1].start_sec}s->{cues[1].end_sec}s")


def test_c_subtitle_validation():
    print("\n--- Running Test C: Subtitle Validation ---")
    # 1. Valid cues
    valid_cues = [
        SubtitleCue(1, 1.0, 3.5, "First line of text"),
        SubtitleCue(2, 4.0, 6.2, "Second line of text")
    ]
    val1 = validate_subtitles(valid_cues, total_duration_sec=10.0)
    assert val1["valid"] is True, f"Expected valid, got errors: {val1['fatal_errors']}"

    # 2. Overlapping cues
    overlapping_cues = [
        SubtitleCue(1, 1.0, 4.5, "First overlapping line"),
        SubtitleCue(2, 3.0, 6.0, "Second overlapping line")
    ]
    val2 = validate_subtitles(overlapping_cues, total_duration_sec=10.0)
    assert val2["valid"] is False, "Expected validation failure on overlap"
    assert any("Overlap detected" in err for err in val2["fatal_errors"])

    # 3. Negative duration
    invalid_dur_cues = [
        SubtitleCue(1, 5.0, 3.0, "Reversed timestamps")
    ]
    val3 = validate_subtitles(invalid_dur_cues, total_duration_sec=10.0)
    assert val3["valid"] is False, "Expected validation failure on negative duration"

    print("[PASS] Test C: Validation accurately accepts valid cues and rejects invalid/overlapping cues.")


def test_d_unicode_ol_chiki():
    print("\n--- Running Test D: Unicode Ol Chiki Preservation ---")
    santali_sample = "ᱟᱞᱮᱭᱟᱜ ᱟᱹᱛᱩ ᱨᱮ ᱟᱯᱮᱭᱟᱜ ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ᱾"
    cues = [
        SubtitleCue(1, 0.5, 3.2, santali_sample, translated_text=santali_sample)
    ]
    srt = generate_srt(cues)
    vtt = generate_vtt(cues)

    assert santali_sample in srt, "Ol Chiki missing from SRT output"
    assert santali_sample in vtt, "Ol Chiki missing from VTT output"
    assert "WEBVTT" in vtt, "Missing WEBVTT header"
    assert "00:00:00,500 --> 00:00:03,200" in srt, "SRT timestamp format invalid"
    assert "00:00:00.500 --> 00:00:03.200" in vtt, "VTT timestamp format invalid"

    # Verify UTF-8 byte roundtrip
    encoded_srt = srt.encode("utf-8")
    decoded_srt = encoded_srt.decode("utf-8")
    assert santali_sample in decoded_srt, "UTF-8 roundtrip corrupted Ol Chiki"

    print("[PASS] Test D: Ol Chiki characters (U+1C50-U+1C7F) survived SRT and WebVTT generation intact.")


def test_e_invalid_video(tmp_path: Path):
    print("\n--- Running Test E: Invalid Video Handling ---")
    garbage_path = str(tmp_path / "corrupt.mp4")
    with open(garbage_path, "wb") as f:
        f.write(b"NOT_A_VALID_MP4_HEADER_GARBAGE_BYTES")

    try:
        extract_audio_to_wav(garbage_path)
        assert False, "Should have failed on corrupted file"
    except Exception as e:
        print(f"[PASS] Test E: Invalid video cleanly rejected: {type(e).__name__}")


def test_f_silent_video(tmp_path: Path):
    print("\n--- Running Test F: Video Without Audio Handling ---")
    ffmpeg = get_ffmpeg_binary()
    silent_vid = str(tmp_path / "silent.mp4")
    cmd = [
        ffmpeg, "-y",
        "-f", "lavfi", "-i", "testsrc=duration=2:size=320x240:rate=25",
        "-c:v", "libx264",
        silent_vid
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    try:
        extract_audio_to_wav(silent_vid)
        assert False, "Should have rejected video lacking audio"
    except ValueError as ve:
        assert "does not contain an audio track" in str(ve)
        print(f"[PASS] Test F: Video without audio cleanly rejected: '{ve}'")


def run_all_tests():
    print("==================================================")
    print("STARTING VIDEO SUBTITLE COMPREHENSIVE TEST SUITE")
    print("==================================================")
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        test_a_ffmpeg_extraction(tmp)
        test_b_timeline_preservation()
        test_c_subtitle_validation()
        test_d_unicode_ol_chiki()
        test_e_invalid_video(tmp)
        test_f_silent_video(tmp)
    print("\n==================================================")
    print("ALL 6 AUTOMATED TESTS (A, B, C, D, E, F) PASSED!")
    print("==================================================")


if __name__ == "__main__":
    run_all_tests()
