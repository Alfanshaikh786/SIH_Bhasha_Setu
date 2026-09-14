"""
Video Subtitle Job Manager
Tracks processing state asynchronously with strict stage transitions, validation, and auto-cleanup.
Integrates media classification, coverage analysis, confidence gating, and subtitle readiness scoring.
"""

import os
import time
import uuid
import threading
import tempfile
import logging
import shutil
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Dict, Any, Optional, List, Set

logger = logging.getLogger("bhasha_video_engine")
if not logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("[%(asctime)s] [%(levelname)s] [VideoEngine] %(message)s"))
    logger.addHandler(_handler)
    logger.setLevel(logging.INFO)

from server.video.ffmpeg_utils import (
    probe_media, 
    extract_audio_to_wav, 
    generate_ass_subtitles, 
    burn_subtitles_to_video
)
from server.asr.router import asr_router
from server.video.timeline import preserve_media_timeline
from server.video.segmenter import segment_subtitles, SubtitleSegmentationConfig
from server.video.validator import validate_subtitles
from server.video.formatters import generate_srt, generate_vtt
from server.video.translator import translate_subtitle_text
from server.video.audio_preprocessor import transcribe_with_robustness
from server.video.media_classifier import media_classifier, MediaType, MediaRegion, ContentMode
from server.video.coverage import MediaCoverageAnalyzer
from server.video.quality import SubtitleReadinessEvaluator, QualityState
import soundfile as sf


# States required for full pipeline visibility
class JobState:
    QUEUED = "QUEUED"
    ANALYZING_VIDEO = "ANALYZING_VIDEO"
    EXTRACTING_AUDIO = "EXTRACTING_AUDIO"
    TRANSCRIBING = "TRANSCRIBING"
    MEDIA_CLASSIFICATION = "MEDIA_CLASSIFICATION"
    ALIGNING = "ALIGNING"
    TRANSLATING = "TRANSLATING"
    GENERATING_SUBTITLES = "GENERATING_SUBTITLES"
    VALIDATING = "VALIDATING"
    READY_FOR_REVIEW = "READY_FOR_REVIEW"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class BurnJobState:
    QUEUED = "QUEUED"
    PREPARING = "PREPARING"
    GENERATING_SUBTITLES = "GENERATING_SUBTITLES"
    ENCODING = "ENCODING"
    FINALIZING = "FINALIZING"
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
        self.audio_quality: Dict[str, Any] = {}
        self.media_regions: List[Dict[str, Any]] = []
        self.media_coverage: Dict[str, Any] = {}
        self.readiness_score: Dict[str, Any] = {}

        self.content_mode: str = ContentMode.SONG_LYRICS.value
        self.content_mode_label: str = ContentMode.display_label(ContentMode.SONG_LYRICS.value)

        self.created_at = time.time()
        self.completed_at: Optional[float] = None
        self.temp_files: List[str] = []  # Retain video_path for subtitle editing and publishing

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
            "content_mode": self.content_mode,
            "content_mode_label": self.content_mode_label,
            "transcript_text": self.transcript_text,
            "subtitle_count": len(self.cues),
            "preview_segments": self.cues,  # Return full cues for Subtitle Studio editing
            "validation": self.validation,
            "audio_quality": self.audio_quality,
            "media_regions": self.media_regions,
            "media_coverage": self.media_coverage,
            "readiness_score": self.readiness_score,
            "timeline_coverage_pct": self.media_coverage.get("timeline_coverage_pct", 100.0),
            "subtitle_coverage_sec": self.media_coverage.get("subtitle_coverage_sec", 0.0),
            "created_at": self.created_at,
            "completed_at": self.completed_at
        }


class BurnVideoJob:
    def __init__(
        self,
        burn_job_id: str,
        video_path: str,
        original_filename: str,
        cues: List[Dict[str, Any]],
        style_opts: Optional[Dict[str, Any]] = None,
        subtitle_mode: str = "native"
    ):
        self.burn_job_id = burn_job_id
        self.video_path = video_path
        self.original_filename = original_filename
        self.cues = cues
        self.style_opts = style_opts or {}
        self.subtitle_mode = subtitle_mode

        self.status = BurnJobState.QUEUED
        self.current_stage = "Preparing video"
        self.output_video_path: Optional[str] = None
        self.error: Optional[str] = None
        self.temp_dir: Optional[str] = None

        self.created_at = time.time()
        self.completed_at: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "burn_job_id": self.burn_job_id,
            "status": self.status,
            "current_stage": self.current_stage,
            "original_filename": self.original_filename,
            "subtitle_count": len(self.cues),
            "subtitle_mode": self.subtitle_mode,
            "style_opts": self.style_opts,
            "has_output_file": bool(self.output_video_path and os.path.exists(self.output_video_path)),
            "error": self.error,
            "created_at": self.created_at,
            "completed_at": self.completed_at
        }


class SubtitleJobManager:
    """
    Manages background execution of end-to-end subtitle jobs.
    """
    def __init__(self, max_workers: int = 2):
        self._jobs: Dict[str, SubtitleJob] = {}
        self._burn_jobs: Dict[str, BurnVideoJob] = {}
        self._lock = threading.Lock()
        self._executor = ThreadPoolExecutor(max_workers=max_workers)
        # Non-blocking initial cleanup of expired burn directories (> 2 hours old)
        try:
            self._executor.submit(self.cleanup_expired_burn_directories, 7200.0)
        except Exception as e:
            logger.debug(f"Startup burn cleanup schedule skipped: {e}")

    def create_job(
        self,
        video_path: str,
        original_filename: str,
        source_lang: str = "auto",
        target_lang: str = "sat",
        content_mode: Optional[str] = None
    ) -> SubtitleJob:
        job_id = str(uuid.uuid4())
        job = SubtitleJob(
            job_id=job_id,
            video_path=video_path,
            original_filename=original_filename,
            source_lang=source_lang,
            target_lang=target_lang
        )
        if content_mode:
            job.content_mode = content_mode
            job.content_mode_label = ContentMode.display_label(content_mode)
        with self._lock:
            self._jobs[job_id] = job

        # Submit background processing
        self._executor.submit(self._run_job_pipeline, job_id)
        return job

    def set_job_content_mode(self, job_id: str, content_mode: str) -> Optional[SubtitleJob]:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return None
            job.content_mode = content_mode
            job.content_mode_label = ContentMode.display_label(content_mode)
            return job

    def align_lyrics_to_job(
        self,
        job_id: str,
        lyrics_text: str,
        target_lang: Optional[str] = None
    ) -> Optional[List[Dict[str, Any]]]:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job or not job.cues:
                return {"success": False, "error": "Job not found or has no cues."}

        lines = [line.strip() for line in lyrics_text.splitlines() if line.strip()]
        if not lines:
            return {"success": False, "error": "No lyrics lines provided."}

        t_lang = target_lang or job.target_lang
        existing_cues = job.cues or []
        vocal_cues = [c for c in existing_cues if c.get("media_type") != "instrumental"]

        vocal_start = 0.0
        vocal_end = job.video_duration_sec or 35.80
        if vocal_cues:
            vocal_start = min(float(c.get("start_sec", 0.0)) for c in vocal_cues)
            vocal_end = max(float(c.get("end_sec", 24.0)) for c in vocal_cues)
        elif job.media_regions:
            singing_regs = [r for r in job.media_regions if r.get("type") in ("singing", "speech")]
            if singing_regs:
                vocal_start = min(float(r.get("start", 0.0)) for r in singing_regs)
                vocal_end = max(float(r.get("end", 24.0)) for r in singing_regs)

        vocal_duration = max(1.0, vocal_end - vocal_start)
        num_lines = len(lines)
        seg_duration = vocal_duration / num_lines

        updated_cues = []
        for i, lyric_line in enumerate(lines):
            c_start = round(vocal_start + i * seg_duration, 2)
            c_end = round(min(vocal_end, c_start + seg_duration - 0.05), 2)
            if c_end <= c_start:
                c_end = round(c_start + 0.5, 2)

            trans_res = translate_subtitle_text(lyric_line, job.source_lang, t_lang)
            trans_text = trans_res.get("translated_text", lyric_line)
            roman_text = trans_res.get("romanized_text", "")

            cue_dict = {
                "index": i + 1,
                "id": f"cue_lyric_{i + 1}",
                "start_sec": c_start,
                "end_sec": c_end,
                "duration_sec": round(c_end - c_start, 2),
                "source_text": lyric_line,
                "translated_text": trans_text,
                "text": trans_text,
                "romanized_text": roman_text,
                "tts_text": roman_text or trans_text,
                "speaker": "Singer",
                "confidence": 0.95,
                "recognition_confidence": 0.95,
                "translation_source": trans_res.get("source", "google_translate_online"),
                "domain": "MUSIC_LYRICS",
                "source_language": job.source_lang,
                "target_language": t_lang,
                "media_type": "singing",
                "review_status": "HUMAN_EDITED",
                "translation_status": "MACHINE_TRANSLATED",
                "verification_status": "UNVERIFIED",
                "is_stale": False,
                "provenance": {
                    "recognition": "lyrics_alignment",
                    "translation": trans_res.get("source", "google_translate_online"),
                    "voice": "indic-parler-tts"
                }
            }
            updated_cues.append(cue_dict)

        with self._lock:
            job.cues = updated_cues
            job.srt_content = generate_srt(updated_cues)
            job.vtt_content = generate_vtt(updated_cues)
            job.content_mode = ContentMode.SONG_LYRICS.value
            job.content_mode_label = ContentMode.display_label(job.content_mode)

        return {"success": True, "cues": updated_cues}

    def get_job(self, job_id: str) -> Optional[SubtitleJob]:
        with self._lock:
            return self._jobs.get(job_id)

    def update_cue_source(self, job_id: str, cue_id: str, new_source: str) -> Optional[Dict[str, Any]]:
        """
        Updates source text for a cue and transitions translation status to STALE.
        Outdated translations must never be presented as fresh.
        """
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return None
            target_cue = None
            for c in job.cues:
                if str(c.get("id")) == str(cue_id) or str(c.get("index")) == str(cue_id):
                    target_cue = c
                    break
            if not target_cue:
                return None

            target_cue["source_text"] = new_source.strip()
            target_cue["is_stale"] = True
            target_cue["translation_status"] = "STALE"
            target_cue["review_status"] = "HUMAN_EDITED"

            # Recalculate readiness
            job.readiness_score = SubtitleReadinessEvaluator.evaluate(
                job.cues,
                job.validation,
                job.media_coverage
            )
            return target_cue

    def regenerate_cue_translation(self, job_id: str, cue_id: str, target_lang: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Regenerates translation for a specific cue whose source text was modified.
        """
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return None
            target_cue = None
            for c in job.cues:
                if str(c.get("id")) == str(cue_id) or str(c.get("index")) == str(cue_id):
                    target_cue = c
                    break
            if not target_cue:
                return None

            t_lang = target_lang or job.target_lang
            s_lang = job.detected_language or job.source_lang or "auto"
            src_text = target_cue.get("source_text", "")

            tr = translate_subtitle_text(src_text, s_lang, t_lang)
            target_cue["text"] = tr["text"]
            target_cue["translated_text"] = tr["text"]
            target_cue["romanized_text"] = tr.get("romanized_text", "")
            target_cue["tts_text"] = target_cue["romanized_text"] or tr["text"]
            target_cue["translation_source"] = tr["source"]
            target_cue["is_stale"] = False
            target_cue["translation_status"] = "MACHINE_TRANSLATED"
            target_cue["review_status"] = "HUMAN_EDITED"

            # Recalculate readiness
            job.readiness_score = SubtitleReadinessEvaluator.evaluate(
                job.cues,
                job.validation,
                job.media_coverage
            )
            return target_cue

    def approve_cue(self, job_id: str, cue_id: str) -> Optional[Dict[str, Any]]:
        """
        Marks a cue as human verified / approved.
        """
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return None
            target_cue = None
            for c in job.cues:
                if str(c.get("id")) == str(cue_id) or str(c.get("index")) == str(cue_id):
                    target_cue = c
                    break
            if not target_cue:
                return None

            target_cue["review_status"] = "APPROVED"
            target_cue["translation_status"] = "HUMAN_VERIFIED"
            target_cue["verification_status"] = "VERIFIED"

            # Recalculate readiness
            job.readiness_score = SubtitleReadinessEvaluator.evaluate(
                job.cues,
                job.validation,
                job.media_coverage
            )
            return target_cue

    def _cleanup_temp_files(self, job: SubtitleJob):
        """Cleans up temporary video copy and extracted WAV files."""
        for path in job.temp_files:
            try:
                if path and os.path.exists(path):
                    os.remove(path)
                    parent = Path(path).parent
                    if "bhasha_video_" in parent.name:
                        shutil.rmtree(parent, ignore_errors=True)
            except Exception:
                pass

    def cleanup_expired_burn_directories(self, ttl_seconds: float = 7200.0) -> int:
        base_temp = tempfile.gettempdir()
        if not os.path.isdir(base_temp):
            return 0

        active_dirs: Set[str] = set()
        with self._lock:
            for job in self._burn_jobs.values():
                is_active = job.status in (
                    BurnJobState.QUEUED,
                    BurnJobState.PREPARING,
                    BurnJobState.GENERATING_SUBTITLES,
                    BurnJobState.ENCODING,
                    BurnJobState.FINALIZING
                )
                if is_active and job.temp_dir:
                    try:
                        active_dirs.add(os.path.normpath(os.path.abspath(job.temp_dir)))
                    except Exception:
                        pass

        cleaned_count = 0
        now = time.time()

        try:
            entries = os.listdir(base_temp)
        except Exception as e:
            logger.warning(f"Failed to list temp directory for cleanup: {e}")
            return 0

        for entry in entries:
            if not entry.startswith("bhasha_burn_"):
                continue

            full_path = os.path.normpath(os.path.abspath(os.path.join(base_temp, entry)))
            if not os.path.isdir(full_path):
                continue

            if full_path in active_dirs:
                continue

            try:
                mtime = os.path.getmtime(full_path)
                if (now - mtime) > ttl_seconds:
                    shutil.rmtree(full_path, ignore_errors=True)
                    cleaned_count += 1
            except Exception as e:
                logger.debug(f"Failed to clean expired burn directory {full_path}: {e}")

        return cleaned_count

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
            # Stage 3: TRANSCRIBING (25% -> 48%)
            # -------------------------------------------------------------
            job.status = JobState.TRANSCRIBING
            job.current_stage = f"Transcribing audio with neural ASR (lang={job.source_lang})"
            job.progress = 30

            # Read 16kHz mono audio into numpy float32
            audio_data, sr = sf.read(wav_path)
            if audio_data.dtype != "float32":
                audio_data = audio_data.astype("float32")

            # Transcribe with adaptive robustness & fallback
            asr_res, robust_meta = transcribe_with_robustness(
                audio_data,
                sample_rate=sr,
                language=job.source_lang,
                asr_router_instance=asr_router
            )
            job.audio_quality = robust_meta

            if asr_res.status != "success":
                raise RuntimeError(f"ASR Transcription Failed: {asr_res.error_message or 'Unknown error'}")

            job.transcript_text = asr_res.text
            job.detected_language = asr_res.language
            job.progress = 48

            # -------------------------------------------------------------
            # Stage 4: MEDIA_CLASSIFICATION (48% -> 56%)
            # -------------------------------------------------------------
            job.status = JobState.MEDIA_CLASSIFICATION
            job.current_stage = "Classifying media timeline (speech, singing, instrumental, silence)"
            job.progress = 52

            raw_regions = media_classifier.analyze_audio_array(
                audio_data,
                sr=sr,
                asr_segments=asr_res.segments if asr_res else [],
                total_duration=job.video_duration_sec
            )
            job.media_regions = [r.to_dict() for r in raw_regions]

            job.media_coverage = MediaCoverageAnalyzer.compute_coverage(
                total_duration_sec=job.video_duration_sec,
                media_regions=raw_regions,
                subtitle_cues=asr_res.segments if asr_res else []
            )

            # Content Mode Detection & Assignment
            detected_mode = media_classifier.detect_content_mode(raw_regions)
            if not getattr(job, "content_mode", None) or job.content_mode == "auto":
                job.content_mode = detected_mode
            job.content_mode_label = ContentMode.display_label(job.content_mode)

            # Check if entire media has no vocal speech
            if not asr_res.segments:
                if job.media_coverage.get("instrumental_sec", 0.0) > 0:
                    job.cues = []
                    job.srt_content = ""
                    job.vtt_content = "WEBVTT\n\nNOTE Instrumental media content\n"
                    job.validation = validate_subtitles([], total_duration_sec=job.video_duration_sec, allow_empty_if_instrumental=True)
                    job.readiness_score = SubtitleReadinessEvaluator.evaluate([], job.validation, job.media_coverage)
                    job.status = JobState.COMPLETED
                    job.current_stage = "Media classified as instrumental audio. Timeline preserved (100% coverage)."
                    job.progress = 100
                    job.completed_at = time.time()
                    return
                else:
                    raise ValueError("No speech or singing could be recognized in the provided video.")

            job.progress = 56

            # -------------------------------------------------------------
            # Stage 5: ALIGNING (56% -> 62%)
            # -------------------------------------------------------------
            job.status = JobState.ALIGNING
            job.current_stage = "Preserving original media timeline and resolving cue overlaps"
            job.progress = 58

            raw_cues = preserve_media_timeline(asr_res.segments, total_duration_sec=job.video_duration_sec)

            # Associate each cue with its corresponding MediaRegion
            for cue in raw_cues:
                cue_mid = (cue.start_sec + cue.end_sec) / 2.0
                matched_region = next((r for r in raw_regions if r.start <= cue_mid <= r.end), None)
                if matched_region:
                    cue.media_type = matched_region.type
                else:
                    cue.media_type = "speech"

            job.progress = 62

            # -------------------------------------------------------------
            # Stage 6: TRANSLATING (62% -> 80%)
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
                    cue.romanized_text = tr.get("romanized_text", "")
                    cue.tts_text = cue.romanized_text or cue.translated_text
                    cue.translation_source = tr["source"]
                    cue.domain = tr.get("domain")
                    cue.provenance = {
                        "recognition": "faster-whisper",
                        "translation": tr["source"],
                        "tts": "indic-parler-tts-fallback"
                    }
                else:
                    cue.translated_text = cue.source_text
                    cue.romanized_text = ""
                    cue.tts_text = cue.source_text
                    cue.translation_source = "original"
                    cue.domain = "GENERAL"

                step_prog = 65 + int((i / max(1, total_cues)) * 15)
                job.progress = min(80, step_prog)

            # -------------------------------------------------------------
            # Stage 7: GENERATING_SUBTITLES (80% -> 90%)
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
            # Stage 8: VALIDATING (90% -> 98%)
            # -------------------------------------------------------------
            job.status = JobState.VALIDATING
            job.current_stage = "Running quality validation (CPS, durations, Unicode integrity)"
            job.progress = 93

            val_res = validate_subtitles(formatted_cues, total_duration_sec=job.video_duration_sec)
            job.validation = val_res

            if not val_res["valid"]:
                raise ValueError(f"Subtitle validation failed: {'; '.join(val_res['fatal_errors'])}")

            # Calculate Subtitle Readiness Score
            job.readiness_score = SubtitleReadinessEvaluator.evaluate(
                job.cues,
                job.validation,
                job.media_coverage
            )
            job.progress = 98

            # -------------------------------------------------------------
            # Stage 9: READY_FOR_REVIEW / COMPLETED (100%)
            # -------------------------------------------------------------
            job.status = JobState.COMPLETED
            if job.readiness_score.get("status") == QualityState.NEEDS_REVIEW:
                job.current_stage = "Subtitles generated. Human review recommended before publishing."
            else:
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

    def create_burn_job(
        self,
        video_path: str,
        original_filename: str,
        cues: List[Dict[str, Any]],
        style_opts: Optional[Dict[str, Any]] = None,
        subtitle_mode: str = "native"
    ) -> BurnVideoJob:
        burn_job_id = str(uuid.uuid4())
        burn_job = BurnVideoJob(
            burn_job_id=burn_job_id,
            video_path=video_path,
            original_filename=original_filename,
            cues=cues,
            style_opts=style_opts,
            subtitle_mode=subtitle_mode
        )
        with self._lock:
            self._burn_jobs[burn_job_id] = burn_job

        self._executor.submit(self._run_burn_pipeline, burn_job_id)
        return burn_job

    def get_burn_job(self, burn_job_id: str) -> Optional[BurnVideoJob]:
        with self._lock:
            return self._burn_jobs.get(burn_job_id)

    def _run_burn_pipeline(self, burn_job_id: str):
        job = self.get_burn_job(burn_job_id)
        if not job:
            return

        temp_dir = None
        try:
            # Stage 1: PREPARING
            job.status = BurnJobState.PREPARING
            job.current_stage = "Validating input video and cues"

            if not os.path.exists(job.video_path):
                raise FileNotFoundError(f"Source video file not found at '{job.video_path}'")

            temp_dir = tempfile.mkdtemp(prefix="bhasha_burn_")
            job.temp_dir = temp_dir

            # Stage 2: GENERATING_SUBTITLES
            job.status = BurnJobState.GENERATING_SUBTITLES
            job.current_stage = f"Synthesizing ASS subtitle stream (mode: {job.subtitle_mode})"

            ass_path = os.path.join(temp_dir, "styled_subtitles.ass")
            generate_ass_subtitles(
                cues=job.cues,
                output_ass_path=ass_path,
                style_opts=job.style_opts,
                subtitle_mode=job.subtitle_mode
            )

            # Stage 3: ENCODING
            job.status = BurnJobState.ENCODING
            job.current_stage = "Encoding video with burned-in subtitles via FFmpeg"

            output_mp4_path = os.path.join(temp_dir, "output_burned.mp4")

            def progress_cb(st: str):
                if st == "ENCODING":
                    job.status = BurnJobState.ENCODING
                    job.current_stage = "Encoding video with burned-in subtitles"
                elif st == "FINALIZING":
                    job.status = BurnJobState.FINALIZING
                    job.current_stage = "Finalizing MP4 media container"

            burn_subtitles_to_video(
                video_path=job.video_path,
                ass_subtitle_path=ass_path,
                output_video_path=output_mp4_path,
                progress_callback=progress_cb
            )

            job.output_video_path = output_mp4_path
            job.status = BurnJobState.COMPLETED
            job.current_stage = "Video rendered successfully"
            job.completed_at = time.time()

        except Exception as e:
            job.status = BurnJobState.FAILED
            job.current_stage = "Video rendering encountered an error"
            job.error = str(e)
            job.completed_at = time.time()


# Global singleton job manager
subtitle_job_manager = SubtitleJobManager(max_workers=2)
