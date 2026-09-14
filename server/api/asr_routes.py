"""
FastAPI REST & WebSocket Endpoints for Neural ASR (Santali IndicConformer + Faster-Whisper)
"""

import json
import time
import asyncio
from fastapi import APIRouter, File, Form, UploadFile, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import numpy as np

from server.asr.router import asr_router
from server.audio.preprocessing import preprocess_audio_pipeline, resample_audio, TARGET_SAMPLE_RATE


router = APIRouter()


class ASRStatusResponse(BaseModel):
    status: str
    active_engine: str
    supported_languages: list[str]
    model_name: str
    script: str
    sample_rate: int
    offline_capable: bool
    device: str


@router.get("/status", response_model=ASRStatusResponse)
def get_asr_status():
    """
    Returns the real-time operational status of the neural ASR engine.
    """
    engine = asr_router.get_engine("sat")
    engine_name = engine.engine_name if engine else "Unavailable"

    return ASRStatusResponse(
        status="ready" if engine else "error",
        active_engine=engine_name,
        supported_languages=["sat", "hin", "hi", "eng", "en"],
        model_name="ai4bharat/indicconformer_stt_sat_hybrid_ctc_rnnt_large (ONNX int8) + Faster-Whisper",
        script="Ol Chiki (U+1C50\u2013U+1C7F) / Devanagari",
        sample_rate=16000,
        offline_capable=True,
        device="CPU / ONNX Runtime"
    )


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    source_lang: str = Form("sat"),
    target_lang: str = Form("eng")
):
    """
    Receives an audio file (WAV, MP3, OGG, M4A, etc.), runs preprocessing,
    VAD segmentation, and neural Santali IndicConformer / Faster-Whisper transcription.
    """
    # Phase 1 Scope Check: explicitly reject Mundari and Ho
    if source_lang.lower() in ["unr", "mundari"]:
        raise HTTPException(
            status_code=400,
            detail="Mundari ASR is scheduled for Phase 2. This phase supports Santali (sat)."
        )
    if source_lang.lower() in ["hoc", "ho"]:
        raise HTTPException(
            status_code=400,
            detail="Ho ASR is scheduled for Phase 3. This phase supports Santali (sat)."
        )

    try:
        audio_bytes = await file.read()
        if not audio_bytes or len(audio_bytes) < 100:
            raise HTTPException(status_code=400, detail="Uploaded audio file is empty or corrupted.")

        # Preprocess: decode, convert to mono, resample to 16kHz, normalize
        audio_array, duration_sec = preprocess_audio_pipeline(audio_bytes)

        if duration_sec < 0.2:
            engine = asr_router.get_engine(source_lang) or asr_router.get_engine("sat")
            return {
                "text": "",
                "language": source_lang,
                "duration_sec": round(duration_sec, 3),
                "processing_time_ms": 0.0,
                "real_time_factor": 0.0,
                "model_name": engine.engine_name if engine else "Unavailable",
                "segments": [],
                "asr_confidence": None,
                "needs_review": True,
                "status": "empty_speech",
                "message": "No speech detected in the audio file."
            }

        # Transcribe via neural engine
        asr_res = asr_router.transcribe(audio_array, sample_rate=TARGET_SAMPLE_RATE, language=source_lang)

        segments_payload = [
            {
                "id": s.id,
                "start_sec": s.start_sec,
                "end_sec": s.end_sec,
                "text": s.text,
                "speaker": s.speaker,
                "asr_confidence": s.asr_confidence,
                "needs_review": s.needs_review
            }
            for s in asr_res.segments
        ]

        return {
            "text": asr_res.text,
            "language": asr_res.language,
            "duration_sec": asr_res.duration_sec,
            "processing_time_ms": asr_res.processing_time_ms,
            "real_time_factor": asr_res.real_time_factor,
            "model_name": asr_res.model_name,
            "segments": segments_payload,
            "asr_confidence": asr_res.asr_confidence,
            "needs_review": asr_res.needs_review,
            "status": asr_res.status,
            "error_message": asr_res.error_message
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ASR processing error: {str(e)}"
        )


@router.websocket("/stream")
async def websocket_asr_stream(websocket: WebSocket):
    """
    WebSocket endpoint for real-time microphone audio chunk streaming.

    DUAL-BUFFER ARCHITECTURE (fixes the "Good morning, good morning" duplication bug):

    - finalize_buffer: Accumulates ALL speech-only PCM sent by the client.
      The frontend (audioPipeline.ts) now sends ONLY frames where VAD detects active
      speech, so this buffer contains a clean utterance recording with no silence padding.
      Used exclusively for the final, authoritative ASR transcription call.

    - interim_ring: A rolling ring of the LAST 3 seconds of audio.
      Interim calls are preview-only and do NOT share data with finalize_buffer.
      Their output is never shown in the conversation history — only in the live
      interim text display.

    Root cause of old bug: the previous single audio_buffer was sliced for both interim
    AND final calls, so the same speech tokens appeared multiple times in the transcript.
    The interim ring is now SEPARATE and DISPOSABLE.
    """
    await websocket.accept()

    # finalize_buffer: used only for the final ASR call at turn end
    finalize_buffer = bytearray()

    # interim_ring: rolling 3-second window for live preview only
    INTERIM_RING_BYTES = TARGET_SAMPLE_RATE * 2 * 3  # 3s × 16kHz × 2 bytes/sample
    interim_ring = bytearray()

    last_interim_time = 0.0
    lang = websocket.query_params.get("lang", "sat").lower()
    client_sr = int(websocket.query_params.get("sample_rate", TARGET_SAMPLE_RATE))
    current_turn_id = websocket.query_params.get("turnId") or websocket.query_params.get("turn_id")

    engine = asr_router.get_engine(lang) or asr_router.get_engine("sat")
    if engine is None:
        await websocket.close(code=1011, reason=f"ASR engine for '{lang}' unavailable")
        return

    # Hard cap: 120 seconds of 16 kHz int16 audio = 3.84 MB
    MAX_FINALIZE_BYTES = TARGET_SAMPLE_RATE * 2 * 120
    # Minimum 100ms of speech needed for a meaningful transcription
    MIN_FINALIZE_BYTES = TARGET_SAMPLE_RATE * 2 // 10
    # Minimum 300ms audio required before first interim hypothesis
    MIN_INTERIM_BYTES = int(TARGET_SAMPLE_RATE * 2 * 0.3)

    is_interim_in_flight = False
    is_finalized = False
    active_interim_task = None

    async def run_interim_inference(audio_snapshot: bytes, turn_id: str):
        nonlocal is_interim_in_flight
        try:
            interim_np = np.frombuffer(audio_snapshot, dtype=np.int16).astype(np.float32) / 32768.0
            if client_sr != TARGET_SAMPLE_RATE and len(interim_np) > 0:
                interim_np = resample_audio(interim_np, orig_sr=client_sr, target_sr=TARGET_SAMPLE_RATE)
            if len(interim_np) > 0:
                # Use beam_size=1 for interim preview (ultra-low CPU latency, typing-like live updates)
                res = await asyncio.to_thread(
                    engine.transcribe, interim_np,
                    sample_rate=TARGET_SAMPLE_RATE, language=lang, beam_size=1
                )
                if res.text and not is_finalized:
                    await websocket.send_json({
                        "type": "interim",
                        "turnId": turn_id,
                        "text": res.text,
                        "is_final": False
                    })
        except Exception:
            pass  # Interim failures are silent — finalize is authoritative
        finally:
            is_interim_in_flight = False

    try:
        while True:
            message = await websocket.receive()

            if "bytes" in message and message["bytes"]:
                chunk = message["bytes"]
                is_finalized = False

                # ── finalize_buffer: accumulate speech (capped at 120s) ──────────────
                if len(finalize_buffer) + len(chunk) <= MAX_FINALIZE_BYTES:
                    finalize_buffer.extend(chunk)
                else:
                    excess = len(finalize_buffer) + len(chunk) - MAX_FINALIZE_BYTES
                    del finalize_buffer[:excess]
                    finalize_buffer.extend(chunk)

                # ── interim_ring: rolling 3-second ring for preview only ─────────────
                interim_ring.extend(chunk)
                if len(interim_ring) > INTERIM_RING_BYTES:
                    del interim_ring[:len(interim_ring) - INTERIM_RING_BYTES]

                # ── Emit interim hypothesis asynchronously without blocking receive loop ─
                now = time.perf_counter()
                if (
                    not is_interim_in_flight
                    and len(interim_ring) >= MIN_INTERIM_BYTES
                    and (now - last_interim_time) >= 0.35
                ):
                    last_interim_time = now
                    is_interim_in_flight = True
                    active_interim_task = asyncio.create_task(
                        run_interim_inference(bytes(interim_ring), current_turn_id)
                    )

            elif "text" in message:
                try:
                    data = json.loads(message["text"])
                except Exception:
                    data = {}

                action = data.get("action")

                if action == "finalize":
                    is_finalized = True
                    turn_id = data.get("turnId") or current_turn_id

                    # Cancel any active background interim task
                    if active_interim_task and not active_interim_task.done():
                        active_interim_task.cancel()

                    if len(finalize_buffer) > MIN_FINALIZE_BYTES:
                        try:
                            final_np = np.frombuffer(bytes(finalize_buffer), dtype=np.int16).astype(np.float32) / 32768.0
                            if client_sr != TARGET_SAMPLE_RATE and len(final_np) > 0:
                                final_np = resample_audio(final_np, orig_sr=client_sr, target_sr=TARGET_SAMPLE_RATE)

                            # Offload to thread pool with full beam_size=5 for authoritative final transcript
                            res = await asyncio.to_thread(
                                engine.transcribe, final_np,
                                sample_rate=TARGET_SAMPLE_RATE, language=lang, beam_size=5
                            )
                            await websocket.send_json({
                                "type": "final",
                                "turnId": turn_id,
                                "text": res.text,
                                "language": res.language,
                                "duration_sec": res.duration_sec,
                                "processing_time_ms": res.processing_time_ms,
                                "real_time_factor": res.real_time_factor,
                                "asr_confidence": res.asr_confidence,
                                "segments": [
                                    {
                                        "id": s.id,
                                        "start_sec": s.start_sec,
                                        "end_sec": s.end_sec,
                                        "text": s.text,
                                        "asr_confidence": s.asr_confidence,
                                        "needs_review": s.needs_review
                                    }
                                    for s in res.segments
                                ],
                                "is_final": True
                            })
                        except Exception as e:
                            await websocket.send_json({
                                "type": "error",
                                "turnId": turn_id,
                                "message": f"Finalization error: {str(e)}"
                            })
                    else:
                        # No usable audio — return empty final so the turn can complete cleanly
                        await websocket.send_json({
                            "type": "final",
                            "turnId": turn_id,
                            "text": "",
                            "language": lang,
                            "duration_sec": 0.0,
                            "processing_time_ms": 0.0,
                            "real_time_factor": 0.0,
                            "asr_confidence": 0.0,
                            "segments": [],
                            "is_final": True
                        })

                    # Always clear both buffers after finalization so the next turn starts clean
                    finalize_buffer.clear()
                    interim_ring.clear()
                    last_interim_time = 0.0
                    is_interim_in_flight = False

                elif action == "reset":
                    is_finalized = True
                    if active_interim_task and not active_interim_task.done():
                        active_interim_task.cancel()
                    finalize_buffer.clear()
                    interim_ring.clear()
                    last_interim_time = 0.0
                    is_interim_in_flight = False

    except WebSocketDisconnect:
        pass
    except (ConnectionResetError, BrokenPipeError):
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
    finally:
        finalize_buffer.clear()
        interim_ring.clear()
