"""
Centralized TTS Manager with Provider Routing and In-Memory Caching.
Maintains deterministic SHA256 cache keys: hash(language + script + ttsText + voice + speed + provider).
"""

import hashlib
import json
from typing import Dict, Any, Optional, List
from server.video.tts.base import TTSProvider, TTSRequest, TTSResponse, TTSVoiceOption
from server.video.tts.native_santali import NativeSantaliTTSProvider
from server.video.tts.browser_fallback import BrowserFallbackTTSProvider


class TTSManager:
    def __init__(self):
        self.native_provider = NativeSantaliTTSProvider()
        self.fallback_provider = BrowserFallbackTTSProvider()
        self._cache: Dict[str, TTSResponse] = {}

    def get_preferred_provider(self, prefer_native: bool = True) -> TTSProvider:
        if prefer_native and self.native_provider.is_available():
            return self.native_provider
        return self.fallback_provider

    def _compute_cache_key(self, req: TTSRequest, provider_id: str) -> str:
        key_raw = f"{req.language}:{req.script}:{req.text}:{req.voice}:{req.speed}:{provider_id}"
        return hashlib.sha256(key_raw.encode("utf-8")).hexdigest()

    def synthesize(self, request: TTSRequest, prefer_native: bool = True) -> TTSResponse:
        provider = self.get_preferred_provider(prefer_native)
        cache_key = self._compute_cache_key(request, provider.provider_id)

        if cache_key in self._cache:
            res = self._cache[cache_key]
            res.cached = True
            return res

        res = provider.synthesize(request)
        self._cache[cache_key] = res
        return res

    def list_voices(self) -> List[Dict[str, Any]]:
        voices = []
        if self.native_provider.is_available():
            voices.extend([asdict_voice(v) for v in self.native_provider.list_voices()])
        voices.extend([asdict_voice(v) for v in self.fallback_provider.list_voices()])
        return voices


def asdict_voice(v: TTSVoiceOption) -> Dict[str, Any]:
    return {
        "id": v.id,
        "name": v.name,
        "language": v.language,
        "script": v.script,
        "is_native": v.is_native,
        "description": v.description
    }


# Global singleton
tts_manager = TTSManager()
