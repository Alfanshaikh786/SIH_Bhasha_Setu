"""
FastAPI REST & WebSocket Endpoints for Neural ASR (Santali IndicConformer)
"""

import io
import json
import time
from typing import Optional
from fastapi import APIRouter, File, Form, UploadFile, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import numpy as np

from server.asr.router import asr_router
from server.audio.preprocessing import preprocess_audio_pipeline, load_audio_from_bytes, TARGET_SAMPLE_RATE


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
        supported_languages=["sat"],
        model_name="ai4bharat/indicconformer_stt_sat_hybrid_ctc_rnnt_large (ONNX int8)",
        script="Ol Chiki (U+1C50–U+1C7F)",
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
    VAD segmentation, and neural Santali IndicConformer transcription.
    """
    start_time = time.perf_counter()

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
            return {
                "text": "",
                "language": source_lang,
                "duration_sec": round(duration_sec, 3),
                "processing_time_ms": 0.0,
                "real_time_factor": 0.0,
                "model_name": asr_router.get_engine("sat").engine_name,
                "segments": [],
                "asr_confidence": None,
                "needs_review": True,
                "status": "empty_speech",
                "message": "No speech detected in the audio file."
            }

        # Transcribe via neural engine
        asr_res = asr_router.transcribe(audio_array, sample_rate=TARGET_SAMPLE_RATE, language=source_lang)

        # Convert dataclasses to dict
        segments_payload = []
        for s in asr_res.segments:
            segments_payload.append({
                "id": s.id,
                "start_sec": s.start_sec,
                "end_sec": s.end_sec,
                "text": s.text,
                "speaker": s.speaker,
                "asr_confidence": s.asr_confidence,
                "needs_review": s.needs_review
            })

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
    Accepts raw PCM or WebM chunks and emits interim and finalized transcripts.
    """
    await websocket.accept()
    audio_buffer = bytearray()
    engine = asr_router.get_engine("sat")

    try:
        while True:
            message = await websocket.receive()
            if "bytes" in message and message["bytes"]:
                chunk = message["bytes"]
                audio_buffer.extend(chunk)

                # Process every ~0.8s of 16kHz 16-bit mono audio (25,600 bytes)
                if len(audio_buffer) >= 25600:
                    try:
                        raw_np = np.frombuffer(audio_buffer, dtype=np.int16).astype(np.float32) / 32768.0
                        if np.max(np.abs(raw_np)) > 0.02:
                            # Quick recognition on accumulated buffer
                            res = engine.transcribe(raw_np, sample_rate=16000, language="sat")
                            if res.text:
                                await websocket.send_json({
                                    "type": "interim",
                                    "text": res.text,
                                    "is_final": False
                                })
                    except Exception:
                        pass

            elif "text" in message:
                data = json.loads(message["text"])
                if data.get("action") == "finalize":
                    if len(audio_buffer) > 3200:  # at least 100ms
                        try:
                            raw_np = np.frombuffer(audio_buffer, dtype=np.int16).astype(np.float32) / 32768.0
                            res = engine.transcribe(raw_np, sample_rate=16000, language="sat")
                            await websocket.send_json({
                                "type": "final",
                                "text": res.text,
                                "duration_sec": res.duration_sec,
                                "processing_time_ms": res.processing_time_ms,
                                "real_time_factor": res.real_time_factor,
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
                                "message": str(e)
                            })
                    audio_buffer.clear()

                elif data.get("action") == "reset":
                    audio_buffer.clear()

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
