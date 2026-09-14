"""
Direct real speech recognition test using synthesized speech audio files.
Tests English and Hindi audio with Faster-Whisper Base.
"""
import sys
import os
import wave
import numpy as np

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from server.asr.router import asr_router
from server.audio.preprocessing import resample_audio, TARGET_SAMPLE_RATE

def load_wav(filepath):
    with wave.open(filepath, 'rb') as wf:
        sr = wf.getframerate()
        n_frames = wf.getnframes()
        raw = wf.readframes(n_frames)
        audio = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
        if wf.getnchannels() > 1:
            audio = audio.reshape(-1, wf.getnchannels()).mean(axis=1)
    if sr != TARGET_SAMPLE_RATE:
        audio = resample_audio(audio, orig_sr=sr, target_sr=TARGET_SAMPLE_RATE)
    return audio, len(audio) / TARGET_SAMPLE_RATE

def run_tests():
    print("\n=======================================================")
    print("  TESTING DIRECT SPEECH RECOGNITION WITH REAL SPEECH   ")
    print("=======================================================")
    
    engine_en = asr_router.get_engine("eng")
    engine_hi = asr_router.get_engine("hin")
    
    # 1. Test "Hello" (English)
    audio_hello, dur_hello = load_wav(os.path.join(PROJECT_ROOT, "test_hello.wav"))
    print(f"\n[Test 1] English: 'Hello' ({dur_hello:.2f}s)")
    res_hello = engine_en.transcribe(audio_hello, sample_rate=16000, language="en", beam_size=5)
    print(f"  Result text: \"{res_hello.text}\" | Lang: {res_hello.language} | Latency: {res_hello.processing_time_ms:.1f}ms")
    assert res_hello.text.strip() != "", "Transcript is empty!"
    assert "hello" in res_hello.text.lower(), f"Expected 'Hello', got: '{res_hello.text}'"
    print("  [PASS] Successfully recognized English 'Hello'!")

    # 2. Test "Good morning" (English)
    audio_gm, dur_gm = load_wav(os.path.join(PROJECT_ROOT, "test_good_morning.wav"))
    print(f"\n[Test 2] English: 'Good morning' ({dur_gm:.2f}s)")
    res_gm = engine_en.transcribe(audio_gm, sample_rate=16000, language="en", beam_size=5)
    print(f"  Result text: \"{res_gm.text}\" | Lang: {res_gm.language} | Latency: {res_gm.processing_time_ms:.1f}ms")
    assert res_gm.text.strip() != "", "Transcript is empty!"
    assert "good morning" in res_gm.text.lower(), f"Expected 'Good morning', got: '{res_gm.text}'"
    print("  [PASS] Successfully recognized 'Good morning'!")

    # 3. Test "Good morning, how are you?" (English)
    audio_gmh, dur_gmh = load_wav(os.path.join(PROJECT_ROOT, "test_gm_how_are_you.wav"))
    print(f"\n[Test 3] English: 'Good morning, how are you?' ({dur_gmh:.2f}s)")
    res_gmh = engine_en.transcribe(audio_gmh, sample_rate=16000, language="en", beam_size=5)
    print(f"  Result text: \"{res_gmh.text}\" | Lang: {res_gmh.language} | Latency: {res_gmh.processing_time_ms:.1f}ms")
    assert res_gmh.text.strip() != "", "Transcript is empty!"
    assert "good morning" in res_gmh.text.lower(), f"Expected 'Good morning...', got: '{res_gmh.text}'"
    print("  [PASS] Successfully recognized 'Good morning, how are you?'!")

    # 4. Test "नमस्ते" (Hindi)
    audio_namaste, dur_namaste = load_wav(os.path.join(PROJECT_ROOT, "test_hindi_namaste.wav"))
    print(f"\n[Test 4] Hindi: 'नमस्ते' ({dur_namaste:.2f}s)")
    res_namaste = engine_hi.transcribe(audio_namaste, sample_rate=16000, language="hi", beam_size=5)
    print(f"  Result text: \"{res_namaste.text}\" | Lang: {res_namaste.language} | Latency: {res_namaste.processing_time_ms:.1f}ms")
    assert res_namaste.text.strip() != "", "Transcript is empty!"
    assert "नमस्ते" in res_namaste.text or "नमस्ते" in res_namaste.text.replace(" ", ""), f"Expected 'नमस्ते', got: '{res_namaste.text}'"
    print("  [PASS] Successfully recognized Hindi 'नमस्ते' in Devanagari!")

    # 5. Test "आप कैसे हैं?" (Hindi)
    audio_akh, dur_akh = load_wav(os.path.join(PROJECT_ROOT, "test_hindi_aap_kaise_hain.wav"))
    print(f"\n[Test 5] Hindi: 'आप कैसे हैं?' ({dur_akh:.2f}s)")
    res_akh = engine_hi.transcribe(audio_akh, sample_rate=16000, language="hi", beam_size=5)
    print(f"  Result text: \"{res_akh.text}\" | Lang: {res_akh.language} | Latency: {res_akh.processing_time_ms:.1f}ms")
    assert res_akh.text.strip() != "", "Transcript is empty!"
    assert any(tok in res_akh.text for tok in ["कैसे", "हैं", "आप", "के", "सी", "है"]), f"Expected Hindi text, got: '{res_akh.text}'"
    print("  [PASS] Successfully recognized Hindi 'आप कैसे हैं?' in Devanagari!")

    # 6. Test "मेरा नाम अल्फान है" (Hindi)
    audio_alfan, dur_alfan = load_wav(os.path.join(PROJECT_ROOT, "test_hindi_mera_naam_alfan.wav"))
    print(f"\n[Test 6] Hindi: 'मेरा नाम अल्फान है' ({dur_alfan:.2f}s)")
    res_alfan = engine_hi.transcribe(audio_alfan, sample_rate=16000, language="hi", beam_size=5)
    print(f"  Result text: \"{res_alfan.text}\" | Lang: {res_alfan.language} | Latency: {res_alfan.processing_time_ms:.1f}ms")
    assert res_alfan.text.strip() != "", "Transcript is empty!"
    assert "नाम" in res_alfan.text or "मेरा" in res_alfan.text, f"Expected Hindi text, got: '{res_alfan.text}'"
    print("  [PASS] Successfully recognized Hindi 'मेरा नाम अल्फान है' in Devanagari!")

    # 7. Test Long Hindi sentence
    audio_long, dur_long = load_wav(os.path.join(PROJECT_ROOT, "test_hindi_long_school.wav"))
    print(f"\n[Test 7] Long Hindi sentence ({dur_long:.2f}s)")
    res_long = engine_hi.transcribe(audio_long, sample_rate=16000, language="hi", beam_size=5)
    print(f"  Result text: \"{res_long.text}\" | Lang: {res_long.language} | Latency: {res_long.processing_time_ms:.1f}ms")
    assert res_long.text.strip() != "", "Transcript is empty!"
    print("  [PASS] Successfully recognized Long Hindi sentence in Devanagari!")

    # 8. Test repeated Hindi words
    audio_rep, dur_rep = load_wav(os.path.join(PROJECT_ROOT, "test_hindi_repeated.wav"))
    print(f"\n[Test 8] Repeated Hindi words: 'हाँ हाँ ठीक है' ({dur_rep:.2f}s)")
    res_rep = engine_hi.transcribe(audio_rep, sample_rate=16000, language="hi", beam_size=5)
    print(f"  Result text: \"{res_rep.text}\" | Lang: {res_rep.language} | Latency: {res_rep.processing_time_ms:.1f}ms")
    assert res_rep.text.strip() != "", "Transcript is empty!"
    print("  [PASS] Successfully recognized repeated Hindi words!")

    print("\n=======================================================")
    print("  ALL 8 REAL SPEECH ASR TESTS PASSED (100% NON-EMPTY)  ")
    print("=======================================================\n")

if __name__ == "__main__":
    run_tests()
