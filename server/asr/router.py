"""
ASR Language Router for Bhasha Setu
Routes transcription requests by ISO language code.
"""

from typing import Dict, List, Optional
import numpy as np
from server.asr.base import ASREngine, ASRResult
from server.asr.santali import SantaliIndicConformerASREngine
from server.asr.whisper_engine import WhisperASREngine


class ASRRouter:
    """
    Central router directing audio inputs to the appropriate language engine.
    Ensures clear separation and prevents silent language fallbacks.
    """

    def __init__(self):
        self._engines: Dict[str, ASREngine] = {}
        # Register Santali Neural Engine (IndicConformer)
        self.register_engine("sat", SantaliIndicConformerASREngine())

        # Register Hindi / English / Auto Engine (Faster-Whisper)
        whisper_engine = WhisperASREngine(model_size="tiny", device="cpu", compute_type="int8")
        self.register_engine("hin", whisper_engine)
        self.register_engine("hi", whisper_engine)
        self.register_engine("eng", whisper_engine)
        self.register_engine("en", whisper_engine)
        self.register_engine("auto", whisper_engine)

    def register_engine(self, lang_code: str, engine: ASREngine):
        self._engines[lang_code.lower()] = engine

    def get_engine(self, lang_code: str) -> Optional[ASREngine]:
        return self._engines.get(lang_code.lower())

    def get_supported_languages(self) -> List[str]:
        return list(self._engines.keys())

    def transcribe(
        self,
        audio_data: np.ndarray,
        sample_rate: int = 16000,
        language: str = "sat"
    ) -> ASRResult:
        lang = language.lower()

        # Phase 1: Explicitly reject Mundari and Ho from being processed under Phase 1
        if lang in ["unr", "mundari"]:
            return ASRResult(
                text="",
                language="unr",
                duration_sec=len(audio_data) / sample_rate,
                processing_time_ms=0.0,
                real_time_factor=0.0,
                model_name="None (Phase 1 Scope Restricted)",
                segments=[],
                status="unsupported_in_phase_1",
                error_message="Mundari ASR is scheduled for Phase 2. This phase supports Santali (sat)."
            )

        if lang in ["hoc", "ho"]:
            return ASRResult(
                text="",
                language="hoc",
                duration_sec=len(audio_data) / sample_rate,
                processing_time_ms=0.0,
                real_time_factor=0.0,
                model_name="None (Phase 1 Scope Restricted)",
                segments=[],
                status="unsupported_in_phase_1",
                error_message="Ho ASR is scheduled for Phase 3. This phase supports Santali (sat)."
            )

        engine = self.get_engine(lang)
        if engine is None:
            return ASRResult(
                text="",
                language=lang,
                duration_sec=len(audio_data) / sample_rate,
                processing_time_ms=0.0,
                real_time_factor=0.0,
                model_name="None",
                segments=[],
                status="unsupported_language",
                error_message=f"No neural ASR engine registered for language '{lang}'."
            )

        return engine.transcribe(audio_data, sample_rate=sample_rate, language=lang)


# Global singleton router
asr_router = ASRRouter()
