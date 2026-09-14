"""
Automated Test Suite for Phase 4A Production Safety Hardening
Tests:
1. Automatic Temporary Burn Directory Cleanup (TTL, Active Job Protection, Unrelated Directory Protection)
2. Deterministic ASS Subtitle Text Sanitization (Normal, Curly Braces, Nested, Ol Chiki, Bilingual, Romanized, FFmpeg Burn-In)
"""

import os
import sys
import time
import shutil
import tempfile
import subprocess
from pathlib import Path

# Configure utf-8 stdout/stderr for Windows without triggering Pylance TextIO attribute errors
if sys.platform == "win32":
    for stream in (sys.stdout, sys.stderr):
        reconfig = getattr(stream, "reconfigure", None)
        if callable(reconfig):
            try:
                reconfig(encoding="utf-8")
            except Exception:
                pass

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

venv_python = PROJECT_ROOT / ".venv" / "Scripts" / "python.exe"
if venv_python.exists() and sys.executable.lower() != str(venv_python).lower():
    if os.environ.get("BHASHA_VENV_WRAPPED") != "1":
        env = os.environ.copy()
        env["BHASHA_VENV_WRAPPED"] = "1"
        try:
            res = subprocess.run([str(venv_python)] + sys.argv, env=env)
            sys.exit(res.returncode)
        except Exception:
            pass

venv_site_packages = PROJECT_ROOT / ".venv" / "Lib" / "site-packages"
if venv_site_packages.exists() and str(venv_site_packages) not in sys.path:
    sys.path.insert(0, str(venv_site_packages))

from server.video.ffmpeg_utils import (
    get_ffmpeg_binary,
    probe_media,
    sanitize_ass_text,
    generate_ass_subtitles,
    burn_subtitles_to_video
)
from server.video.job_manager import (
    SubtitleJobManager,
    BurnJobState,
    BurnVideoJob
)


def test_ass_sanitization():
    print("==================================================")
    print("RUNNING ASS SUBTITLE TEXT SANITIZATION TESTS")
    print("==================================================")

    # 1. Normal Subtitle
    t1 = sanitize_ass_text("Hello world")
    assert t1 == "Hello world", f"Failed on normal subtitle: {t1}"
    print("✓ 1. Normal subtitle: 'Hello world' preserved")

    # 2. Curly Braces
    t2 = sanitize_ass_text("Value {test}")
    assert t2 == "Value \uff5btest\uff5d", f"Failed on curly braces: {t2}"
    assert "{" not in t2 and "}" not in t2, "Raw curly brace leaked into sanitized output"
    print(f"✓ 2. Curly braces: 'Value {{test}}' -> '{t2}' (full-width brackets)")

    # 3. Nested Braces
    t3 = sanitize_ass_text("{hello {world}}")
    assert t3 == "\uff5bhello \uff5bworld\uff5d\uff5d", f"Failed on nested braces: {t3}"
    print(f"✓ 3. Nested braces: '{{hello {{world}}}}' -> '{t3}'")

    # 4. Ol Chiki with Braces
    ol_text = "ᱡᱚᱦᱟᱨ {ᱥᱟᱹᱜᱩᱱ} ᱫᱟᱨᱟᱢ"
    t4 = sanitize_ass_text(ol_text)
    assert t4 == "ᱡᱚᱦᱟᱨ \uff5bᱥᱟᱹᱜᱩᱱ\uff5d ᱫᱟᱨᱟᱢ", f"Failed on Ol Chiki with braces: {t4}"
    # Verify Ol Chiki Unicode points are 100% preserved
    assert "ᱡᱚᱦᱟᱨ" in t4 and "ᱫᱟᱨᱟᱢ" in t4
    print(f"✓ 4. Ol Chiki text containing braces: '{t4}' (Ol Chiki Unicode preserved)")

    # 5. Bilingual Subtitle with Braces
    td = tempfile.mkdtemp(prefix="test_ass_")
    ass_path = os.path.join(td, "bilingual.ass")
    cues_bilingual = [{
        "index": 1,
        "start_sec": 0.0,
        "end_sec": 2.5,
        "source_text": "Section {A} intro",
        "translated_text": "ᱦᱟᱹᱴᱤᱧ {A} ᱮᱛᱚᱦᱚᱵ",
        "romanized_text": "Hatinj {A} etohob"
    }]
    generate_ass_subtitles(
        cues=cues_bilingual,
        output_ass_path=ass_path,
        subtitle_mode="original_native"
    )
    with open(ass_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Verify no raw ASCII { or } exist in Dialogue event lines
    for line in content.splitlines():
        if line.startswith("Dialogue:"):
            # The only { allowed in an ASS file are style overrides if intentionally added; our sanitization converts all cue braces
            dialogue_text = line.split(",,", 1)[-1]
            assert "{" not in dialogue_text and "}" not in dialogue_text, f"Raw brace found in dialogue text: {dialogue_text}"
            assert "\uff5bA\uff5d" in dialogue_text, f"Fullwidth brace missing in dialogue: {dialogue_text}"
            assert "\\N" in dialogue_text, "Bilingual newline separator missing"
    print("✓ 5. Bilingual subtitle containing braces in source & target correctly sanitized")

    # 6. Romanized Subtitle with Braces
    ass_path_rom = os.path.join(td, "romanized.ass")
    generate_ass_subtitles(
        cues=cues_bilingual,
        output_ass_path=ass_path_rom,
        subtitle_mode="romanized"
    )
    with open(ass_path_rom, "r", encoding="utf-8") as f:
        content_rom = f.read()
    for line in content_rom.splitlines():
        if line.startswith("Dialogue:"):
            dialogue_text = line.split(",,", 1)[-1]
            assert "{" not in dialogue_text and "}" not in dialogue_text
            assert "Hatinj \uff5bA\uff5d etohob" in dialogue_text
    print("✓ 6. Romanized subtitle containing braces verified")

    # 7. Live FFmpeg libass Burn-in with Braces
    ffmpeg_exe = get_ffmpeg_binary()
    vpath = os.path.join(td, "source.mp4")
    cmd_gen = [
        ffmpeg_exe, "-y",
        "-f", "lavfi", "-i", "testsrc=duration=2:size=640x360:rate=25",
        "-f", "lavfi", "-i", "sine=frequency=1000:duration=2",
        "-c:v", "libx264", "-c:a", "aac",
        vpath
    ]
    subprocess.run(cmd_gen, check=True, capture_output=True)

    out_mp4 = os.path.join(td, "burned_braces.mp4")
    burn_subtitles_to_video(vpath, ass_path, out_mp4)

    # Probe the output MP4
    info = probe_media(out_mp4)
    assert info["has_video"] and info["has_audio"], "Burned MP4 missing video/audio streams"
    assert info["duration_sec"] >= 1.9, "Burned MP4 truncated"
    print("✓ 7. Live FFmpeg MP4 burn-in with braces rendered and validated successfully")

    shutil.rmtree(td, ignore_errors=True)
    print("All ASS sanitization tests passed cleanly!\n")


def test_temp_cleanup():
    print("==================================================")
    print("RUNNING TEMPORARY BURN DIRECTORY CLEANUP TESTS")
    print("==================================================")

    base_temp = tempfile.gettempdir()
    manager = SubtitleJobManager(max_workers=1)

    # 1. Create an "expired" directory (> 2 hours old)
    expired_dir = os.path.join(base_temp, f"bhasha_burn_test_expired_{int(time.time())}")
    os.makedirs(expired_dir, exist_ok=True)
    test_file1 = os.path.join(expired_dir, "old_subtitled.mp4")
    with open(test_file1, "w") as f:
        f.write("test_video_data")

    # Backdate mtime & atime by 3 hours (10800 seconds)
    three_hours_ago = time.time() - 10800
    os.utime(expired_dir, (three_hours_ago, three_hours_ago))

    # 2. Create a "recent" directory (< 2 hours old, e.g. 5 minutes old)
    recent_dir = os.path.join(base_temp, f"bhasha_burn_test_recent_{int(time.time())}")
    os.makedirs(recent_dir, exist_ok=True)
    test_file2 = os.path.join(recent_dir, "recent_subtitled.mp4")
    with open(test_file2, "w") as f:
        f.write("recent_video_data")

    # 3. Create an "active job" directory (even if backdated, it must NOT be deleted)
    active_dir = os.path.join(base_temp, f"bhasha_burn_test_active_{int(time.time())}")
    os.makedirs(active_dir, exist_ok=True)
    os.utime(active_dir, (three_hours_ago, three_hours_ago))

    active_job = BurnVideoJob(
        burn_job_id="test_active_job_uuid_12345",
        video_path="dummy.mp4",
        original_filename="dummy.mp4",
        cues=[{"index": 1, "start_sec": 0, "end_sec": 1, "source_text": "hi"}]
    )
    active_job.status = BurnJobState.ENCODING
    active_job.temp_dir = active_dir
    with manager._lock:
        manager._burn_jobs[active_job.burn_job_id] = active_job

    # 4. Create an "unrelated" directory (must NEVER be touched)
    unrelated_dir = os.path.join(base_temp, f"other_app_temp_{int(time.time())}")
    os.makedirs(unrelated_dir, exist_ok=True)
    os.utime(unrelated_dir, (three_hours_ago, three_hours_ago))

    # Run cleanup with default TTL (7200s = 2h)
    cleaned = manager.cleanup_expired_burn_directories(ttl_seconds=7200.0)

    # Invariant checks
    assert not os.path.exists(expired_dir), "Expired burn directory was NOT cleaned"
    print(f"✓ 1. Expired burn directory (>2h) cleaned successfully (total cleaned in run: {cleaned})")

    assert os.path.exists(recent_dir), "Recent burn directory was erroneously cleaned"
    print("✓ 2. Recent burn directory (<2h) safely preserved")

    assert os.path.exists(active_dir), "Active job burn directory was erroneously cleaned"
    print("✓ 3. Active job burn directory strictly protected from deletion")

    assert os.path.exists(unrelated_dir), "Unrelated temporary directory was erroneously cleaned"
    print("✓ 4. Unrelated temporary directory strictly untouched")

    # 5. Safe handling of already-deleted directory
    try:
        cleaned_second = manager.cleanup_expired_burn_directories(ttl_seconds=7200.0)
        print("✓ 5. Re-running cleanup handles missing directories gracefully with 0 exceptions")
    except Exception as e:
        assert False, f"Cleanup threw unexpected exception on missing directories: {e}"

    # Cleanup test scaffolding
    shutil.rmtree(recent_dir, ignore_errors=True)
    shutil.rmtree(active_dir, ignore_errors=True)
    shutil.rmtree(unrelated_dir, ignore_errors=True)
    print("All temporary burn directory cleanup tests passed cleanly!\n")


if __name__ == "__main__":
    test_ass_sanitization()
    test_temp_cleanup()
    print("==================================================")
    print("🎉 ALL PHASE 4A PRODUCTION SAFETY TESTS PASSED!")
    print("==================================================")
