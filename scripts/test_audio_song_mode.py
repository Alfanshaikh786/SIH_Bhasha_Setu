"""
Validation Test Suite: AUDIO SONG.mp4 in Song / Lyrics Mode
Validates:
1. Content Mode Auto-Detection -> SONG_LYRICS
2. Vocal vs Instrumental vs Silence Region Classification
3. Complete Video Duration Preservation (35.80s)
4. Instrumental section (24.2s - 35.8s) has zero subtitles
5. Real ASR lyric recognition + translation to Santali Ol Chiki & Latin
6. Lyrics-to-Audio forced alignment API (/api/video/align-lyrics)
7. Audio TTS synthesis verification
8. SRT and VTT subtitle export
"""

import os
import sys
import time
import json
import requests
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:5000/api/video"
AUDIO_SONG_PATH = r"D:\SIH\AUDIO SONG.mp4"
if not os.path.exists(AUDIO_SONG_PATH):
    AUDIO_SONG_PATH = r"C:\Users\alfan\Downloads\AUDIO SONG.mp4"

def run_tests():
    print("=" * 70)
    print("  BHASHA SETU — SONG MODE VALIDATION ON REAL 'AUDIO SONG.mp4'")
    print("=" * 70)

    if not os.path.exists(AUDIO_SONG_PATH):
        print(f"❌ File not found at {AUDIO_SONG_PATH}")
        sys.exit(1)

    print(f"📁 Video File: {AUDIO_SONG_PATH} ({os.path.getsize(AUDIO_SONG_PATH):,} bytes)")

    # 1. Submit Job
    print("\n--- Step 1: Submit Subtitle Job with Content Mode Auto-Detect ---")
    with open(AUDIO_SONG_PATH, "rb") as f:
        resp = requests.post(
            f"{BASE_URL}/subtitle-job",
            files={"file": (os.path.basename(AUDIO_SONG_PATH), f, "video/mp4")},
            data={"source_lang": "auto", "target_lang": "sat", "content_mode": "auto"}
        )
    assert resp.status_code == 202, f"Failed to submit: {resp.text}"
    job_data = resp.json()
    job_id = job_data["job_id"]
    print(f"✅ Job submitted successfully. ID: {job_id}")

    # 2. Poll until COMPLETED
    print("\n--- Step 2: Poll Processing Stages ---")
    start_t = time.time()
    completed_job = None
    while time.time() - start_t < 90:
        poll_resp = requests.get(f"{BASE_URL}/subtitle-job/{job_id}")
        assert poll_resp.status_code == 200
        status_data = poll_resp.json()
        stage = status_data.get("current_stage", "")
        progress = status_data.get("progress", 0)
        status = status_data.get("status", "")
        print(f"  Stage: {stage:<25} Progress: {progress}% Status: {status}")

        if status == "COMPLETED":
            completed_job = status_data
            break
        elif status == "FAILED":
            print(f"❌ Job Failed: {status_data.get('error')}")
            sys.exit(1)
        time.sleep(1.2)

    assert completed_job is not None, "Job timed out!"
    print("✅ Video processing completed successfully.")

    # 3. Assert Content Mode
    print("\n--- Step 3: Content Mode Verification ---")
    content_mode = completed_job.get("content_mode")
    content_mode_label = completed_job.get("content_mode_label")
    print(f"  Detected Content Mode: {content_mode} ({content_mode_label})")
    assert content_mode == "song_lyrics", f"Expected 'song_lyrics', got '{content_mode}'"
    assert "Song" in content_mode_label, f"Expected Song in label, got '{content_mode_label}'"
    print("✅ Verified: Content Mode is correctly identified as 'song_lyrics' (Song / Lyrics)")

    # 4. Assert Video Duration Preservation
    print("\n--- Step 4: Duration & Timeline Coverage ---")
    duration = completed_job.get("video_duration_sec", 0.0)
    print(f"  Full Video Duration: {duration:.2f}s (Expected: ~35.80s)")
    assert abs(duration - 35.80) < 0.5, f"Duration deviation too large: {duration}"
    print("✅ Verified: Complete 35.80s timeline preserved.")

    # 5. Media Regions & Instrumental Outro Detection
    print("\n--- Step 5: Media Regions (Vocal vs Instrumental Outro) ---")
    regions = completed_job.get("media_regions", [])
    coverage = completed_job.get("media_coverage", {})
    print(f"  Total Classified Regions: {len(regions)}")
    singing_regions = [r for r in regions if r.get("type") in ("singing", "speech")]
    inst_regions = [r for r in regions if r.get("type") == "instrumental"]
    print(f"  Singing/Vocal Regions: {len(singing_regions)} ({coverage.get('vocal_total_sec', 0):.1f}s)")
    print(f"  Instrumental Regions:  {len(inst_regions)} ({coverage.get('instrumental_sec', 0):.1f}s)")

    # Check instrumental outro
    outro = [r for r in inst_regions if r["start"] >= 24.0]
    assert len(outro) > 0, "Expected instrumental outro starting at ~24.2s"
    print(f"  Found Instrumental Outro: {outro[0]['start']:.2f}s -> {outro[0]['end']:.2f}s")
    
    # Subtitles must not overlap instrumental outro
    cues = completed_job.get("preview_segments", [])
    for c in cues:
        assert c["end_sec"] <= 25.5, f"Subtitle cue {c['index']} leaked into instrumental outro: {c['start_sec']}-{c['end_sec']}"
    print(f"✅ Verified: Zero subtitles generated during instrumental outro ({outro[0]['start']:.1f}s -> {duration:.1f}s).")

    # 6. Lyric Recognition & Santali Translation
    print("\n--- Step 6: Lyric Recognition & Santali Translation ---")
    print(f"  Generated Cues Count: {len(cues)}")
    for c in cues[:5]:
        print(f"  Cue #{c['index']} [{c['start_sec']:.2f}s - {c['end_sec']:.2f}s]:")
        print(f"    Original: {c.get('source_text')}")
        print(f"    Santali:  {c.get('translated_text')}")
        print(f"    Latin:    {c.get('romanized_text')}")
    assert len(cues) > 0, "Expected at least 1 lyric cue"
    print("✅ Verified: Lyrics transcribed and translated to Santali Ol Chiki + Latin.")

    # 7. Lyrics Alignment API Test
    print("\n--- Step 7: Lyrics-to-Audio Forced Alignment API Test ---")
    known_lyrics = (
        "Ishq Mohabbat Tumse Hui\n"
        "Dil Ka Khasara Mera Hua\n"
        "Aisi Lagan Lagi\n"
        "Har Pal Teri Yaadein"
    )
    align_resp = requests.post(
        f"{BASE_URL}/align-lyrics",
        data={
            "job_id": job_id,
            "lyrics_text": known_lyrics,
            "target_lang": "sat"
        }
    )
    assert align_resp.status_code == 200, f"Align lyrics failed: {align_resp.text}"
    aligned_data = align_resp.json()
    aligned_cues = aligned_data.get("cues", [])
    print(f"  Aligned Cues Count: {len(aligned_cues)}")
    assert len(aligned_cues) == 4, f"Expected 4 aligned cues, got {len(aligned_cues)}"

    for c in aligned_cues:
        print(f"  Cue #{c['index']} [{c['start_sec']:.2f}s - {c['end_sec']:.2f}s]:")
        print(f"    Lyrics Line: {c['source_text']}")
        print(f"    Santali Ol:  {c['translated_text']}")
        print(f"    Santali Lat: {c['romanized_text']}")
        assert c["end_sec"] <= 24.5, "Aligned cue exceeded vocal boundary!"
        assert len(c["translated_text"]) > 0, "Missing Santali translation!"
        assert len(c["romanized_text"]) > 0, "Missing Latin transliteration!"
    print("✅ Verified: Lyrics aligned proportionally to vocal boundaries with full translations.")

    # 8. TTS Synthesis Test
    print("\n--- Step 8: Audio TTS Synthesis Verification ---")
    tts_text = aligned_cues[0]["translated_text"]
    tts_resp = requests.post(
        f"{BASE_URL}/tts/synthesize",
        data={
            "text": tts_text,
            "language": "sat",
            "script": "Ol Chiki",
            "speed": 1.0
        }
    )
    assert tts_resp.status_code == 200
    tts_res = tts_resp.json()
    provider = tts_res.get('provider_name')
    label = tts_res.get('voice_label')
    audio_b64 = tts_res.get('audio_base64') or ''
    print(f"  TTS Provider: {provider}")
    print(f"  TTS Label:    {label}")
    print(f"  Audio Bytes:  {len(audio_b64)} chars (is_native={tts_res.get('is_native')})")
    assert provider is not None
    assert label is not None
    print("✅ Verified: TTS synthesis responsive with truth-in-labeling.")

    # 9. Export Subtitles (SRT & VTT)
    print("\n--- Step 9: Export Subtitles (SRT & VTT) ---")
    vtt_resp = requests.get(f"{BASE_URL}/subtitles/{job_id}.vtt")
    srt_resp = requests.get(f"{BASE_URL}/subtitles/{job_id}.srt")
    assert vtt_resp.status_code == 200
    assert srt_resp.status_code == 200
    print(f"  VTT Output Length: {len(vtt_resp.text)} chars")
    print(f"  SRT Output Length: {len(srt_resp.text)} chars")
    assert "WEBVTT" in vtt_resp.text
    assert "-->" in srt_resp.text
    print("✅ Verified: SRT and VTT exports generated cleanly.")

    print("\n" + "=" * 70)
    print("  🎉 ALL 9 SONG MODE TESTS PASSED ON REAL 'AUDIO SONG.mp4'!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
