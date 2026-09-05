"""
Abstract Base Engine and Result Data Structures for Bhasha Setu ASR
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional
import numpy as np


@dataclass
class ASRSegment:
    id: str
    start_sec: float
    end_sec: float
    text: str
    speaker: str = "Speaker"
    translation: Optional[str] = None
    asr_confidence: Optional[float] = None
    translation_confidence: Optional[float] = None
    lexicon_match: bool = False
    needs_review: bool = False


@dataclass
class ASRResult:
    text: str
    language: str
    duration_sec: float
    processing_time_ms: float
    real_time_factor: float
    model_name: str
    segments: List[ASRSegment] = field(default_factory=list)
    asr_confidence: Optional[float] = None
    needs_review: bool = False
    status: str = "success"
    error_message: Optional[str] = None


class ASREngine(ABC):
    """
    Abstract interface for ASR engines.
    Extensible for Santali, Hindi, English, and future languages (Mundari, Ho).
    """

    @property
    @abstractmethod
    def engine_name(self) -> str:
        """Returns the formal name of the engine."""
        pass

    @property
    @abstractmethod
    def supported_languages(self) -> List[str]:
        """Returns ISO codes of supported languages."""
        pass

    @abstractmethod
    def transcribe(
        self,
        audio_data: np.ndarray,
        sample_rate: int = 16000,
        language: str = "sat"
    ) -> ASRResult:
        """
        Transcribes a 1D float32 numpy array sampled at sample_rate.
        """
        pass

    def supports_language(self, language: str) -> bool:
        return language.lower() in [l.lower() for l in self.supported_languages]
