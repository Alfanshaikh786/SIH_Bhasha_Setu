"""
Generates authentic Hindi speech WAV files using gTTS for testing.
"""
import io
import os
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
import numpy as np
from gtts import gTTS

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from server.audio.preprocessing import preprocess_audio_pipeline
import wave

def generate_hindi_wav(text, filename):
    out_path = os.path.join(PROJECT_ROOT, filename)
    tts = gTTS(text=text, lang='hi', slow=False)
    mp3_fp = io.BytesIO()
    tts.write_to_fp(mp3_fp)
    mp3_bytes = mp3_fp.getvalue()
    
    # Preprocess to 16kHz float32 mono
    audio_16k, dur = preprocess_audio_pipeline(mp3_bytes)
    
    # Save as standard 16kHz PCM WAV
    pcm_bytes = (np.clip(audio_16k, -1.0, 1.0) * 32767).astype(np.int16).tobytes()
    with wave.open(out_path, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        wf.writeframes(pcm_bytes)
    
    print(f"Generated Hindi WAV: {out_path} ({dur:.2f}s) for text: '{text}'")

if __name__ == "__main__":
    generate_hindi_wav("नमस्ते", "test_hindi_namaste.wav")
    generate_hindi_wav("नमस्ते, आप कैसे हैं?", "test_hindi_aap_kaise_hain.wav")
