"""
FFmpeg Utilities for Bhasha Setu Video Subtitling
Uses imageio-ffmpeg bundled binary for zero-configuration, platform-independent execution.
"""

import os
import subprocess
import json
import soundfile as sf
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import imageio_ffmpeg


def get_ffmpeg_binary() -> str:
    """
    Returns absolute path to the bundled FFmpeg binary.
    Raises RuntimeError if binary cannot be resolved.
    """
    try:
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if not exe or not os.path.exists(exe):
            raise FileNotFoundError(f"FFmpeg binary path invalid: {exe}")
        return exe
    except Exception as e:
        raise RuntimeError(f"Failed to locate FFmpeg executable via imageio-ffmpeg: {e}")


def probe_media(video_path: str) -> Dict[str, Any]:
    """
    Probes video file using ffmpeg to inspect container, video, and audio streams.
    Returns dictionary with stream metadata.
    """
    if not os.path.isfile(video_path):
        raise FileNotFoundError(f"Video file does not exist: {video_path}")
    if os.path.getsize(video_path) == 0:
        raise ValueError(f"Video file is empty: {video_path}")

    ffmpeg_exe = get_ffmpeg_binary()

    # Run ffmpeg -i <file> and parse stderr for streams and duration
    cmd = [ffmpeg_exe, "-i", video_path]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="replace")
    stderr = res.stderr

    has_video = "Video:" in stderr
    has_audio = "Audio:" in stderr

    # Parse duration: "Duration: 00:01:23.45,"
    duration_sec = 0.0
    for line in stderr.splitlines():
        line_clean = line.strip()
        if "Duration:" in line_clean:
            try:
                part = line_clean.split("Duration:")[1].split(",")[0].strip()
                # part format HH:MM:SS.ss
                h, m, s = part.split(":")
                duration_sec = float(h) * 3600 + float(m) * 60 + float(s)
            except Exception:
                duration_sec = 0.0
            break

    return {
        "file_path": video_path,
        "file_size_bytes": os.path.getsize(video_path),
        "duration_sec": round(duration_sec, 3),
        "has_video": has_video,
        "has_audio": has_audio,
        "raw_info": stderr[:1000]
    }


def extract_audio_to_wav(
    video_path: str,
    output_wav_path: Optional[str] = None,
    target_sr: int = 16000
) -> Tuple[str, float]:
    """
    Extracts audio from video to 16 kHz, mono, 16-bit PCM WAV.
    
    Validations:
    - Input video exists and is non-empty.
    - Input video contains an audio stream.
    - Extraction executes without error.
    - Output WAV exists and has expected 16 kHz sample rate and 1 channel.

    Returns:
        (output_wav_path, duration_seconds)
    """
    # 1. Probe input
    info = probe_media(video_path)
    if not info["has_audio"]:
        raise ValueError("The provided video file does not contain an audio track.")

    # 2. Setup output path
    if not output_wav_path:
        out_dir = Path(video_path).parent
        output_wav_path = str(out_dir / f"{Path(video_path).stem}_extracted.wav")

    # Ensure parent dir exists
    Path(output_wav_path).parent.mkdir(parents=True, exist_ok=True)

    ffmpeg_exe = get_ffmpeg_binary()

    # 3. Execute FFmpeg extraction
    # -vn: disable video
    # -acodec pcm_s16le: 16-bit PCM
    # -ar 16000: 16kHz
    # -ac 1: mono
    cmd = [
        ffmpeg_exe,
        "-y",
        "-i", video_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", str(target_sr),
        "-ac", "1",
        output_wav_path
    ]

    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="replace")
    if res.returncode != 0 or not os.path.exists(output_wav_path):
        raise RuntimeError(f"FFmpeg audio extraction failed (code {res.returncode}): {res.stderr[-500:]}")

    if os.path.getsize(output_wav_path) == 0:
        raise RuntimeError("FFmpeg generated an empty audio file.")

    # 4. Strict audio validation with soundfile
    try:
        data, sr = sf.read(output_wav_path)
    except Exception as e:
        raise RuntimeError(f"Failed to read extracted WAV with soundfile: {e}")

    if sr != target_sr:
        raise ValueError(f"Extracted audio sample rate {sr} does not match target {target_sr}")

    channels = 1 if len(data.shape) == 1 else data.shape[1]
    if channels != 1:
        raise ValueError(f"Extracted audio has {channels} channels, expected 1 (mono)")

    duration_sec = len(data) / float(sr)
    if duration_sec <= 0.05:
        raise ValueError("Extracted audio track is virtually empty or shorter than 50ms.")

    return output_wav_path, round(duration_sec, 3)
