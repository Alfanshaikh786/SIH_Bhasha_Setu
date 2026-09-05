"""
Faster-Whisper Engine for Hindi, English, and Auto-detected Audio
Provides real neural speech-to-text with timestamps for Video Subtitling and ASR.
"""

import time
import math
import numpy as np
from typing import List, Optional
from server.asr.base import ASREngine, ASRResult, ASRSegment


class WhisperASREngine(ASREngine):
    """
    Neural ASR Engine powered by faster-whisper (CTranslate2).
    Optimized for CPU inference with int8 quantization.
    """

    def __init__(self, model_size: str = "tiny", device: str = "cpu", compute_type: str = "int8"):
        self._model_size = model_size
        self._device = device
        self._compute_type = compute_type
        self._model = None
        self._languages = ["hin", "hi", "eng", "en", "auto"]

    @property
    def engine_name(self) -> str:
        return f"Faster-Whisper-{self._model_size} ({self._compute_type})"

    @property
    def supported_languages(self) -> List[str]:
        return self._languages

    def _ensure_loaded(self):
        if self._model is None:
            from faster_whisper import WhisperModel
            self._model = WhisperModel(
                self._model_size,
                device=self._device,
                compute_type=self._compute_type,
                download_root=None
            )

    def transcribe(
        self,
        audio_data: np.ndarray,
        sample_rate: int = 16000,
        language: str = "auto"
    ) -> ASRResult:
        start_time = time.perf_counter()
        duration_sec = len(audio_data) / float(sample_rate) if sample_rate > 0 else 0.0

        if len(audio_data) == 0 or duration_sec < 0.1:
            return ASRResult(
                text="",
                language=language,
                duration_sec=0.0,
                processing_time_ms=0.0,
                real_time_factor=0.0,
                model_name=self.engine_name,
                segments=[],
                status="empty_audio",
                error_message="Audio input is empty or too short."
            )

        self._ensure_loaded()

        # Map language code
        whisper_lang = None
        lang_lower = language.lower()
        if lang_lower in ["hin", "hi", "hindi"]:
            whisper_lang = "hi"
        elif lang_lower in ["eng", "en", "english"]:
            whisper_lang = "en"
        elif lang_lower in ["auto", "detect"]:
            whisper_lang = None

        # Ensure float32 format
        if audio_data.dtype != np.float32:
            audio_data = audio_data.astype(np.float32)

        # Transcribe
        segments_gen, info = self._model.transcribe(
            audio_data,
            language=whisper_lang,
            beam_size=2,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=400)
        )

        segments: List[ASRSegment] = []
        full_text_parts = []
        confidences = []

        for idx, seg in enumerate(segments_gen):
            text = seg.text.strip()
            if not text:
                continue

            # Convert avg_logprob to acoustic probability in [0, 1]
            conf = None
            if hasattr(seg, "avg_logprob") and seg.avg_logprob is not None:
                try:
                    conf = round(float(np.clip(math.exp(seg.avg_logprob), 0.0, 1.0)), 3)
                    confidences.append(conf)
                except Exception:
                    conf = None

            full_text_parts.append(text)
            segments.append(
                ASRSegment(
                    id=f"seg-{idx + 1}-{int(seg.start * 1000)}",
                    start_sec=round(seg.start, 3),
                    end_sec=round(seg.end, 3),
                    text=text,
                    speaker=f"Speaker {1 if idx % 2 == 0 else 2}",
                    asr_confidence=conf,
                    needs_review=conf is not None and conf < 0.60
                )
            )

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        elapsed_sec = elapsed_ms / 1000.0
        rtf = (elapsed_sec / duration_sec) if duration_sec > 0 else 0.0
        detected_lang = info.language if hasattr(info, "language") else language
        overall_text = " ".join(full_text_parts).strip()
        mean_confidence = float(np.mean(confidences)) if confidences else None

        return ASRResult(
            text=overall_text,
            language=detected_lang,
            duration_sec=round(duration_sec, 3),
            processing_time_ms=round(elapsed_ms, 2),
            real_time_factor=round(rtf, 4),
            model_name=self.engine_name,
            segments=segments,
            asr_confidence=round(mean_confidence, 4) if mean_confidence is not None else None,
            needs_review=any(s.needs_review for s in segments),
            status="success"
        )
