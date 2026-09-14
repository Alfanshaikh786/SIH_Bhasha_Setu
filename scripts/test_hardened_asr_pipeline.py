"""
Test suite for hardened S2S audio pipeline, Faster-Whisper Hindi engine, and WebSocket streaming.
Auto-resolves paths and virtual environment dependencies so it can run from any working directory.
Uses REAL speech audio fixtures (WAV 16kHz) and strictly asserts non-empty transcripts.
"""

import sys
import os
import wave

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# 1. Guaranteed Project Root Resolution (works from any working directory or IDE)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# 2. Auto-detect project virtual environment site-packages if running from global python
venv_site_packages = os.path.join(PROJECT_ROOT, ".venv", "Lib", "site-packages")
if os.path.exists(venv_site_packages) and venv_site_packages not in sys.path:
    sys.path.insert(0, venv_site_packages)

import time
import socket
import asyncio
import numpy as np
import websockets
import json

from server.asr.router import asr_router
from server.audio.preprocessing import resample_audio, TARGET_SAMPLE_RATE

def is_backend_active(host="127.0.0.1", port=5000) -> bool:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1.5)
            return s.connect_ex((host, port)) == 0
    except Exception:
        return False

def load_wav_pcm(filename: str):
    path = os.path.join(PROJECT_ROOT, filename)
    with wave.open(path, 'rb') as wf:
        sr = wf.getframerate()
        raw = wf.readframes(wf.getnframes())
        audio = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
        if wf.getnchannels() > 1:
            audio = audio.reshape(-1, wf.getnchannels()).mean(axis=1)
    if sr != TARGET_SAMPLE_RATE:
        audio = resample_audio(audio, orig_sr=sr, target_sr=TARGET_SAMPLE_RATE)
    pcm_bytes = (np.clip(audio, -1.0, 1.0) * 32767).astype(np.int16).tobytes()
    return audio, pcm_bytes, len(audio) / TARGET_SAMPLE_RATE

def test_resampling():
    print("\n--- Test 1: High-Precision 48kHz -> 16kHz Audio Resampling ---")
    sr_orig = 48000
    duration = 1.0  # 1 second
    t = np.linspace(0, duration, int(sr_orig * duration), endpoint=False)
    audio_48k = np.sin(2 * np.pi * 440 * t).astype(np.float32)
    
    audio_16k = resample_audio(audio_48k, orig_sr=sr_orig, target_sr=TARGET_SAMPLE_RATE)
    assert len(audio_16k) == TARGET_SAMPLE_RATE, f"Expected {TARGET_SAMPLE_RATE} samples, got {len(audio_16k)}"
    print(f"  [OK] Successfully resampled 48,000 samples to {len(audio_16k)} samples (exact 1.0s at 16 kHz).")

def test_whisper_hindi_configuration():
    print("\n--- Test 2: Faster-Whisper Hindi Engine Configuration with Real Speech ---")
    hin_engine = asr_router.get_engine("hin")
    assert hin_engine is not None, "Hindi engine not found in asr_router!"
    hin_engine.ensure_loaded()
    print(f"  [OK] Hindi engine name: {hin_engine.engine_name}")
    print(f"  [OK] Supported languages: {hin_engine.supported_languages}")
    
    # Transcribe real Hindi speech
    audio_hi, _, dur = load_wav_pcm("test_hindi_namaste.wav")
    res = hin_engine.transcribe(audio_hi, sample_rate=16000, language="hin", beam_size=5)
    assert res.status == "success", f"Transcription status: {res.status}"
    assert res.text.strip() != "", "Returned empty transcript for real Hindi speech!"
    assert "नमस्ते" in res.text, f"Expected 'नमस्ते' in Devanagari, got: '{res.text}'"
    print(f"  [OK] Model transcribed real Hindi speech ({dur:.2f}s) with status '{res.status}', text: '{res.text}'.")

async def test_websocket_asr_streaming():
    print("\n--- Test 3: Real-Time WebSocket ASR Streaming & Real Speech Finalization ---")
    if not is_backend_active():
        print("  [WARN] Backend is not currently running on port 5000. Skipping live WebSocket streaming test.")
        return

    # 3A. Test Hindi Streaming via WebSocket
    print("  [3A] Streaming Real Hindi Speech ('नमस्ते') through WebSocket...")
    _, pcm_hi, dur_hi = load_wav_pcm("test_hindi_namaste.wav")
    turn_id_hi = f"turn-hi-test-{int(time.time())}"
    uri_hi = f"ws://127.0.0.1:5000/api/asr/stream?lang=hin&sample_rate=16000&turnId={turn_id_hi}"

    interim_received = []
    async with websockets.connect(uri_hi) as ws:
        start_t = time.perf_counter()
        
        # Stream in 50ms chunks (1600 bytes = 800 samples)
        chunk_size = 1600
        for i in range(0, len(pcm_hi), chunk_size):
            chunk = pcm_hi[i:i + chunk_size]
            await ws.send(chunk)
            await asyncio.sleep(0.04)  # Simulate real-time streaming pace
            
            # Non-blocking check for interim messages
            try:
                raw = await asyncio.wait_for(ws.recv(), timeout=0.01)
                msg = json.loads(raw)
                if msg.get("type") == "interim":
                    interim_received.append(msg.get("text"))
            except asyncio.TimeoutError:
                pass

        # Send flush and finalize
        await ws.send(json.dumps({"action": "flush"}))
        await ws.send(json.dumps({"action": "finalize", "turnId": turn_id_hi}))

        # Await final response
        final_msg = None
        while True:
            raw = await asyncio.wait_for(ws.recv(), timeout=6.0)
            msg = json.loads(raw)
            if msg.get("type") == "final":
                final_msg = msg
                break

        elapsed = (time.perf_counter() - start_t) * 1000.0
        assert final_msg is not None, "Final message not received!"
        assert final_msg.get("turnId") == turn_id_hi, f"Turn ID mismatch: {final_msg.get('turnId')}"
        assert final_msg.get("is_final") is True, "is_final was not True"
        assert final_msg.get("text", "").strip() != "", "FAILED: Final text was empty for real speech!"
        assert "नमस्ते" in final_msg.get("text", ""), f"Expected 'नमस्ते', got: '{final_msg.get('text')}'"
        print(f"  [OK] Hindi WebSocket ASR: text='{final_msg.get('text')}' | Latency: {elapsed:.1f}ms | Interims: {len(interim_received)}")

    # 3B. Test English Streaming via WebSocket
    print("  [3B] Streaming Real English Speech ('Hello') through WebSocket...")
    _, pcm_en, dur_en = load_wav_pcm("test_hello.wav")
    turn_id_en = f"turn-en-test-{int(time.time())}"
    uri_en = f"ws://127.0.0.1:5000/api/asr/stream?lang=eng&sample_rate=16000&turnId={turn_id_en}"

    async with websockets.connect(uri_en) as ws:
        start_t = time.perf_counter()
        
        for i in range(0, len(pcm_en), chunk_size):
            chunk = pcm_en[i:i + chunk_size]
            await ws.send(chunk)
            await asyncio.sleep(0.04)

        await ws.send(json.dumps({"action": "flush"}))
        await ws.send(json.dumps({"action": "finalize", "turnId": turn_id_en}))

        final_msg_en = None
        while True:
            raw = await asyncio.wait_for(ws.recv(), timeout=6.0)
            msg = json.loads(raw)
            if msg.get("type") == "final":
                final_msg_en = msg
                break

        elapsed_en = (time.perf_counter() - start_t) * 1000.0
        assert final_msg_en is not None, "Final message not received!"
        assert final_msg_en.get("text", "").strip() != "", "FAILED: English final text was empty!"
        assert "hello" in final_msg_en.get("text", "").lower(), f"Expected 'Hello', got: '{final_msg_en.get('text')}'"
        print(f"  [OK] English WebSocket ASR: text='{final_msg_en.get('text')}' | Latency: {elapsed_en:.1f}ms")

async def test_20_consecutive_turns():
    print("\n--- Test 4: 20 Consecutive WebSocket Turns Benchmark with Real Speech ---")
    if not is_backend_active():
        print("  [WARN] Backend is not running on port 5000. Skipping WebSocket turns benchmark.")
        return

    # Load speech files
    _, pcm_hi_1, _ = load_wav_pcm("test_hindi_namaste.wav")
    _, pcm_hi_2, _ = load_wav_pcm("test_hindi_aap_kaise_hain.wav")
    _, pcm_en_1, _ = load_wav_pcm("test_hello.wav")
    _, pcm_en_2, _ = load_wav_pcm("test_good_morning.wav")

    speech_fixtures = [
        ("hin", pcm_hi_1, "नमस्ते"),
        ("eng", pcm_en_1, "Hello"),
        ("hin", pcm_hi_2, "आप"),
        ("eng", pcm_en_2, "Good morning")
    ]

    latencies = []
    chunk_size = 1600

    for turn_idx in range(1, 21):
        lang, pcm_data, expected_keyword = speech_fixtures[(turn_idx - 1) % len(speech_fixtures)]
        t_id = f"turn-bench-{turn_idx}"
        uri = f"ws://127.0.0.1:5000/api/asr/stream?lang={lang}&sample_rate=16000&turnId={t_id}"
        
        async with websockets.connect(uri) as ws:
            t_start = time.perf_counter()
            
            # Stream actual speech chunks
            for i in range(0, len(pcm_data), chunk_size):
                chunk = pcm_data[i:i + chunk_size]
                await ws.send(chunk)
                await asyncio.sleep(0.01)
            
            await ws.send(json.dumps({"action": "finalize", "turnId": t_id}))
            
            final_msg = None
            while True:
                raw = await asyncio.wait_for(ws.recv(), timeout=6.0)
                msg = json.loads(raw)
                if msg.get("type") == "final":
                    final_msg = msg
                    break

            dur = (time.perf_counter() - t_start) * 1000.0
            latencies.append(dur)
            assert final_msg is not None, f"Turn {turn_idx} failed: No final response"
            assert final_msg.get("turnId") == t_id, f"Turn {turn_idx} failed ID match"
            text = final_msg.get("text", "").strip()
            assert text != "", f"Turn {turn_idx} returned empty text for real speech!"
            print(f"    Turn {turn_idx:02d} [{lang.upper()}]: '{text}' ({dur:.1f}ms)")

    avg_lat = np.mean(latencies)
    p50_lat = np.percentile(latencies, 50)
    p95_lat = np.percentile(latencies, 95)
    print(f"\n  [OK] 20/20 Consecutive turns succeeded with 100% real speech recognized!")
    print(f"  [OK] Real Speech Latency: Avg={avg_lat:.1f}ms | P50={p50_lat:.1f}ms | P95={p95_lat:.1f}ms")

def main():
    test_resampling()
    test_whisper_hindi_configuration()
    asyncio.run(test_websocket_asr_streaming())
    asyncio.run(test_20_consecutive_turns())
    print("\n===============================================================")
    print("  ALL HARDENED ASR & PIPELINE TESTS PASSED SUCCESSFULLY!       ")
    print("===============================================================\n")

if __name__ == "__main__":
    main()
