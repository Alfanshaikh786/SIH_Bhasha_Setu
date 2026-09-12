/**
 * Bhasha Setu — Phase 6: Audio Format & Normalization Contract
 * 
 * Provides verification, decoding, and normalization for neural speech output.
 * Ensures all neural models conform to the PCM16 / WAV contract with verified
 * sample rates, bit depth, channel configuration, and zero digital clipping.
 */

import { AudioValidationResult } from './types';

export class TTSAudioNormalizer {
  /**
   * Validates a WAV audio buffer against production acoustic standards.
   */
  public static validateWavHeader(buffer: Uint8Array): AudioValidationResult {
    const errors: string[] = [];

    if (!buffer || buffer.length < 44) {
      return {
        isValid: false,
        sampleRate: 0,
        channels: 0,
        bitDepth: 0,
        durationSeconds: 0,
        hasClipping: false,
        isSilent: true,
        errors: ['Buffer too small to contain valid 44-byte WAV header']
      };
    }

    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    // 1. Check RIFF chunk
    const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    if (riff !== 'RIFF') {
      errors.push(`Invalid RIFF header identifier: expected 'RIFF', got '${riff}'`);
    }

    // 2. Check WAVE format
    const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
    if (wave !== 'WAVE') {
      errors.push(`Invalid WAVE format identifier: expected 'WAVE', got '${wave}'`);
    }

    // 3. Find 'fmt ' subchunk
    let offset = 12;
    let format = 0;
    let channels = 0;
    let sampleRate = 0;
    let bitDepth = 0;
    let dataOffset = 0;
    let dataSize = 0;

    while (offset < buffer.length - 8) {
      const chunkId = String.fromCharCode(
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3)
      );
      const chunkSize = view.getUint32(offset + 4, true);

      if (chunkId === 'fmt ') {
        format = view.getUint16(offset + 8, true);
        channels = view.getUint16(offset + 10, true);
        sampleRate = view.getUint32(offset + 12, true);
        bitDepth = view.getUint16(offset + 22, true);
      } else if (chunkId === 'data') {
        dataOffset = offset + 8;
        dataSize = chunkSize;
        break;
      }
      offset += 8 + chunkSize;
    }

    if (format !== 1) {
      errors.push(`Unsupported audio format code ${format}; only linear PCM (1) supported`);
    }
    if (channels !== 1 && channels !== 2) {
      errors.push(`Invalid channel count: expected mono (1) or stereo (2), got ${channels}`);
    }
    if (bitDepth !== 16 && bitDepth !== 24 && bitDepth !== 32) {
      errors.push(`Unsupported bit depth: expected 16, 24, or 32-bit, got ${bitDepth}`);
    }

    // Duration calculation
    const bytesPerSample = (bitDepth / 8) * channels;
    const totalSamples = bytesPerSample > 0 ? dataSize / bytesPerSample : 0;
    const durationSeconds = sampleRate > 0 ? totalSamples / sampleRate : 0;

    // Check clipping & silence on PCM16 samples
    let hasClipping = false;
    let isSilent = true;
    let sumSquares = 0;
    let sampleCount = 0;

    if (bitDepth === 16 && dataOffset > 0 && dataOffset < buffer.length) {
      const sampleCountMax = Math.min(Math.floor((buffer.length - dataOffset) / 2), 50000); // Sample up to 50k samples
      for (let i = 0; i < sampleCountMax; i++) {
        const sample = view.getInt16(dataOffset + i * 2, true);
        if (sample >= 32760 || sample <= -32760) {
          hasClipping = true;
        }
        sumSquares += (sample / 32768) * (sample / 32768);
        sampleCount++;
      }
      const rms = sampleCount > 0 ? Math.sqrt(sumSquares / sampleCount) : 0;
      if (rms > 0.005) {
        isSilent = false;
      }
    } else {
      isSilent = false;
    }

    if (hasClipping) {
      errors.push('Digital clipping detected in audio samples (exceeding -0.01 dBFS)');
    }

    return {
      isValid: errors.length === 0,
      sampleRate,
      channels,
      bitDepth,
      durationSeconds: parseFloat(durationSeconds.toFixed(3)),
      hasClipping,
      isSilent,
      errors
    };
  }

  /**
   * Constructs a standard 44-byte PCM WAV header for raw PCM16 samples.
   */
  public static createPcmWav(
    pcm16Data: Int16Array,
    sampleRate: number = 22050,
    channels: number = 1
  ): Uint8Array {
    const bytesPerSample = 2;
    const blockAlign = channels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcm16Data.length * bytesPerSample;
    const bufferSize = 44 + dataSize;

    const buffer = new Uint8Array(bufferSize);
    const view = new DataView(buffer.buffer);

    // RIFF identifier
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');

    // fmt subchunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);          // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true);           // AudioFormat (1 = PCM)
    view.setUint16(22, channels, true);    // NumChannels
    view.setUint32(24, sampleRate, true);  // SampleRate
    view.setUint32(28, byteRate, true);    // ByteRate
    view.setUint16(32, blockAlign, true);  // BlockAlign
    view.setUint16(34, 16, true);          // BitsPerSample (16 bits)

    // data subchunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Copy PCM16 samples
    for (let i = 0; i < pcm16Data.length; i++) {
      view.setInt16(44 + i * 2, pcm16Data[i], true);
    }

    return buffer;
  }

  /**
   * Resamples PCM16 audio using high-precision linear interpolation.
   */
  public static resamplePcm16(
    input: Int16Array,
    fromRate: number,
    toRate: number
  ): Int16Array {
    if (fromRate === toRate || input.length === 0) {
      return new Int16Array(input);
    }

    const ratio = fromRate / toRate;
    const newLength = Math.round(input.length / ratio);
    const output = new Int16Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const srcPos = i * ratio;
      const srcIndex = Math.floor(srcPos);
      const frac = srcPos - srcIndex;

      if (srcIndex + 1 < input.length) {
        const s0 = input[srcIndex];
        const s1 = input[srcIndex + 1];
        output[i] = Math.round(s0 + frac * (s1 - s0));
      } else {
        output[i] = input[Math.min(srcIndex, input.length - 1)];
      }
    }

    return output;
  }

  /**
   * Peak-normalizes PCM16 audio to a safe headroom (default -0.5 dBFS / 0.95).
   */
  public static peakNormalize(
    input: Int16Array,
    targetPeak: number = 0.95
  ): Int16Array {
    let maxAmp = 0;
    for (let i = 0; i < input.length; i++) {
      const abs = Math.abs(input[i]);
      if (abs > maxAmp) maxAmp = abs;
    }

    if (maxAmp === 0) return new Int16Array(input);

    const targetMax = Math.round(targetPeak * 32767);
    const scale = targetMax / maxAmp;

    // If already safely below peak without clipping, preserve original
    if (scale >= 0.95 && scale <= 1.05) {
      return new Int16Array(input);
    }

    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      output[i] = Math.max(-32768, Math.min(32767, Math.round(input[i] * scale)));
    }
    return output;
  }

  private static writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }
}
