"""
AI4Bharat IndicConformer Neural ASR Engine for Santali (Ol Chiki Script)
"""

import time
import os
import numpy as np
from typing import List, Optional
from server.asr.base import ASREngine, ASRResult, ASRSegment
from server.audio.preprocessing import energy_vad_segmentation, TARGET_SAMPLE_RATE

# Lazy load model container
_model_instance = None


def get_santali_model():
    """
    Initializes and caches the IndicConformer Santali ONNX model.
    Uses int8 quantized model for low memory footprint (~131 MB) and fast inference.
    """
    global _model_instance
    if _model_instance is None:
        import onnx_asr
        model_id = "OpenVoiceOS/ai4bharat-indicconformer-sat-onnx"
        _model_instance = onnx_asr.load_model(model_id, quantization="int8")
    return _model_instance


class SantaliIndicConformerASREngine(ASREngine):
    """
    Production Neural ASR Engine for Santali (ISO 639-3: sat).
    Outputs authentic Ol Chiki script (U+1C50–U+1C7F).
    """

    def __init__(self):
        self._model = None
        self._model_name = "AI4Bharat IndicConformer Santali (ONNX Int8)"

    @property
    def engine_name(self) -> str:
        return self._model_name

    @property
    def supported_languages(self) -> List[str]:
        return ["sat", "santali"]

    def _ensure_loaded(self):
        if self._model is None:
            self._model = get_santali_model()

    def transcribe(
        self,
        audio_data: np.ndarray,
        sample_rate: int = TARGET_SAMPLE_RATE,
        language: str = "sat"
    ) -> ASRResult:
        """
        Transcribes a 1D float32 audio waveform into native Ol Chiki text with
        audio-driven VAD segment timestamps.
        """
        self._ensure_loaded()
        duration_sec = len(audio_data) / float(sample_rate) if sample_rate > 0 else 0.0

        if len(audio_data) == 0 or duration_sec < 0.1:
            return ASRResult(
                text="",
                language="sat",
                duration_sec=duration_sec,
                processing_time_ms=0.0,
                real_time_factor=0.0,
                model_name=self._model_name,
                segments=[],
                asr_confidence=None,
                needs_review=True,
                status="empty_audio"
            )

        start_time = time.perf_counter()

        # 1. Segment using Voice Activity Detection (VAD)
        raw_segments = energy_vad_segmentation(audio_data, sr=sample_rate)
        segments: List[ASRSegment] = []
        full_text_parts = []
        confidences = []

        ts_adapter = self._model.with_timestamps()

        for seg_idx, (s_start, s_end, s_audio) in enumerate(raw_segments):
            if len(s_audio) < int(sample_rate * 0.15):
                continue

            try:
                ts_res = ts_adapter.recognize(s_audio, sample_rate=sample_rate)
                seg_text = ts_res.text.strip()
            except Exception as e:
                seg_text = ""

            if not seg_text:
                continue

            # Calculate acoustic confidence from logprobs if available
            seg_conf = None
            if hasattr(ts_res, "logprobs") and ts_res.logprobs:
                try:
                    probs = [np.exp(lp) for lp in ts_res.logprobs if lp is not None and not np.isnan(lp)]
                    if probs:
                        seg_conf = float(np.clip(np.mean(probs), 0.0, 1.0))
                        confidences.append(seg_conf)
                except Exception:
                    seg_conf = None

            full_text_parts.append(seg_text)
            segments.append(
                ASRSegment(
                    id=f"seg-{seg_idx + 1}-{int(s_start * 1000)}",
                    start_sec=round(s_start, 3),
                    end_sec=round(s_end, 3),
                    text=seg_text,
                    speaker=f"Speaker {1 if seg_idx % 2 == 0 else 2}",
                    asr_confidence=seg_conf,
                    needs_review=seg_conf is not None and seg_conf < 0.65
                )
            )

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        elapsed_sec = elapsed_ms / 1000.0
        rtf = (elapsed_sec / duration_sec) if duration_sec > 0 else 0.0
        overall_text = " ".join(full_text_parts).strip()

        mean_confidence = float(np.mean(confidences)) if confidences else None

        return ASRResult(
            text=overall_text,
            language="sat",
            duration_sec=round(duration_sec, 3),
            processing_time_ms=round(elapsed_ms, 2),
            real_time_factor=round(rtf, 4),
            model_name=self._model_name,
            segments=segments,
            asr_confidence=round(mean_confidence, 4) if mean_confidence is not None else None,
            needs_review=mean_confidence is not None and mean_confidence < 0.65,
            status="success"
        )
