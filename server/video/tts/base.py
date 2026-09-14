"""
Base Interfaces and Contracts for Video Subtitle TTS Providers
Defines abstract TTSProvider, request/response models, and voice descriptions.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List


@dataclass
class TTSVoiceOption:
    id: str
    name: str
    language: str
    script: str
    is_native: bool
    description: str


@dataclass
class TTSRequest:
    text: str
    language: str = "sat"
    script: str = "Ol Chiki"
    voice: str = "default"
    speed: float = 1.0
    options: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TTSResponse:
    audio_base64: Optional[str]
    format: str
    duration_sec: float
    provider_name: str
    is_native: bool
    voice_label: str
    cached: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "audio_base64": self.audio_base64,
            "format": self.format,
            "duration_sec": round(self.duration_sec, 3),
            "provider_name": self.provider_name,
            "is_native": self.is_native,
            "voice_label": self.voice_label,
            "cached": self.cached,
            "metadata": self.metadata
        }


class TTSProvider(ABC):
    """
    Abstract contract for text-to-speech providers in Bhasha Setu Video Subtitle Studio.
    """

    @property
    @abstractmethod
    def provider_id(self) -> str:
        pass

    @property
    @abstractmethod
    def is_native_santali(self) -> bool:
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Checks whether the underlying model, device, or remote API is ready."""
        pass

    @abstractmethod
    def synthesize(self, request: TTSRequest) -> TTSResponse:
        """Synthesizes audio from text or returns fallback speech instructions."""
        pass

    @abstractmethod
    def list_voices(self) -> List[TTSVoiceOption]:
        """Returns supported voice options."""
        pass
