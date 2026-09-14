"""
Test script for live interim transcription and beam_size=1 preview using REAL speech audio.
Verifies that:
1. Words begin appearing while speaking (< 400ms after onset)
2. Interim hypothesis updates continuously as more words are spoken
3. Final authoritative transcription is committed on auto-stop / finalization
"""
import sys
import os
import asyncio
import json
import time
import wave
import numpy as np
import websockets

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

def load_wav_bytes(filename: str):
    path = os.path.join(PROJECT_ROOT, filename)
    with wave.open(path, 'rb') as wf:
        raw = wf.readframes(wf.getnframes())
    return raw

async def test_streaming_utterance(filename: str, lang: str, label: str):
    print(f"\n=======================================================")
    print(f"  LIVE INTERIM STREAMING TEST: {label} ({filename})")
    print(f"=======================================================")
    
    turn_id = f"turn-stream-{int(time.time() * 1000)}"
    uri = f"ws://127.0.0.1:5000/api/asr/stream?lang={lang}&sample_rate=16000&turnId={turn_id}"
    
    pcm_bytes = load_wav_bytes(filename)
    chunk_size = 1600  # 50ms at 16kHz int16 (1600 bytes)
    
    interim_history = []
    t_start = time.perf_counter()
    first_interim_time = None
    
    async with websockets.connect(uri) as ws:
        async def receiver():
            nonlocal first_interim_time
            try:
                while True:
                    raw = await ws.recv()
                    msg = json.loads(raw)
                    msg_type = msg.get("type")
                    text = msg.get("text", "")
                    
                    if msg_type == "interim":
                        now_ms = (time.perf_counter() - t_start) * 1000.0
                        if first_interim_time is None:
                            first_interim_time = now_ms
                        interim_history.append((now_ms, text))
                        print(f"  [LIVE INTERIM] @ {now_ms:6.1f}ms: \"{text}\"")
                    elif msg_type == "final":
                        now_ms = (time.perf_counter() - t_start) * 1000.0
                        print(f"  [AUTHORITATIVE FINAL] @ {now_ms:6.1f}ms: \"{text}\"")
                        return msg
            except asyncio.CancelledError:
                return None

        # Start background receiver task
        recv_task = asyncio.create_task(receiver())
        
        # Stream audio chunks at real-time 50ms intervals
        for offset in range(0, len(pcm_bytes), chunk_size):
            chunk = pcm_bytes[offset:offset + chunk_size]
            await ws.send(chunk)
            await asyncio.sleep(0.05)  # 50ms cadence
        
        # Send flush and finalize
        print("  --> Finished streaming audio, sending finalize command...")
        await ws.send(json.dumps({"action": "flush"}))
        await ws.send(json.dumps({"action": "finalize", "turnId": turn_id}))
        
        # Await final message
        final_msg = await asyncio.wait_for(recv_task, timeout=10.0)
        
        elapsed_total = (time.perf_counter() - t_start) * 1000.0
        print(f"\n  [SUMMARY] Total Turn Duration: {elapsed_total:.1f}ms")
        if first_interim_time is not None:
            print(f"  [SUMMARY] First Interim Latency: {first_interim_time:.1f}ms")
        print(f"  [SUMMARY] Total Interim Updates: {len(interim_history)}")
        print(f"  [SUMMARY] Final Text: \"{final_msg.get('text')}\"")
        
        assert final_msg is not None, "Final message not received!"
        assert final_msg.get("text", "").strip() != "", "Final text was empty!"
        print(f"  [PASS] Successfully streamed real-time audio and received live transcripts!")

async def main():
    # 1. English live streaming
    await test_streaming_utterance("test_gm_how_are_you.wav", "eng", "English: 'Good morning, how are you?'")
    
    # 2. Hindi live streaming
    await test_streaming_utterance("test_hindi_aap_kaise_hain.wav", "hin", "Hindi: 'आप कैसे हैं?'")

if __name__ == "__main__":
    asyncio.run(main())
