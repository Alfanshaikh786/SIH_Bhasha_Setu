"""
Test script for verifying burned-in video subtitle rendering and ASS formatting.
"""

import os
import sys
import tempfile
import time
from pathlib import Path

# Configure utf-8 stdout for Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from server.video.ffmpeg_utils import (
    get_ffmpeg_binary, 
    generate_ass_subtitles, 
    burn_subtitles_to_video
)
from server.video.job_manager import SubtitleJobManager, BurnJobState
import subprocess


def test_ass_generation():
    print("--- 1. Testing ASS Subtitle Generation ---")
    td = tempfile.mkdtemp()
    ass_path = os.path.join(td, "test.ass")
    cues = [
        {
            "index": 1,
            "start_sec": 0.5,
            "end_sec": 3.0,
            "source_text": "Hello and welcome.",
            "translated_text": "ᱡᱚᱦᱟᱨ ᱟᱨ ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ᱾",
            "romanized_text": "Johar ar sagun daram."
        },
        {
            "index": 2,
            "start_sec": 3.5,
            "end_sec": 6.0,
            "source_text": "Education is important.",
            "translated_text": "ᱚᱞ ᱯᱟᱲᱦᱟᱣ ᱫᱚ ᱟᱹᱰᱤ ᱡᱟᱹᱨᱩᱲ ᱠᱟᱱᱟ᱾",
            "romanized_text": "Ol padhaw do adi jarud kana."
        }
    ]

    # Test bilingual native + original mode
    generate_ass_subtitles(
        cues=cues,
        output_ass_path=ass_path,
        style_opts={
            "fontFamily": "ol_chiki",
            "fontSize": "large",
            "fontWeight": "bold",
            "background": "semi_transparent",
            "position": "bottom",
            "alignment": "center"
        },
        subtitle_mode="native_original"
    )

    assert os.path.exists(ass_path), "ASS file was not created"
    with open(ass_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "[Script Info]" in content
    assert "Style: StudioStyle" in content
    assert "ᱡᱚᱦᱟᱨ ᱟᱨ ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ᱾\\NHello and welcome." in content
    print("✓ ASS subtitle generation with Ol Chiki and bilingual mode verified.")


def test_ffmpeg_video_burn():
    print("\n--- 2. Testing FFmpeg Burned-in Video Rendering ---")
    exe = get_ffmpeg_binary()
    td = tempfile.mkdtemp()
    vpath = os.path.join(td, "synthetic_source.mp4")
    outpath = os.path.join(td, "synthetic_burned.mp4")

    # Generate 3-second synthetic video with audio
    cmd = [
        exe, "-y",
        "-f", "lavfi", "-i", "testsrc=duration=3:size=640x360:rate=30",
        "-f", "lavfi", "-i", "sine=frequency=1000:duration=3",
        "-c:v", "libx264", "-c:a", "aac",
        vpath
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    assert os.path.exists(vpath) and os.path.getsize(vpath) > 0

    # Generate test ASS file
    ass_path = os.path.join(td, "burn_test.ass")
    cues = [
        {
            "index": 1,
            "start_sec": 0.2,
            "end_sec": 2.5,
            "source_text": "Welcome to Bhasha Setu",
            "translated_text": "ᱵᱷᱟᱥᱟ ᱥᱮᱛᱩ ᱨᱮ ᱥᱟᱹᱜᱩᱱ ᱫᱟᱨᱟᱢ",
            "romanized_text": "Bhasa Setu re sagun daram"
        }
    ]
    generate_ass_subtitles(
        cues=cues,
        output_ass_path=ass_path,
        style_opts={"fontSize": "medium", "background": "semi_transparent"},
        subtitle_mode="native"
    )

    # Burn subtitles into video
    stages = []
    def progress_cb(stage, msg):
        stages.append(stage)

    burn_subtitles_to_video(vpath, ass_path, outpath, progress_callback=progress_cb)

    assert os.path.exists(outpath), "Burned MP4 was not created"
    assert os.path.getsize(outpath) > 10000, f"Burned MP4 size is suspiciously small: {os.path.getsize(outpath)} bytes"
    assert "ENCODING" in stages
    assert "FINALIZING" in stages
    # Verify original file untouched
    assert os.path.exists(vpath), "Original input video must not be modified or removed"
    print(f"✓ Video burn-in verified! Output size: {os.path.getsize(outpath)} bytes, Stages: {stages}")


def test_job_manager_burn_pipeline():
    print("\n--- 3. Testing Job Manager Background Burn Pipeline ---")
    mgr = SubtitleJobManager(max_workers=1)
    td = tempfile.mkdtemp()
    vpath = os.path.join(td, "source.mp4")
    exe = get_ffmpeg_binary()
    subprocess.run([exe, "-y", "-f", "lavfi", "-i", "testsrc=duration=2:size=320x240:rate=25", "-f", "lavfi", "-i", "sine=frequency=800:duration=2", "-c:v", "libx264", "-c:a", "aac", vpath], check=True, capture_output=True)

    cues = [{"index": 1, "start_sec": 0.1, "end_sec": 1.8, "translated_text": "ᱡᱚᱦᱟᱨ"}]
    job = mgr.create_burn_job(
        video_path=vpath,
        original_filename="source.mp4",
        cues=cues,
        style_opts={"fontSize": "small"}
    )

    assert job.status in [BurnJobState.QUEUED, BurnJobState.PREPARING, BurnJobState.GENERATING_SUBTITLES, BurnJobState.ENCODING]

    # Wait for completion (max 15s)
    start = time.time()
    while job.status not in [BurnJobState.COMPLETED, BurnJobState.FAILED] and time.time() - start < 15:
        time.sleep(0.3)

    assert job.status == BurnJobState.COMPLETED, f"Burn job failed: {job.error}"
    assert job.output_video_path and os.path.exists(job.output_video_path)
    print(f"✓ Job Manager burn pipeline successfully completed in {round(time.time() - start, 2)}s.")


if __name__ == "__main__":
    test_ass_generation()
    test_ffmpeg_video_burn()
    test_job_manager_burn_pipeline()
    print("\n========================================")
    print("ALL VIDEO BURN TESTS PASSED CLEANLY!")
    print("========================================")
