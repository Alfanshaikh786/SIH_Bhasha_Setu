"""
Audio Robustness & Adaptive Preprocessing Engine for Video Subtitling
Provides:
1. Non-destructive audio quality analysis (SNR, Noise Floor, Clipping, Speech Ratio)
2. Zero-compression Voice Activity Detection (VAD) for noise characterization
3. Gentle speech-band filtering (85 Hz - 7500 Hz Butterworth) and loudness leveling
4. A/B empirical confidence comparison and safe fallback to original audio
"""

import time
import math
import logging
from dataclasses import dataclass
from typing import Tuple, Dict, Any, Optional, List
import numpy as np
import scipy.signal as signal

from server.asr.base import ASRResult

logger = logging.getLogger("bhasha_audio_robustness")
if not logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("[%(asctime)s] [%(levelname)s] [AudioRobustness] %(message)s"))
    logger.addHandler(_handler)
    logger.setLevel(logging.INFO)


@dataclass
class AudioQualityMetrics:
    rms_energy: float
    noise_floor: float
    snr_db: float
    clipping_ratio: float
    speech_ratio: float
    classification: str  # "CLEAN", "MODERATE_NOISE", "HIGH_NOISE"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rms_energy": round(self.rms_energy, 4),
            "noise_floor": round(self.noise_floor, 4),
            "snr_db": round(self.snr_db, 2),
            "clipping_ratio": round(self.clipping_ratio, 4),
            "speech_ratio": round(self.speech_ratio, 3),
            "classification": self.classification
        }


def detect_speech_activity_vad(
    audio_data: np.ndarray,
    sample_rate: int = 16000,
    frame_duration_ms: int = 20,
    hop_duration_ms: int = 10
) -> Tuple[np.ndarray, float]:
    """
    Computes frame-level Voice Activity Detection (VAD) using Short-Time Energy (STE)
    and Zero-Crossing Rate (ZCR).

    CRITICAL INVARIANT:
    Does NOT compress or alter the audio timeline.
    Returns:
        (speech_mask, speech_ratio)
    """
    if len(audio_data) == 0:
        return np.array([], dtype=bool), 0.0

    frame_size = int(sample_rate * (frame_duration_ms / 1000.0))
    hop_size = int(sample_rate * (hop_duration_ms / 1000.0))

    if len(audio_data) < frame_size:
        return np.array([True], dtype=bool), 1.0

    num_frames = 1 + (len(audio_data) - frame_size) // hop_size
    frame_energies = np.zeros(num_frames, dtype=np.float32)

    for i in range(num_frames):
        start = i * hop_size
        frame = audio_data[start:start + frame_size]
        frame_energies[i] = np.mean(frame ** 2)

    max_energy = float(np.max(frame_energies))
    if max_energy < 1e-6:
        return np.zeros(num_frames, dtype=bool), 0.0

    # Estimate noise floor from lower 15th percentile of all frame energies
    noise_floor = float(np.percentile(frame_energies, 15))

    # Adaptive speech threshold: must be above noise floor and scaled to peak speech energy
    speech_threshold = max(noise_floor * 2.5, max_energy * 0.02, 1e-4)
    speech_threshold = min(speech_threshold, max_energy * 0.3)

    speech_mask = frame_energies > speech_threshold
    speech_ratio = float(np.mean(speech_mask))

    return speech_mask, round(speech_ratio, 3)


def analyze_audio_quality(
    audio_data: np.ndarray,
    sample_rate: int = 16000
) -> AudioQualityMetrics:
    """
    Analyzes raw audio signal to determine acoustic conditions and noise characteristics.
    """
    if len(audio_data) == 0:
        return AudioQualityMetrics(
            rms_energy=0.0,
            noise_floor=0.0,
            snr_db=0.0,
            clipping_ratio=0.0,
            speech_ratio=0.0,
            classification="CLEAN"
        )

    # Convert to float32 normalized
    if audio_data.dtype != np.float32:
        data = audio_data.astype(np.float32)
    else:
        data = audio_data

    # 1. RMS Energy
    rms = float(np.sqrt(np.mean(data ** 2)))

    # 2. Clipping Ratio (|x| > 0.99)
    clipping_count = np.sum(np.abs(data) >= 0.99)
    clipping_ratio = float(clipping_count / len(data))

    # 3. VAD and Speech Ratio
    _, speech_ratio = detect_speech_activity_vad(data, sample_rate)

    # 4. Frame-based noise floor
    frame_size = int(sample_rate * 0.02)
    hop_size = int(sample_rate * 0.01)
    if len(data) >= frame_size:
        num_frames = 1 + (len(data) - frame_size) // hop_size
        energies = [np.mean(data[i * hop_size:i * hop_size + frame_size] ** 2) for i in range(num_frames)]
        noise_floor_energy = float(np.percentile(energies, 10))
        noise_floor = float(np.sqrt(max(1e-9, noise_floor_energy)))
    else:
        noise_floor = 1e-4

    # 5. Estimated SNR in dB
    if noise_floor > 1e-7:
        snr_db = float(20.0 * np.log10(max(rms, 1e-6) / noise_floor))
    else:
        snr_db = 35.0  # Essentially silent noise floor

    # 6. Classification
    if snr_db >= 22.0:
        classification = "CLEAN"
    elif snr_db >= 10.0:
        classification = "MODERATE_NOISE"
    else:
        classification = "HIGH_NOISE"

    return AudioQualityMetrics(
        rms_energy=rms,
        noise_floor=noise_floor,
        snr_db=snr_db,
        clipping_ratio=clipping_ratio,
        speech_ratio=speech_ratio,
        classification=classification
    )


def preprocess_audio_for_asr(
    audio_data: np.ndarray,
    sample_rate: int = 16000,
    classification: str = "MODERATE_NOISE"
) -> np.ndarray:
    """
    Applies gentle, non-destructive speech-band filtering and leveling:
    1. 85 Hz Butterworth Highpass: Eliminates wind thumps, handling rumble, sub-bass AC hum.
    2. 7500 Hz Butterworth Lowpass: Eliminates ultrasonic hiss and high-frequency noise.
    3. Peak / RMS Leveling: Normalizes quiet speakers so ASR acoustic models receive clear signal.
    4. Gentle Wiener smoothing only for HIGH_NOISE conditions.
    """
    if len(audio_data) == 0:
        return audio_data

    # Ensure float32
    if audio_data.dtype != np.float32:
        data = audio_data.astype(np.float32)
    else:
        data = audio_data.copy()

    # Step 1: 2nd-order Butterworth speech bandpass (85 Hz - 7500 Hz)
    try:
        nyquist = sample_rate / 2.0
        low_cut = max(20.0, 85.0) / nyquist
        high_cut = min(nyquist - 100.0, 7500.0) / nyquist
        sos = signal.butter(2, [low_cut, high_cut], btype="bandpass", output="sos")
        filtered = signal.sosfiltfilt(sos, data).astype(np.float32)
    except Exception as e:
        logger.warning(f"Bandpass filter failed: {e}, using unfiltered data")
        filtered = data

    # Step 2: Gentle smoothing for very noisy audio (blended at 60% filtered / 40% smoothed)
    if classification == "HIGH_NOISE" and len(filtered) > 10:
        try:
            smoothed = signal.wiener(filtered, mysize=5).astype(np.float32)
            filtered = 0.6 * filtered + 0.4 * smoothed
        except Exception:
            pass

    # Step 3: Loudness leveling for quiet recordings
    peak = float(np.max(np.abs(filtered)))
    if peak > 1e-4 and peak < 0.25:
        # Boost quiet speech gently to target peak ~0.70 (never exceed 0.95 to avoid digital clipping)
        gain = min(3.5, 0.70 / peak)
        filtered = filtered * gain
    elif peak >= 0.95:
        # Tame clipping peaks
        filtered = filtered * (0.90 / peak)

    return np.ascontiguousarray(filtered, dtype=np.float32)


def transcribe_with_robustness(
    audio_data: np.ndarray,
    sample_rate: int,
    language: str,
    asr_router_instance: Any
) -> Tuple[ASRResult, Dict[str, Any]]:
    """
    Executes adaptive transcription with real-world noise robustness:
    1. Analyzes audio quality.
    2. CLEAN audio: bypasses filtering directly (zero degradation risk).
    3. NOISY audio: executes A/B comparison between original audio and preprocessed audio.
    4. Selects the result with higher acoustic confidence without segment loss.
    5. Automatic fallback to original audio if preprocessing throws any error.
    """
    start_time = time.perf_counter()
    metrics = analyze_audio_quality(audio_data, sample_rate)

    # Strategy 1: CLEAN AUDIO -> Bypass preprocessing completely
    if metrics.classification == "CLEAN":
        logger.info(f"Audio classified as CLEAN (SNR={metrics.snr_db:.1f}dB). Bypassing preprocessing.")
        res = asr_router_instance.transcribe(audio_data, sample_rate=sample_rate, language=language)
        meta = {
            "strategy": "bypassed_clean",
            "metrics": metrics.to_dict(),
            "winner": "original",
            "preprocessing_ms": round((time.perf_counter() - start_time) * 1000, 2)
        }
        return res, meta

    # Strategy 2: NOISY AUDIO -> A/B Comparison with safe fallback
    logger.info(f"Audio classified as {metrics.classification} (SNR={metrics.snr_db:.1f}dB). Executing A/B robustness check.")

    # Run A: Baseline on original audio
    t_a0 = time.perf_counter()
    res_a = asr_router_instance.transcribe(audio_data, sample_rate=sample_rate, language=language)
    time_a_ms = (time.perf_counter() - t_a0) * 1000

    # If original ASR failed outright, return it
    if res_a.status != "success":
        return res_a, {
            "strategy": "original_failed",
            "metrics": metrics.to_dict(),
            "winner": "original",
            "preprocessing_ms": 0.0
        }

    # Attempt Preprocessing & Run B
    try:
        t_p0 = time.perf_counter()
        preprocessed_data = preprocess_audio_for_asr(
            audio_data,
            sample_rate=sample_rate,
            classification=metrics.classification
        )
        prep_time_ms = (time.perf_counter() - t_p0) * 1000

        t_b0 = time.perf_counter()
        res_b = asr_router_instance.transcribe(preprocessed_data, sample_rate=sample_rate, language=language)
        time_b_ms = (time.perf_counter() - t_b0) * 1000

        # Calculate mean confidence for A vs B
        conf_a_list = [s.asr_confidence for s in res_a.segments if s.asr_confidence is not None]
        conf_b_list = [s.asr_confidence for s in res_b.segments if s.asr_confidence is not None]

        mean_conf_a = float(np.mean(conf_a_list)) if conf_a_list else 0.0
        mean_conf_b = float(np.mean(conf_b_list)) if conf_b_list else 0.0

        # Quality Comparison Rule:
        # Preprocessing wins ONLY if:
        # 1. Preprocessed ASR succeeded
        # 2. Did not lose valid speech segments (len(b) >= len(a))
        # 3. Confidence improved or equal (within margin)
        b_won = (
            res_b.status == "success"
            and len(res_b.segments) >= len(res_a.segments)
            and mean_conf_b >= mean_conf_a - 0.02
            and (mean_conf_b > mean_conf_a or len(res_b.text) >= len(res_a.text))
        )

        winner = "preprocessed" if b_won else "original"
        selected_res = res_b if b_won else res_a

        logger.info(
            f"A/B Comparison: Original Conf={mean_conf_a:.3f} ({len(res_a.segments)} segs) vs "
            f"Preprocessed Conf={mean_conf_b:.3f} ({len(res_b.segments)} segs) -> Winner: {winner}"
        )

        meta = {
            "strategy": "ab_evaluated",
            "metrics": metrics.to_dict(),
            "winner": winner,
            "conf_original": round(mean_conf_a, 3),
            "conf_preprocessed": round(mean_conf_b, 3),
            "preprocessing_ms": round(prep_time_ms, 2),
            "total_ab_ms": round((time.perf_counter() - start_time) * 1000, 2)
        }
        return selected_res, meta

    except Exception as exc:
        logger.warning(f"Audio preprocessing failed with exception: {exc}. Safely falling back to original audio.")
        meta = {
            "strategy": "fallback_error",
            "metrics": metrics.to_dict(),
            "winner": "original",
            "error": str(exc),
            "preprocessing_ms": 0.0
        }
        return res_a, meta
