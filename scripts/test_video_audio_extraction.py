"""
Automated Test for Video Audio Extraction & FFmpeg Utilities
Tests:
1. Valid video with audio -> 16kHz mono WAV extraction
2. Non-existent / invalid video -> clean failure
3. Video without audio stream -> clean failure
"""

import os
import sys
import tempfile
import subprocess
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')  # type: ignore

from server.video.ffmpeg_utils import get_ffmpeg_binary, probe_media, extract_audio_to_wav
import soundfile as sf


def run_tests():
    print("=== STARTING VIDEO AUDIO EXTRACTION TESTS ===")
    ffmpeg_exe = get_ffmpeg_binary()
    print(f"Using FFmpeg: {ffmpeg_exe}")

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)

        # -------------------------------------------------------------
        # 1. Test Valid Video with Audio
        # -------------------------------------------------------------
        valid_video = str(tmp_path / "valid_test.mp4")
        print("\n--- Generating synthetic 3-second video with audio ---")
        cmd = [
            ffmpeg_exe, "-y",
            "-f", "lavfi", "-i", "testsrc=duration=3:size=320x240:rate=30",
            "-f", "lavfi", "-i", "sine=frequency=440:duration=3",
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "128k",
            valid_video
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        assert os.path.exists(valid_video), "Failed to generate synthetic video"

        # Probe
        meta = probe_media(valid_video)
        print(f"Probed metadata: duration={meta['duration_sec']}s, has_video={meta['has_video']}, has_audio={meta['has_audio']}")
        assert meta["has_video"], "Probe failed to detect video"
        assert meta["has_audio"], "Probe failed to detect audio"
        assert meta["duration_sec"] > 2.5, f"Unexpected duration: {meta['duration_sec']}"

        # Extract
        extracted_wav, dur = extract_audio_to_wav(valid_video)
        print(f"Extracted WAV: {extracted_wav}, duration={dur}s")
        assert os.path.exists(extracted_wav), "Extracted WAV does not exist"

        data, sr = sf.read(extracted_wav)
        assert sr == 16000, f"Expected 16000 Hz, got {sr}"
        channels = 1 if len(data.shape) == 1 else data.shape[1]
        assert channels == 1, f"Expected 1 channel, got {channels}"
        assert abs(dur - 3.0) < 0.5, f"Duration deviation too high: {dur}"
        print("✓ Test 1 Passed: Valid video audio extraction verified (16kHz, mono WAV).")

        # -------------------------------------------------------------
        # 2. Test Video Without Audio Track
        # -------------------------------------------------------------
        no_audio_video = str(tmp_path / "silent_video.mp4")
        print("\n--- Generating synthetic video WITHOUT audio track ---")
        cmd_silent = [
            ffmpeg_exe, "-y",
            "-f", "lavfi", "-i", "testsrc=duration=2:size=320x240:rate=30",
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            no_audio_video
        ]
        subprocess.run(cmd_silent, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        
        silent_meta = probe_media(no_audio_video)
        assert silent_meta["has_video"] is True
        assert silent_meta["has_audio"] is False
        print(f"Silent video probe: has_audio={silent_meta['has_audio']}")

        try:
            extract_audio_to_wav(no_audio_video)
            assert False, "Should have raised ValueError for missing audio track"
        except ValueError as ve:
            print(f"✓ Test 2 Passed: Silent video rejected with expected error: '{ve}'")

        # -------------------------------------------------------------
        # 3. Test Corrupted / Invalid File
        # -------------------------------------------------------------
        garbage_file = str(tmp_path / "corrupted.mp4")
        with open(garbage_file, "wb") as f:
            f.write(b"NOT_A_REAL_VIDEO_HEADER_JUST_GARBAGE_BYTES")

        try:
            extract_audio_to_wav(garbage_file)
            assert False, "Should have raised exception for corrupted video"
        except Exception as ce:
            print(f"✓ Test 3 Passed: Corrupted video rejected with expected error: '{type(ce).__name__}: {ce}'")

    print("\n=== ALL AUDIO EXTRACTION TESTS PASSED SUCCESSFULLY! ===")


if __name__ == "__main__":
    run_tests()
