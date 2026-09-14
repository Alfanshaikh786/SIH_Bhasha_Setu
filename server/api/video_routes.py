"""
FastAPI Routes for Video Subtitling Pipeline
Exposes asynchronous subtitle job submission, status polling, and SRT/VTT downloads.
"""

import os
import tempfile
import shutil
import json
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import PlainTextResponse, JSONResponse, FileResponse

from server.video.job_manager import subtitle_job_manager, JobState, BurnJobState
from server.video.tts import tts_manager, TTSRequest


router = APIRouter()

ALLOWED_EXTENSIONS = {".mp4", ".webm", ".mkv", ".mov", ".avi", ".m4v"}


@router.post("/subtitle-job")
async def create_subtitle_job(
    file: UploadFile = File(...),
    source_lang: str = Form("auto"),
    target_lang: str = Form("sat"),
    content_mode: Optional[str] = Form("auto")
):
    """
    Submits a video file for end-to-end subtitle generation.
    Returns job_id and status: QUEUED.
    """
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No filename provided in upload."
        )

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported video format '{ext}'. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Phase 1 Scope Check: Strictly reject Mundari and Ho
    if target_lang.lower() in ["unr", "mundari"]:
        raise HTTPException(
            status_code=400,
            detail="Mundari subtitling is scheduled for Phase 2. This phase supports Santali (sat)."
        )
    if target_lang.lower() in ["hoc", "ho"]:
        raise HTTPException(
            status_code=400,
            detail="Ho subtitling is scheduled for Phase 3. This phase supports Santali (sat)."
        )

    # Create a persistent temporary file for processing
    temp_dir = tempfile.mkdtemp(prefix="bhasha_video_")
    safe_filename = Path(file.filename).name
    temp_video_path = os.path.join(temp_dir, safe_filename)

    with open(temp_video_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    job = subtitle_job_manager.create_job(
        video_path=temp_video_path,
        original_filename=safe_filename,
        source_lang=source_lang,
        target_lang=target_lang,
        content_mode=content_mode
    )

    return JSONResponse(
        status_code=202,
        content={
            "job_id": job.job_id,
            "status": job.status,
            "current_stage": job.current_stage,
            "progress": job.progress
        }
    )


@router.get("/subtitle-job/{job_id}")
async def get_subtitle_job_status(job_id: str):
    """
    Polls the current status, progress percentage, and preview cues of a subtitle job.
    """
    job = subtitle_job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")

    return JSONResponse(content=job.to_dict())


@router.get("/subtitles/{job_id}.{fmt}")
async def download_subtitles(job_id: str, fmt: str):
    """
    Downloads the completed subtitles in WebVTT (.vtt) or SubRip (.srt) format.
    """
    job = subtitle_job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")

    if job.status != JobState.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail=f"Subtitles are not ready. Job status is '{job.status}' (error: {job.error})"
        )

    stem = Path(job.original_filename).stem

    if fmt.lower() == "vtt":
        return PlainTextResponse(
            content=job.vtt_content,
            media_type="text/vtt; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{stem}.vtt"'}
        )
    elif fmt.lower() == "srt":
        return PlainTextResponse(
            content=job.srt_content,
            media_type="application/x-subrip; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{stem}.srt"'}
        )
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid format '{fmt}'. Must be 'vtt' or 'srt'."
        )


@router.post("/burn-subtitles")
async def create_burn_subtitles_job(
    job_id: str = Form(...),
    cues_json: Optional[str] = Form(None),
    style_json: Optional[str] = Form(None),
    subtitle_mode: str = Form("native")
):
    """
    Initiates background burned-in video rendering using FFmpeg and ASS styling.
    Requires original subtitle job_id to locate the source video.
    Optionally accepts updated edited cues JSON and style options JSON.
    """
    source_job = subtitle_job_manager.get_job(job_id)
    if not source_job:
        raise HTTPException(status_code=404, detail=f"Source video job '{job_id}' not found.")

    if not os.path.exists(source_job.video_path):
        raise HTTPException(status_code=410, detail="Source video file is no longer available on the server.")

    # Parse cues (use source_job.cues if none provided)
    cues = source_job.cues
    if cues_json:
        try:
            cues = json.loads(cues_json)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Malformed cues JSON: {e}")

    if not cues:
        raise HTTPException(status_code=400, detail="Cannot render burned-in video with zero subtitle cues.")

    # Parse style options
    style_opts = {}
    if style_json:
        try:
            style_opts = json.loads(style_json)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Malformed style JSON: {e}")

    # Launch background burn job
    burn_job = subtitle_job_manager.create_burn_job(
        video_path=source_job.video_path,
        original_filename=source_job.original_filename,
        cues=cues,
        style_opts=style_opts,
        subtitle_mode=subtitle_mode
    )

    return JSONResponse(
        status_code=202,
        content={
            "burn_job_id": burn_job.burn_job_id,
            "status": burn_job.status,
            "current_stage": burn_job.current_stage
        }
    )


@router.get("/burn-job/{burn_job_id}")
async def get_burn_job_status(burn_job_id: str):
    """
    Polls the current stage-based status of a burned-in video rendering job.
    """
    burn_job = subtitle_job_manager.get_burn_job(burn_job_id)
    if not burn_job:
        raise HTTPException(status_code=404, detail=f"Burn job '{burn_job_id}' not found.")

    return JSONResponse(content=burn_job.to_dict())


@router.get("/burned-video/{burn_job_id}")
async def download_burned_video(burn_job_id: str):
    """
    Downloads the completed MP4 video with burned-in subtitles.
    """
    burn_job = subtitle_job_manager.get_burn_job(burn_job_id)
    if not burn_job:
        raise HTTPException(status_code=404, detail=f"Burn job '{burn_job_id}' not found.")

    if burn_job.status != BurnJobState.COMPLETED or not burn_job.output_video_path or not os.path.exists(burn_job.output_video_path):
        raise HTTPException(
            status_code=400,
            detail=f"Burned video is not ready. Status is '{burn_job.status}' (error: {burn_job.error})"
        )

    stem = Path(burn_job.original_filename).stem
    out_filename = f"{stem}_subtitled.mp4"

    return FileResponse(
        path=burn_job.output_video_path,
        media_type="video/mp4",
        filename=out_filename
    )


@router.post("/cue/update-source")
async def update_cue_source_transcript(
    job_id: str = Form(...),
    cue_id: str = Form(...),
    source_text: str = Form(...)
):
    """
    Updates the source transcript for a cue.
    Marks translation as STALE to prevent serving outdated translations.
    """
    updated_cue = subtitle_job_manager.update_cue_source(
        job_id=job_id,
        cue_id=cue_id,
        new_source=source_text
    )
    if not updated_cue:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' or cue '{cue_id}' not found.")

    return JSONResponse(
        content={
            "success": True,
            "cue": updated_cue,
            "is_stale": True,
            "message": "Source transcript updated. Translation marked STALE and requires regeneration."
        }
    )


@router.post("/cue/regenerate-translation")
async def regenerate_cue_translation(
    job_id: str = Form(...),
    cue_id: str = Form(...),
    target_lang: Optional[str] = Form(None)
):
    """
    Regenerates translation for a specific cue with updated source transcript.
    """
    updated_cue = subtitle_job_manager.regenerate_cue_translation(
        job_id=job_id,
        cue_id=cue_id,
        target_lang=target_lang
    )
    if not updated_cue:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' or cue '{cue_id}' not found.")

    return JSONResponse(
        content={
            "success": True,
            "cue": updated_cue,
            "is_stale": False,
            "message": "Translation regenerated successfully."
        }
    )


@router.post("/cue/approve")
async def approve_cue(
    job_id: str = Form(...),
    cue_id: str = Form(...)
):
    """
    Approves a cue as human verified.
    """
    updated_cue = subtitle_job_manager.approve_cue(
        job_id=job_id,
        cue_id=cue_id
    )
    if not updated_cue:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' or cue '{cue_id}' not found.")

    return JSONResponse(
        content={
            "success": True,
            "cue": updated_cue,
            "message": "Cue approved as human verified."
        }
    )


@router.get("/media-regions/{job_id}")
async def get_media_regions(job_id: str):
    """
    Returns classified media regions and duration coverage statistics for a job.
    """
    job = subtitle_job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")

    return JSONResponse(
        content={
            "job_id": job_id,
            "video_duration_sec": job.video_duration_sec,
            "media_coverage": job.media_coverage,
            "media_regions": job.media_regions,
            "readiness_score": job.readiness_score
        }
    )


@router.post("/tts/synthesize")
async def synthesize_subtitle_tts(
    text: str = Form(...),
    language: str = Form("sat"),
    script: str = Form("Ol Chiki"),
    speed: float = Form(1.0)
):
    """
    Synthesizes speech or provides structured phonetic fallback instructions for subtitle audio playback.
    """
    req = TTSRequest(
        text=text,
        language=language,
        script=script,
        speed=speed
    )
    res = tts_manager.synthesize(req)
    return JSONResponse(content=res.to_dict())


@router.get("/tts/voices")
async def get_tts_voices():
    """
    Returns available TTS voices and truth labels (Native vs Approximation).
    """
    return JSONResponse(content={"voices": tts_manager.list_voices()})


@router.post("/set-content-mode")
async def set_job_content_mode(
    job_id: str = Form(...),
    content_mode: str = Form(...)
):
    """
    Sets or overrides the content mode (e.g. 'song_lyrics', 'speech_dialogue', 'instrumental', 'mixed').
    """
    job = subtitle_job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")

    res = subtitle_job_manager.set_job_content_mode(job_id, content_mode)
    return JSONResponse(
        content={
            "job_id": job_id,
            "content_mode": res.get("content_mode"),
            "content_mode_label": res.get("content_mode_label"),
            "message": f"Content mode updated to {res.get('content_mode_label')}"
        }
    )


@router.post("/align-lyrics")
async def align_job_lyrics(
    job_id: str = Form(...),
    lyrics_text: str = Form(...),
    target_lang: Optional[str] = Form("sat")
):
    """
    Aligns external/pasted/uploaded lyrics text against detected vocal audio regions,
    translates lines to Santali and Latin, and updates all subtitle cues.
    """
    job = subtitle_job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")

    res = subtitle_job_manager.align_lyrics_to_job(job_id, lyrics_text, target_lang=target_lang or "sat")
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to align lyrics."))

    return JSONResponse(
        content={
            "job_id": job_id,
            "success": True,
            "cues": res.get("cues"),
            "cues_count": len(res.get("cues", [])),
            "content_mode": job.content_mode,
            "content_mode_label": job.content_mode_label,
            "message": f"Successfully aligned {len(res.get('cues', []))} lyric lines to vocal segments."
        }
    )


