"""
Real End-to-End Smoke Test for Bhasha Setu Video Subtitling Pipeline
Submits a real video to the live backend server, polls the actual pipeline stages,
and validates the resulting SRT and WebVTT subtitle outputs.
"""

import os
import sys
import time
import json
import urllib.request
import urllib.error
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


import tempfile
import subprocess
from server.video.ffmpeg_utils import get_ffmpeg_binary

API_BASE = "http://127.0.0.1:5000/api/video"
DEFAULT_VIDEO_PATH = Path(__file__).resolve().parent.parent / "real_smoke_test.mp4"


def ensure_smoke_test_video(target_path: Path) -> Path:
    """
    Ensures a valid test video exists. If missing, automatically generates
    a short test video with spoken speech using bundled FFmpeg and PowerShell TTS.
    """
    if target_path.exists() and target_path.stat().st_size > 0:
        return target_path

    print(f"Smoke test video not found at {target_path}. Generating self-contained test video...")
    ffmpeg = get_ffmpeg_binary()
    temp_dir = Path(tempfile.mkdtemp(prefix="smoke_test_gen_"))
    speech_wav = temp_dir / "tts_speech.wav"

    tts_ok = False
    ps_script = Path(__file__).resolve().parent / "generate_tts_wav.ps1"
    if sys.platform == "win32" and ps_script.exists():
        try:
            cmd_ps = [
                "powershell.exe", "-ExecutionPolicy", "Bypass",
                "-File", str(ps_script),
                str(speech_wav),
                "Hello and welcome to Bhasha Setu."
            ]
            subprocess.run(cmd_ps, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            if speech_wav.exists() and speech_wav.stat().st_size > 0:
                tts_ok = True
        except Exception as e:
            print(f"Notice: PowerShell TTS generation note: {e}")

    if tts_ok:
        cmd = [
            ffmpeg, "-y",
            "-f", "lavfi", "-i", "testsrc=duration=3.5:size=640x360:rate=25",
            "-i", str(speech_wav),
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-shortest",
            str(target_path)
        ]
    else:
        cmd = [
            ffmpeg, "-y",
            "-f", "lavfi", "-i", "testsrc=duration=3:size=640x360:rate=25",
            "-f", "lavfi", "-i", "sine=frequency=440:duration=3",
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            str(target_path)
        ]

    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    print(f"Generated test video: {target_path} ({round(target_path.stat().st_size / 1024, 1)} KB)")
    return target_path


def post_multipart_video(url: str, file_path: Path, source_lang: str = "auto", target_lang: str = "sat"):
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = bytearray()

    def add_field(name, val):
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("utf-8"))
        body.extend(f"{val}\r\n".encode("utf-8"))

    add_field("source_lang", source_lang)
    add_field("target_lang", target_lang)

    # File field
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(f'Content-Disposition: form-data; name="file"; filename="{file_path.name}"\r\n'.encode("utf-8"))
    body.extend(b"Content-Type: video/mp4\r\n\r\n")
    with open(file_path, "rb") as f:
        body.extend(f.read())
    body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode("utf-8"))

    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=30.0) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get_json(url: str):
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req, timeout=10.0) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get_text(url: str):
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req, timeout=10.0) as resp:
        return resp.read().decode("utf-8")


def run_smoke_test():
    print("==================================================")
    print("RUNNING END-TO-END VIDEO SUBTITLING SMOKE TEST")
    print("==================================================")
    video_file = ensure_smoke_test_video(DEFAULT_VIDEO_PATH)
    video_size_mb = video_file.stat().st_size / (1024 * 1024)
    print(f"Input video: {video_file.name} ({round(video_size_mb, 2)} MB)")

    try:
        # Step 1: Submit Job
        print("\n--- 1. Submitting video to POST /api/video/subtitle-job ---")
        t0 = time.time()
        submit_res = post_multipart_video(f"{API_BASE}/subtitle-job", video_file, source_lang="auto", target_lang="sat")
        job_id = submit_res["job_id"]
        print(f"Job Created! job_id={job_id}, initial_status={submit_res['status']}")

        # Step 2: Poll status
        print("\n--- 2. Polling job status through stages ---")
        stages_seen = set()
        final_job = None
        poll_count = 0

        while poll_count < 60:
            time.sleep(1.0)
            poll_count += 1
            job_data = get_json(f"{API_BASE}/subtitle-job/{job_id}")
            st = job_data["status"]
            stage_desc = job_data["current_stage"]
            prog = job_data["progress"]

            if st not in stages_seen:
                stages_seen.add(st)
                print(f"  Stage: {st} ({prog}%) -> {stage_desc}")

            if st in ["COMPLETED", "FAILED"]:
                final_job = job_data
                break

        total_time = round(time.time() - t0, 2)
        print(f"\nPipeline finished in {total_time}s with status: {final_job['status']}")

        if final_job["status"] == "FAILED":
            print(f"ERROR: Pipeline failed: {final_job.get('error')}")
            sys.exit(1)

        # Step 3: Inspect results
        print("\n--- 3. Verifying Subtitle Generation Results ---")
        print(f"Detected Language: {final_job.get('detected_language')}")
        print(f"Video Duration: {final_job.get('video_duration_sec')}s")
        print(f"Transcript Text: '{final_job.get('transcript_text')}'")
        print(f"Subtitle Cues Count: {final_job.get('subtitle_count')}")

        assert final_job["subtitle_count"] > 0, "No subtitle cues were generated!"
        assert final_job["transcript_text"], "Transcript text is empty!"

        # Step 4: Download and verify SRT
        print("\n--- 4. Verifying SubRip (.srt) Output ---")
        srt_text = get_text(f"{API_BASE}/subtitles/{job_id}.srt")
        print("SRT Excerpt:\n" + "-"*40)
        print(srt_text[:400].strip())
        print("-" * 40)
        assert "-->" in srt_text, "SRT missing timecode delimiter '-->'"
        assert "1" in srt_text.splitlines()[0], "SRT first index missing"

        # Step 5: Download and verify VTT
        print("\n--- 5. Verifying WebVTT (.vtt) Output ---")
        vtt_text = get_text(f"{API_BASE}/subtitles/{job_id}.vtt")
        print("VTT Excerpt:\n" + "-"*40)
        print(vtt_text[:400].strip())
        print("-" * 40)
        assert vtt_text.startswith("WEBVTT"), "VTT does not start with WEBVTT header"
        assert "-->" in vtt_text, "VTT missing timecode delimiter '-->'"

        # Step 6: Validate Quality Validation Report
        val_res = final_job.get("validation", {})
        print(f"\nValidation Report: valid={val_res.get('valid')}, fatal_errors={val_res.get('fatal_errors')}, warnings={val_res.get('warnings')}")
        assert val_res.get("valid") is True, f"Validation fatal errors: {val_res.get('fatal_errors')}"

        print("\n==================================================")
        print("✓ REAL VIDEO SMOKE TEST COMPLETED SUCCESSFULLY!")
        print("==================================================")
    finally:
        if DEFAULT_VIDEO_PATH.exists():
            try:
                os.remove(DEFAULT_VIDEO_PATH)
            except Exception:
                pass


if __name__ == "__main__":
    run_smoke_test()
