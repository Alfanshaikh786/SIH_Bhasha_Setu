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


def format_ass_time(seconds: float) -> str:
    """
    Formats seconds into ASS timestamp format: H:MM:SS.cc
    """
    total_ms = max(0, int(round(seconds * 1000)))
    total_cs = total_ms // 10
    cs = total_cs % 100
    total_sec = total_cs // 100
    s = total_sec % 60
    total_min = total_sec // 60
    m = total_min % 60
    h = total_min // 60
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def sanitize_ass_text(text: Optional[str]) -> str:
    """
    Sanitizes subtitle text for safe inclusion into an ASS (Advanced SubStation Alpha) file:
    1. Converts literal ASCII curly braces '{' and '}' to Unicode full-width equivalents
       '｛' (U+FF5B) and '｝' (U+FF5D). This guarantees libass / FFmpeg never interprets
       them as ASS style override tags, while preserving visual braces on screen.
    2. Normalizes newline characters (\r\n, \n) into standard ASS line breaks ('\\N').
    3. Preserves all authentic Unicode text including Ol Chiki (U+1C50-U+1C7F), Devanagari, and Latin.
    4. Never alters subtitle timing, language tokens, or meaning.
    """
    if not text:
        return ""
    # Convert literal braces to full-width curly brackets
    sanitized = text.replace("{", "\uff5b").replace("}", "\uff5d")
    # Normalize line breaks to ASS \N
    sanitized = sanitized.replace("\r\n", "\\N").replace("\n", "\\N")
    return sanitized


def generate_ass_subtitles(
    cues: List[Dict[str, Any]],
    output_ass_path: str,
    style_opts: Optional[Dict[str, Any]] = None,
    subtitle_mode: str = "native",
    video_width: int = 1280,
    video_height: int = 720
) -> str:
    """
    Generates an Advanced SubStation Alpha (.ass) subtitle file formatted
    according to subtitle style and display mode specifications.
    """
    opts = style_opts or {}
    font_family = opts.get("fontFamily", "default")
    font_size_name = opts.get("fontSize", "medium")
    font_weight = opts.get("fontWeight", "regular")
    alignment_opt = opts.get("alignment", "center")
    position_opt = opts.get("position", "bottom")
    background_opt = opts.get("background", "semi_transparent")
    text_effect = opts.get("textEffect", "outline")

    # Font Mapping
    font_name = "Noto Sans Ol Chiki, Arial, sans-serif"
    if font_family == "serif":
        font_name = "Domine, Times New Roman, serif"
    elif font_family == "sans":
        font_name = "Inter, Arial, sans-serif"
    elif font_family == "ol_chiki":
        font_name = "Noto Sans Ol Chiki, Arial"

    # Font Size (scaled to standard 720p height)
    size_map = {"small": 22, "medium": 28, "large": 36, "xlarge": 44}
    font_size = size_map.get(font_size_name, 28)

    # Font Weight (-1 for true bold in ASS)
    is_bold = -1 if font_weight in ("bold", "medium") else 0

    # Alignment (ASS numpad notation: 1=bot-left, 2=bot-center, 3=bot-right, 5=top-left, 6=top-center, 7=top-right)
    if position_opt == "top":
        align_code = 5 if alignment_opt == "left" else (7 if alignment_opt == "right" else 6)
        margin_v = 30
    elif position_opt == "center":
        align_code = 4 if alignment_opt == "left" else (6 if alignment_opt == "right" else 5)
        margin_v = 30
    else:  # bottom
        align_code = 1 if alignment_opt == "left" else (3 if alignment_opt == "right" else 2)
        margin_v = 35

    # Background & Outline (BorderStyle 1 = Outline+Shadow, 3 = Opaque Box)
    # ASS colors are in &HAABBGGRR format
    primary_color = "&H00FFFFFF"  # White
    if opts.get("preset") == "high_contrast":
        primary_color = "&H0000FFFF"  # Yellow

    if background_opt == "solid":
        border_style = 3  # Opaque background box
        outline_width = 3
        shadow_depth = 0
        back_color = "&H00000000"  # Fully opaque black
    elif background_opt == "semi_transparent":
        border_style = 3  # Opaque background box
        outline_width = 2
        shadow_depth = 0
        back_color = "&H80000000"  # ~50% transparent black
    else:  # none
        border_style = 1  # Text with stroke/shadow
        outline_width = 2 if text_effect == "outline" else (1 if text_effect == "shadow" else 0)
        shadow_depth = 2 if text_effect == "shadow" else 0
        back_color = "&H80000000"

    ass_lines = [
        "[Script Info]",
        "ScriptType: v4.00+",
        f"PlayResX: {video_width}",
        f"PlayResY: {video_height}",
        "ScaledBorderAndShadow: yes",
        "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        f"Style: StudioStyle,{font_name},{font_size},{primary_color},&H000000FF,&H00000000,{back_color},{is_bold},0,0,0,100,100,0,0,{border_style},{outline_width},{shadow_depth},{align_code},30,30,{margin_v},1",
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"
    ]

    for cue in cues:
        start_t = format_ass_time(cue.get("start_sec", 0.0))
        end_t = format_ass_time(cue.get("end_sec", 0.0))

        # Format cue text according to subtitle mode with strict ASS sanitization
        raw_target = cue.get("translated_text", "") or cue.get("text", "")
        raw_source = cue.get("source_text", "")
        raw_roman = cue.get("romanized_text", "")

        target_txt = sanitize_ass_text(raw_target)
        source_txt = sanitize_ass_text(raw_source)
        roman_txt = sanitize_ass_text(raw_roman)

        if subtitle_mode == "original_native" and source_txt and target_txt and source_txt != target_txt:
            full_txt = f"{source_txt}\\N{target_txt}"
        elif subtitle_mode == "native_original" and source_txt and target_txt and source_txt != target_txt:
            full_txt = f"{target_txt}\\N{source_txt}"
        elif subtitle_mode == "original" and source_txt:
            full_txt = source_txt
        elif subtitle_mode == "romanized" and roman_txt:
            full_txt = roman_txt
        elif subtitle_mode == "native_romanized" and roman_txt and target_txt:
            full_txt = f"{target_txt}\\N{roman_txt}"
        else:
            full_txt = target_txt

        ass_lines.append(f"Dialogue: 0,{start_t},{end_t},StudioStyle,,0,0,0,,{full_txt}")

    content = "\n".join(ass_lines) + "\n"
    Path(output_ass_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_ass_path, "w", encoding="utf-8") as f:
        f.write(content)

    return output_ass_path


def burn_subtitles_to_video(
    video_path: str,
    ass_subtitle_path: str,
    output_video_path: str,
    progress_callback: Optional[Any] = None
) -> str:
    """
    Permanently burns subtitles into video using FFmpeg ASS rendering filter.
    Preserves original video resolution, aspect ratio, audio track, and timings.
    Never overwrites the original input file.
    """
    if not os.path.isfile(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")
    if not os.path.isfile(ass_subtitle_path):
        raise FileNotFoundError(f"ASS subtitle file not found: {ass_subtitle_path}")

    # Ensure output directory exists
    Path(output_video_path).parent.mkdir(parents=True, exist_ok=True)
    if os.path.abspath(video_path) == os.path.abspath(output_video_path):
        raise ValueError("Output video path must not be the same as the input video path.")

    ffmpeg_exe = get_ffmpeg_binary()

    # To avoid Windows colon escaping bugs in FFmpeg filter syntax, run with cwd in the subtitle's directory
    work_dir = str(Path(ass_subtitle_path).parent.resolve())
    rel_ass_name = Path(ass_subtitle_path).name

    if progress_callback:
        progress_callback("ENCODING", "Encoding video with burned-in subtitles")

    # FFmpeg command:
    # -i <video_path>
    # -vf "ass=<rel_ass_name>"
    # -c:v libx264 -preset fast -crf 22
    # -c:a copy (or aac fallback if stream cannot be directly copied)
    cmd = [
        ffmpeg_exe,
        "-y",
        "-i", str(Path(video_path).resolve()),
        "-vf", f"ass={rel_ass_name}",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "22",
        "-c:a", "aac",
        "-b:a", "192k",
        str(Path(output_video_path).resolve())
    ]

    res = subprocess.run(
        cmd,
        cwd=work_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace"
    )

    if res.returncode != 0 or not os.path.exists(output_video_path) or os.path.getsize(output_video_path) == 0:
        err_msg = res.stderr[-800:] if res.stderr else f"Exit code {res.returncode}"
        raise RuntimeError(f"FFmpeg burned-in video encoding failed: {err_msg}")

    if progress_callback:
        progress_callback("FINALIZING", "Finalizing MP4 media container")

    return output_video_path
