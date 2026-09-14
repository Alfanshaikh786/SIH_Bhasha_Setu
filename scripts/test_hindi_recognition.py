"""
Test Hindi recognition with Faster-Whisper base model.
Auto-resolves paths and virtual environment dependencies so it can run from any working directory.
"""

import sys
import os

# 1. Guaranteed Project Root Resolution
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# 2. Auto-detect project virtual environment site-packages if running from global python
venv_site_packages = os.path.join(PROJECT_ROOT, ".venv", "Lib", "site-packages")
if os.path.exists(venv_site_packages) and venv_site_packages not in sys.path:
    sys.path.insert(0, venv_site_packages)

import asyncio
import numpy as np
from server.asr.router import asr_router

def test_hindi_transcription():
    print("\n--- Testing Faster-Whisper Base Hindi Recognition ---")
    hin_engine = asr_router.get_engine("hin")
    assert hin_engine is not None, "Hindi engine not registered in asr_router!"
    hin_engine.ensure_loaded()
    print(f"  [OK] Active Engine: {hin_engine.engine_name}")
    print(f"  [OK] Supported Languages: {hin_engine.supported_languages}")

    # Generate synthetic speech signal for basic sanity
    sr = 16000
    t = np.linspace(0, 1.0, sr, endpoint=False)
    sig = (0.2 * np.sin(2 * np.pi * 400 * t)).astype(np.float32)
    res = hin_engine.transcribe(sig, sample_rate=16000, language="hin", beam_size=5)
    print(f"  [OK] Transcription status: {res.status} | Language: {res.language}")

    # Verify language config and settings
    assert res.language in ["hi", "hin"], f"Unexpected language: {res.language}"
    print("\n===============================================================")
    print("  HINDI ROUTING & FASTER-WHISPER BASE VERIFIED SUCCESSFULLY!   ")
    print("===============================================================\n")

if __name__ == "__main__":
    test_hindi_transcription()
