"""
Audio Preprocessing, Resampling, Normalization, and VAD for Bhasha Setu ASR
"""

import io
from typing import List, Tuple
import numpy as np
import soundfile as sf
from scipy import signal


TARGET_SAMPLE_RATE = 16000


def load_audio_from_bytes(audio_bytes: bytes) -> Tuple[np.ndarray, int]:
    """
    Decodes audio bytes (WAV, OGG, FLAC, etc.) into float32 numpy array and sample rate.
    """
    bio = io.BytesIO(audio_bytes)
    try:
        data, sr = sf.read(bio, dtype="float32")
        return data, sr
    except Exception as e:
        # Fallback for raw PCM 16-bit little-endian
        try:
            raw_data = np.frombuffer(audio_bytes, dtype=np.int16)
            float_data = raw_data.astype(np.float32) / 32768.0
            return float_data, TARGET_SAMPLE_RATE
        except Exception:
            raise ValueError(f"Unable to decode audio data: {e}")


def convert_to_mono(audio: np.ndarray) -> np.ndarray:
    """
    Converts multi-channel audio to single-channel (mono) by averaging channels.
    """
    if audio.ndim == 1:
        return audio
    elif audio.ndim == 2:
        return np.mean(audio, axis=1)
    else:
        raise ValueError(f"Unsupported audio dimension: {audio.ndim}")


def resample_audio(audio: np.ndarray, orig_sr: int, target_sr: int = TARGET_SAMPLE_RATE) -> np.ndarray:
    """
    Resamples 1D audio array from orig_sr to target_sr using polyphase filtering.
    """
    if orig_sr == target_sr:
        return audio
    if len(audio) == 0:
        return audio

    num_target_samples = int(round(len(audio) * float(target_sr) / float(orig_sr)))
    resampled = signal.resample(audio, num_target_samples)
    return resampled.astype(np.float32)


def normalize_amplitude(audio: np.ndarray, target_peak: float = 0.95) -> np.ndarray:
    """
    Normalizes audio waveform amplitude to target_peak (default: 0.95).
    Guards against division by zero for silent signals.
    """
    if len(audio) == 0:
        return audio
    max_val = np.max(np.abs(audio))
    if max_val > 1e-6:
        return (audio / max_val) * target_peak
    return audio


def preprocess_audio_pipeline(audio_bytes: bytes) -> Tuple[np.ndarray, float]:
    """
    Full standard audio preprocessing pipeline:
    1. Decode bytes to float32
    2. Convert stereo to mono
    3. Resample to 16,000 Hz
    4. Normalize amplitude
    Returns (preprocessed_1d_array, duration_seconds)
    """
    raw_audio, orig_sr = load_audio_from_bytes(audio_bytes)
    mono_audio = convert_to_mono(raw_audio)
    resampled_audio = resample_audio(mono_audio, orig_sr, TARGET_SAMPLE_RATE)
    normalized_audio = normalize_amplitude(resampled_audio)
    duration_sec = len(normalized_audio) / float(TARGET_SAMPLE_RATE)
    return normalized_audio, duration_sec


def energy_vad_segmentation(
    audio: np.ndarray,
    sr: int = TARGET_SAMPLE_RATE,
    frame_duration_ms: int = 30,
    energy_threshold: float = 0.015,
    min_speech_duration_ms: int = 250,
    min_silence_duration_ms: int = 300
) -> List[Tuple[float, float, np.ndarray]]:
    """
    Segments continuous audio into discrete speech chunks using energy-based Voice Activity Detection (VAD).
    Returns list of tuples: (start_sec, end_sec, chunk_audio)
    """
    if len(audio) == 0:
        return []

    frame_size = int(sr * (frame_duration_ms / 1000.0))
    if frame_size <= 0:
        return [(0.0, len(audio) / sr, audio)]

    num_frames = len(audio) // frame_size
    if num_frames == 0:
        return [(0.0, len(audio) / sr, audio)]

    # Compute short-term root-mean-square (RMS) energy per frame
    energies = np.array([
        np.sqrt(np.mean(audio[i * frame_size : (i + 1) * frame_size] ** 2))
        for i in range(num_frames)
    ])

    # Dynamic threshold if audio is quiet
    adaptive_thresh = max(energy_threshold, np.percentile(energies, 35) * 1.5)
    is_speech = energies > adaptive_thresh

    segments = []
    in_speech = False
    start_frame = 0
    silence_counter = 0
    min_silence_frames = max(1, int(min_silence_duration_ms / frame_duration_ms))
    min_speech_frames = max(1, int(min_speech_duration_ms / frame_duration_ms))

    for idx, speech in enumerate(is_speech):
        if speech:
            if not in_speech:
                in_speech = True
                start_frame = max(0, idx - 1)  # small pre-roll padding
            silence_counter = 0
        else:
            if in_speech:
                silence_counter += 1
                if silence_counter >= min_silence_frames:
                    end_frame = min(num_frames, idx - min_silence_frames + 2)
                    if (end_frame - start_frame) >= min_speech_frames:
                        start_sample = start_frame * frame_size
                        end_sample = min(len(audio), end_frame * frame_size)
                        segments.append((
                            start_sample / sr,
                            end_sample / sr,
                            audio[start_sample:end_sample]
                        ))
                    in_speech = False
                    silence_counter = 0

    # Final trailing segment
    if in_speech:
        end_frame = num_frames
        if (end_frame - start_frame) >= min_speech_frames:
            start_sample = start_frame * frame_size
            end_sample = len(audio)
            segments.append((
                start_sample / sr,
                end_sample / sr,
                audio[start_sample:end_sample]
            ))

    # If no voice activity detected above threshold, treat whole audio as single segment
    if not segments:
        segments.append((0.0, len(audio) / sr, audio))

    return segments
