"""
FastAPI Routes for Video Subtitling Pipeline
Exposes asynchronous subtitle job submission, status polling, and SRT/VTT downloads.
"""

import os
import tempfile
import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import PlainTextResponse, JSONResponse

from server.video.job_manager import subtitle_job_manager, JobState


router = APIRouter()

ALLOWED_EXTENSIONS = {".mp4", ".webm", ".mkv", ".mov", ".avi", ".m4v"}


@router.post("/subtitle-job")
async def create_subtitle_job(
    file: UploadFile = File(...),
    source_lang: str = Form("auto"),
    target_lang: str = Form("sat")
):
    """
    Submits a video file for end-to-end subtitle generation.
    Returns job_id and status: QUEUED.
    """
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
        target_lang=target_lang
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
