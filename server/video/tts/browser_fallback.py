"""
Browser Fallback TTS Provider
Transparently labels speech as 'Pronunciation Approximation' using Indian English/Hindi acoustic bridges.
Strictly respects Rule 5: Never claims browser synthesis is native Santali TTS.
"""

from typing import List
from server.video.tts.base import TTSProvider, TTSRequest, TTSResponse, TTSVoiceOption


class BrowserFallbackTTSProvider(TTSProvider):
    """
    Client-side speech synthesis fallback provider.
    Provides structured phonetic parameters to the browser Web Speech API.
    """

    @property
    def provider_id(self) -> str:
        return "browser_indian_acoustic_bridge"

    @property
    def is_native_santali(self) -> bool:
        return False

    def is_available(self) -> bool:
        return True

    def list_voices(self) -> List[TTSVoiceOption]:
        return [
            TTSVoiceOption(
                id="browser_hi_in",
                name="Indian Acoustic Bridge (Hindi Cadence)",
                language="hi-IN",
                script="Latin",
                is_native=False,
                description="Approximates Santali Latin phonetics via Indian acoustic cadence"
            ),
            TTSVoiceOption(
                id="browser_en_in",
                name="Indian Acoustic Bridge (English Cadence)",
                language="en-IN",
                script="Latin",
                is_native=False,
                description="Approximates Romanized Santali vowels via Indian English voice"
            )
        ]

    def synthesize(self, request: TTSRequest) -> TTSResponse:
        # Browser fallback returns explicit execution parameters for the client audio pipeline
        clean_text = request.text.strip()
        approx_duration = round(max(0.8, len(clean_text) * 0.08 / max(0.5, request.speed)), 2)

        return TTSResponse(
            audio_base64=None,
            format="client_speech_synthesis",
            duration_sec=approx_duration,
            provider_name="Browser Indian Acoustic Bridge",
            is_native=False,
            voice_label="Pronunciation Approximation",
            cached=False,
            metadata={
                "client_action": "synthesize_browser_speech",
                "recommended_voice_langs": ["hi-IN", "en-IN"],
                "speed": request.speed,
                "phonetic_text": clean_text,
                "truth_label": "Pronunciation Approximation (Browser Acoustic Fallback)"
            }
        )
