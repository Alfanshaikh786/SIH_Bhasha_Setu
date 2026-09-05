"""
Video Subtitle Job Manager
Tracks processing state asynchronously with strict stage transitions, validation, and auto-cleanup.
"""

import os
import time
import uuid
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Dict, Any, Optional, List

from server.video.ffmpeg_utils import probe_media, extract_audio_to_wav
from server.asr.router import asr_router
from server.video.timeline import preserve_media_timeline
from server.video.segmenter import segment_subtitles, SubtitleSegmentationConfig
from server.video.validator import validate_subtitles
from server.video.formatters import generate_srt, generate_vtt
from server.video.translator import translate_subtitle_text
import soundfile as sf


# States required by Section 13
class JobState:
    QUEUED = "QUEUED"
    ANALYZING_VIDEO = "ANALYZING_VIDEO"
    EXTRACTING_AUDIO = "EXTRACTING_AUDIO"
    TRANSCRIBING = "TRANSCRIBING"
    ALIGNING = "ALIGNING"
    TRANSLATING = "TRANSLATING"
    GENERATING_SUBTITLES = "GENERATING_SUBTITLES"
    VALIDATING = "VALIDATING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class SubtitleJob:
    def __init__(
        self,
        job_id: str,
        video_path: str,
        original_filename: str,
        source_lang: str = "auto",
        target_lang: str = "sat"
    ):
        self.job_id = job_id
        self.video_path = video_path
        self.original_filename = original_filename
        self.source_lang = source_lang
        self.target_lang = target_lang

        self.status = JobState.QUEUED
        self.current_stage = "Job queued for processing"
        self.progress = 0
        self.error: Optional[str] = None

        self.video_duration_sec: float = 0.0
        self.detected_language: Optional[str] = None
        self.transcript_text: str = ""
        self.cues: List[Dict[str, Any]] = []
        self.srt_content: str = ""
        self.vtt_content: str = ""
        self.validation: Dict[str, Any] = {}

        self.created_at = time.time()
        self.completed_at: Optional[float] = None
        self.temp_files: List[str] = [video_path]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "job_id": self.job_id,
            "status": self.status,
            "current_stage": self.current_stage,
            "progress": self.progress,
            "error": self.error,
            "original_filename": self.original_filename,
            "video_duration_sec": self.video_duration_sec,
            "source_language": self.source_lang,
            "detected_language": self.detected_language,
            "target_language": self.target_lang,
            "transcript_text": self.transcript_text,
            "subtitle_count": len(self.cues),
            "preview_segments": self.cues[:50],  # Return preview
            "validation": self.validation,
            "created_at": self.created_at,
            "completed_at": self.completed_at
        }


class SubtitleJobManager:
    """
    Manages background execution of end-to-end subtitle jobs.
    """
    def __init__(self, max_workers: int = 2):
        self._jobs: Dict[str, SubtitleJob] = {}
        self._lock = threading.Lock()
        self._executor = ThreadPoolExecutor(max_workers=max_workers)

    def create_job(
        self,
        video_path: str,
        original_filename: str,
        source_lang: str = "auto",
        target_lang: str = "sat"
    ) -> SubtitleJob:
        job_id = str(uuid.uuid4())
        job = SubtitleJob(
            job_id=job_id,
            video_path=video_path,
            original_filename=original_filename,
            source_lang=source_lang,
            target_lang=target_lang
        )
        with self._lock:
            self._jobs[job_id] = job

        # Submit background processing
        self._executor.submit(self._run_job_pipeline, job_id)
        return job

    def get_job(self, job_id: str) -> Optional[SubtitleJob]:
        with self._lock:
            return self._jobs.get(job_id)

    def _cleanup_temp_files(self, job: SubtitleJob):
        """Cleans up temporary video copy and extracted WAV files."""
        for path in job.temp_files:
            try:
                if path and os.path.exists(path):
                    os.remove(path)
                    # If inside a temp directory created for this job, remove dir
                    parent = Path(path).parent
                    if "bhasha_video_" in parent.name:
                        import shutil
                        shutil.rmtree(parent, ignore_errors=True)
            except Exception:
                pass

    def _run_job_pipeline(self, job_id: str):
        job = self.get_job(job_id)
        if not job:
            return

        try:
            # -------------------------------------------------------------
            # Stage 1: ANALYZING_VIDEO (0% -> 10%)
            # -------------------------------------------------------------
            job.status = JobState.ANALYZING_VIDEO
            job.current_stage = "Probing video stream and container metadata"
            job.progress = 5

            media_info = probe_media(job.video_path)
            if not media_info["has_audio"]:
                raise ValueError("Uploaded video contains no audio stream to transcribe.")

            job.video_duration_sec = media_info["duration_sec"]
            job.progress = 10

            # -------------------------------------------------------------
            # Stage 2: EXTRACTING_AUDIO (10% -> 25%)
            # -------------------------------------------------------------
            job.status = JobState.EXTRACTING_AUDIO
            job.current_stage = "Extracting 16kHz mono PCM WAV via FFmpeg"
            job.progress = 15

            wav_path, audio_dur = extract_audio_to_wav(job.video_path)
            job.temp_files.append(wav_path)
            job.progress = 25

            # -------------------------------------------------------------
            # Stage 3: TRANSCRIBING (25% -> 50%)
            # -------------------------------------------------------------
            job.status = JobState.TRANSCRIBING
            job.current_stage = f"Transcribing audio with neural ASR (lang={job.source_lang})"
            job.progress = 30

            # Read 16kHz mono audio into numpy float32
            audio_data, sr = sf.read(wav_path)
            if audio_data.dtype != "float32":
                audio_data = audio_data.astype("float32")

            asr_res = asr_router.transcribe(audio_data, sample_rate=sr, language=job.source_lang)
            if asr_res.status != "success":
                raise RuntimeError(f"ASR Transcription Failed: {asr_res.error_message or 'Unknown error'}")

            job.transcript_text = asr_res.text
            job.detected_language = asr_res.language
            job.progress = 50

            if not asr_res.segments:
                raise ValueError("No speech could be recognized in the provided video.")

            # -------------------------------------------------------------
            # Stage 4: ALIGNING (50% -> 60%)
            # -------------------------------------------------------------
            job.status = JobState.ALIGNING
            job.current_stage = "Preserving original media timeline and resolving cue overlaps"
            job.progress = 55

            raw_cues = preserve_media_timeline(asr_res.segments, total_duration_sec=job.video_duration_sec)
            job.progress = 60

            # -------------------------------------------------------------
            # Stage 5: TRANSLATING (60% -> 80%)
            # -------------------------------------------------------------
            job.status = JobState.TRANSLATING
            job.current_stage = f"Translating segments to target language ({job.target_lang})"
            job.progress = 65

            src_code = job.detected_language or job.source_lang
            total_cues = len(raw_cues)

            for i, cue in enumerate(raw_cues):
                if src_code != job.target_lang and job.target_lang != "original":
                    tr = translate_subtitle_text(cue.source_text, src_code, job.target_lang)
                    cue.translated_text = tr["text"]
                    cue.translation_source = tr["source"]
                else:
                    cue.translated_text = cue.source_text
                    cue.translation_source = "original"

                step_prog = 65 + int((i / max(1, total_cues)) * 15)
                job.progress = min(80, step_prog)

            # -------------------------------------------------------------
            # Stage 6: GENERATING_SUBTITLES (80% -> 90%)
            # -------------------------------------------------------------
            job.status = JobState.GENERATING_SUBTITLES
            job.current_stage = "Formatting subtitle line wrapping (max 2 lines, 42 chars)"
            job.progress = 85

            formatted_cues = segment_subtitles(raw_cues, SubtitleSegmentationConfig(max_chars_per_line=42, max_lines_per_cue=2))
            job.srt_content = generate_srt(formatted_cues)
            job.vtt_content = generate_vtt(formatted_cues)
            job.cues = [c.to_dict() for c in formatted_cues]
            job.progress = 90

            # -------------------------------------------------------------
            # Stage 7: VALIDATING (90% -> 98%)
            # -------------------------------------------------------------
            job.status = JobState.VALIDATING
            job.current_stage = "Running quality validation (overlaps, durations, Unicode integrity)"
            job.progress = 93

            val_res = validate_subtitles(formatted_cues, total_duration_sec=job.video_duration_sec)
            job.validation = val_res

            if not val_res["valid"]:
                raise ValueError(f"Subtitle validation failed: {'; '.join(val_res['fatal_errors'])}")

            job.progress = 98

            # -------------------------------------------------------------
            # Stage 8: COMPLETED (100%)
            # -------------------------------------------------------------
            job.status = JobState.COMPLETED
            job.current_stage = "Subtitles generated successfully."
            job.progress = 100
            job.completed_at = time.time()

        except Exception as e:
            job.status = JobState.FAILED
            job.current_stage = "Job processing encountered an error"
            job.error = str(e)
            job.progress = 100
            job.completed_at = time.time()

        finally:
            self._cleanup_temp_files(job)


# Global singleton job manager
subtitle_job_manager = SubtitleJobManager(max_workers=2)
