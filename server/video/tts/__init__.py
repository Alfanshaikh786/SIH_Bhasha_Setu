"""
Video Subtitle TTS Package
"""

from server.video.tts.base import TTSProvider, TTSRequest, TTSResponse, TTSVoiceOption
from server.video.tts.native_santali import NativeSantaliTTSProvider
from server.video.tts.browser_fallback import BrowserFallbackTTSProvider
from server.video.tts.manager import tts_manager

__all__ = [
    "TTSProvider",
    "TTSRequest",
    "TTSResponse",
    "TTSVoiceOption",
    "NativeSantaliTTSProvider",
    "BrowserFallbackTTSProvider",
    "tts_manager"
]
