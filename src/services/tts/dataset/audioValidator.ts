/**
 * Bhasha Setu — Phase 8: Robust RIFF/WAVE Parser & Audio Quality Validator
 *
 * Implements non-destructive RIFF chunk parsing for arbitrary WAV files.
 * Correctly handles:
 * - Standard 44-byte PCM WAV
 * - Extended WAV headers with 'LIST', 'INFO', 'fact', 'JUNK' chunks
 * - Word alignment (padding bytes on odd-sized chunks)
 * - 8-bit, 16-bit, and 24-bit integer PCM formats
 * - Mono and Stereo audio channels
 * - Real-time deterministic quality calculations (RMS, peak, clipping, silence)
 */

import { AudioQualityMetrics, QualityStatus } from './types';

export interface ParsedRiffWav {
  formatTag: number; // 1 = PCM
  formatName: string;
  channels: number;
  sampleRate: number;
  byteRate: number;
  blockAlign: number;
  bitsPerSample: number;
  dataOffset: number;
  dataLength: number;
  totalFileLength: number;
  chunkList: string[];
  hasAdditionalChunks: boolean;
  rawPcmData: Uint8Array;
}

export interface AudioValidationCriteria {
  allowedSampleRates?: number[];
  allowedBitDepths?: number[];
  allowedChannels?: number[];
  minDurationSeconds?: number;
  maxDurationSeconds?: number;
  maxClippingPercentage?: number;
  maxPeakDb?: number;
  minPeakDb?: number;
  maxTrailingSilenceMs?: number;
}

export const DEFAULT_AUDIO_CRITERIA: AudioValidationCriteria = {
  allowedSampleRates: [16000, 22050, 24000, 44100, 48000],
  allowedBitDepths: [16, 24],
  allowedChannels: [1], // Canonical mono for TTS
  minDurationSeconds: 0.5,
  maxDurationSeconds: 20.0,
  maxClippingPercentage: 0.05, // 0.05% max clipping
  maxPeakDb: -0.2, // Must not exceed -0.2 dBFS (prevents inter-sample overs)
  minPeakDb: -26.0, // Must have sufficient acoustic energy
  maxTrailingSilenceMs: 1200
};

export class AudioValidator {
  /**
   * Robust RIFF/WAVE chunk parser.
   * Does NOT assume a fixed 44-byte layout. Traverses all RIFF chunks until EOF.
   */
  public static parseRiffWav(buffer: Uint8Array): ParsedRiffWav {
    if (buffer.length < 12) {
      throw new Error(`Invalid WAV: buffer too small (${buffer.length} bytes; minimum 12 bytes required)`);
    }

    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    // 1. Validate RIFF magic
    const riffHeader = String.fromCharCode(buffer[0], buffer[1], buffer[2], buffer[3]);
    if (riffHeader !== 'RIFF') {
      throw new Error(`Invalid WAV: missing 'RIFF' signature (found '${riffHeader}')`);
    }

    const totalRiffLength = view.getUint32(4, true);

    // 2. Validate WAVE format signature
    const waveHeader = String.fromCharCode(buffer[8], buffer[9], buffer[10], buffer[11]);
    if (waveHeader !== 'WAVE') {
      throw new Error(`Invalid WAV: missing 'WAVE' signature (found '${waveHeader}')`);
    }

    let offset = 12;
    let formatTag = 0;
    let channels = 0;
    let sampleRate = 0;
    let byteRate = 0;
    let blockAlign = 0;
    let bitsPerSample = 0;
    let dataOffset = 0;
    let dataLength = 0;
    const chunkList: string[] = [];

    // 3. Walk all chunks in RIFF container
    while (offset + 8 <= buffer.length) {
      const chunkId = String.fromCharCode(
        buffer[offset],
        buffer[offset + 1],
        buffer[offset + 2],
        buffer[offset + 3]
      );
      const chunkSize = view.getUint32(offset + 4, true);
      chunkList.push(chunkId.trim());

      if (chunkId === 'fmt ') {
        if (chunkSize < 16) {
          throw new Error(`Malformed 'fmt ' chunk: size is ${chunkSize}, expected >= 16`);
        }
        formatTag = view.getUint16(offset + 8, true);
        channels = view.getUint16(offset + 10, true);
        sampleRate = view.getUint32(offset + 12, true);
        byteRate = view.getUint32(offset + 16, true);
        blockAlign = view.getUint16(offset + 20, true);
        bitsPerSample = view.getUint16(offset + 22, true);
      } else if (chunkId === 'data') {
        dataOffset = offset + 8;
        dataLength = Math.min(chunkSize, buffer.length - dataOffset);
      }

      // Word-aligned chunk jump (skip 1 byte padding on odd sizes)
      const paddedSize = chunkSize + (chunkSize % 2);
      offset += 8 + paddedSize;
    }

    if (!chunkList.includes('fmt')) {
      throw new Error(`Invalid WAV: missing 'fmt ' format specification chunk`);
    }
    if (dataOffset === 0) {
      throw new Error(`Invalid WAV: missing 'data' audio sample chunk`);
    }

    const hasAdditionalChunks = chunkList.some(c => c !== 'fmt' && c !== 'data');
    const rawPcmData = buffer.subarray(dataOffset, dataOffset + dataLength);

    return {
      formatTag,
      formatName: formatTag === 1 ? 'PCM' : formatTag === 3 ? 'IEEE_FLOAT' : 'EXTENSIBLE',
      channels,
      sampleRate,
      byteRate,
      blockAlign,
      bitsPerSample,
      dataOffset,
      dataLength,
      totalFileLength: buffer.length,
      chunkList,
      hasAdditionalChunks,
      rawPcmData
    };
  }

  /**
   * Deterministic audio metrics calculation on raw PCM samples.
   */
  public static calculateMetrics(parsed: ParsedRiffWav): AudioQualityMetrics {
    const { channels, sampleRate, bitsPerSample, rawPcmData, chunkList, hasAdditionalChunks } = parsed;
    const bytesPerSample = bitsPerSample / 8;
    const totalSamples = Math.floor(rawPcmData.length / bytesPerSample);
    const monoSamplesCount = Math.floor(totalSamples / channels);
    const durationSeconds = monoSamplesCount / sampleRate;

    if (monoSamplesCount === 0) {
      return {
        durationSeconds: 0,
        sampleRate,
        channels,
        bitDepth: bitsPerSample,
        rmsDb: -96.0,
        peakDb: -96.0,
        clippingPercentage: 0,
        leadingSilenceMs: 0,
        trailingSilenceMs: 0,
        totalSilenceRatio: 1.0,
        noiseFloorDb: -96.0,
        format: parsed.formatName,
        hasAdditionalChunks,
        chunkList
      };
    }

    let sumSquares = 0;
    let maxAbs = 0;
    let clippedCount = 0;

    // Normalization threshold for clipping
    const maxVal = bitsPerSample === 16 ? 32767 : bitsPerSample === 24 ? 8388607 : 127;
    const clipThreshold = maxVal * 0.995;
    const silenceThreshold = maxVal * 0.005; // ~-46 dBFS

    const view = new DataView(rawPcmData.buffer, rawPcmData.byteOffset, rawPcmData.byteLength);

    // Scan mono or average multi-channel
    const sampleValues: number[] = [];
    for (let i = 0; i < monoSamplesCount; i++) {
      let sample = 0;
      const byteIdx = i * channels * bytesPerSample;

      if (bitsPerSample === 16) {
        sample = view.getInt16(byteIdx, true);
      } else if (bitsPerSample === 24) {
        // 24-bit sign extension
        const b0 = rawPcmData[byteIdx];
        const b1 = rawPcmData[byteIdx + 1];
        const b2 = rawPcmData[byteIdx + 2];
        const val = (b2 << 24) | (b1 << 16) | (b0 << 8);
        sample = val >> 8;
      } else if (bitsPerSample === 8) {
        // 8-bit unsigned PCM: 128 is center
        sample = rawPcmData[byteIdx] - 128;
      }

      const abs = Math.abs(sample);
      if (abs > maxAbs) maxAbs = abs;
      if (abs >= clipThreshold) clippedCount++;
      sumSquares += sample * sample;
      sampleValues.push(abs);
    }

    const rms = Math.sqrt(sumSquares / monoSamplesCount);
    const peakDb = maxAbs > 0 ? 20 * Math.log10(maxAbs / maxVal) : -96.0;
    const rmsDb = rms > 0 ? 20 * Math.log10(rms / maxVal) : -96.0;
    const clippingPercentage = (clippedCount / monoSamplesCount) * 100;

    // Silence analysis
    let leadingSilenceSamples = 0;
    for (let i = 0; i < sampleValues.length; i++) {
      if (sampleValues[i] <= silenceThreshold) {
        leadingSilenceSamples++;
      } else {
        break;
      }
    }

    let trailingSilenceSamples = 0;
    for (let i = sampleValues.length - 1; i >= 0; i--) {
      if (sampleValues[i] <= silenceThreshold) {
        trailingSilenceSamples++;
      } else {
        break;
      }
    }

    let totalSilentSamples = 0;
    for (let i = 0; i < sampleValues.length; i++) {
      if (sampleValues[i] <= silenceThreshold) totalSilentSamples++;
    }

    const leadingSilenceMs = (leadingSilenceSamples / sampleRate) * 1000;
    const trailingSilenceMs = (trailingSilenceSamples / sampleRate) * 1000;
    const totalSilenceRatio = totalSilentSamples / monoSamplesCount;

    return {
      durationSeconds,
      sampleRate,
      channels,
      bitDepth: bitsPerSample,
      rmsDb: Math.round(rmsDb * 10) / 10,
      peakDb: Math.round(peakDb * 10) / 10,
      clippingPercentage: Math.round(clippingPercentage * 1000) / 1000,
      leadingSilenceMs: Math.round(leadingSilenceMs),
      trailingSilenceMs: Math.round(trailingSilenceMs),
      totalSilenceRatio: Math.round(totalSilenceRatio * 100) / 100,
      noiseFloorDb: Math.round((rmsDb - 20) * 10) / 10,
      format: parsed.formatName,
      hasAdditionalChunks,
      chunkList
    };
  }

  /**
   * Validate audio against strict criteria.
   */
  public static validate(
    buffer: Uint8Array,
    criteria: AudioValidationCriteria = DEFAULT_AUDIO_CRITERIA
  ): { status: QualityStatus; metrics: AudioQualityMetrics; issues: string[]; warnings: string[] } {
    const issues: string[] = [];
    const warnings: string[] = [];

    let parsed: ParsedRiffWav;
    try {
      parsed = this.parseRiffWav(buffer);
    } catch (e: any) {
      const emptyMetrics: AudioQualityMetrics = {
        durationSeconds: 0,
        sampleRate: 0,
        channels: 0,
        bitDepth: 0,
        rmsDb: -96.0,
        peakDb: -96.0,
        clippingPercentage: 0,
        leadingSilenceMs: 0,
        trailingSilenceMs: 0,
        totalSilenceRatio: 1.0,
        noiseFloorDb: -96.0,
        format: 'INVALID',
        hasAdditionalChunks: false,
        chunkList: []
      };
      return {
        status: 'REJECT',
        metrics: emptyMetrics,
        issues: [`Corrupt or malformed WAV file: ${e.message}`],
        warnings: []
      };
    }

    const c = { ...DEFAULT_AUDIO_CRITERIA, ...criteria };
    const metrics = this.calculateMetrics(parsed);

    // 1. Format check
    if (parsed.formatTag !== 1) {
      issues.push(`Non-PCM format: ${parsed.formatName} (tag ${parsed.formatTag}). Only linear PCM is accepted.`);
    }

    // 2. Sample rate check
    if (c.allowedSampleRates && !c.allowedSampleRates.includes(metrics.sampleRate)) {
      issues.push(
        `Unsupported sample rate: ${metrics.sampleRate} Hz (allowed: ${c.allowedSampleRates.join(', ')} Hz)`
      );
    }

    // 3. Bit depth check
    if (c.allowedBitDepths && !c.allowedBitDepths.includes(metrics.bitDepth)) {
      issues.push(
        `Unsupported bit depth: ${metrics.bitDepth} bit (allowed: ${c.allowedBitDepths.join(', ')} bit)`
      );
    }

    // 4. Channel count check
    if (metrics.channels > 1) {
      warnings.push(`Stereo audio detected (${metrics.channels} channels). Will require downmixing to mono.`);
    }

    // 5. Duration check
    if (c.minDurationSeconds && metrics.durationSeconds < c.minDurationSeconds) {
      issues.push(`Duration too short: ${metrics.durationSeconds.toFixed(2)}s (minimum ${c.minDurationSeconds}s)`);
    }
    if (c.maxDurationSeconds && metrics.durationSeconds > c.maxDurationSeconds) {
      issues.push(`Duration too long: ${metrics.durationSeconds.toFixed(2)}s (maximum ${c.maxDurationSeconds}s)`);
    }

    // 6. Clipping check
    if (c.maxClippingPercentage !== undefined && metrics.clippingPercentage > c.maxClippingPercentage) {
      issues.push(
        `Severe digital clipping detected: ${metrics.clippingPercentage}% (threshold: ${c.maxClippingPercentage}%)`
      );
    }

    // 7. Peak amplitude check
    if (c.maxPeakDb !== undefined && metrics.peakDb > c.maxPeakDb) {
      warnings.push(`Peak level too close to 0 dBFS (${metrics.peakDb} dBFS). Risk of inter-sample distortion.`);
    }
    if (c.minPeakDb !== undefined && metrics.peakDb < c.minPeakDb) {
      issues.push(`Audio level too low: peak ${metrics.peakDb} dBFS (minimum required: ${c.minPeakDb} dBFS)`);
    }

    // 8. Excessive silence check
    if (c.maxTrailingSilenceMs && metrics.trailingSilenceMs > c.maxTrailingSilenceMs) {
      warnings.push(`Excessive trailing silence: ${metrics.trailingSilenceMs}ms (exceeds ${c.maxTrailingSilenceMs}ms)`);
    }

    // Determine status
    let status: QualityStatus = 'PASS';
    if (issues.length > 0) {
      status = 'REJECT';
    } else if (warnings.length > 0) {
      status = 'WARNING';
    }

    return {
      status,
      metrics,
      issues,
      warnings
    };
  }

  /**
   * Helper to synthesize test WAV buffers with arbitrary chunk headers and PCM data.
   * Useful for testing diverse WAV variations.
   */
  public static synthesizeWavBuffer(options: {
    sampleRate?: number;
    channels?: number;
    bitsPerSample?: number;
    durationSeconds?: number;
    frequency?: number;
    amplitude?: number; // 0.0 to 1.0
    extraChunks?: Array<{ id: string; data: Uint8Array }>;
    addClipping?: boolean;
    leadingSilenceSeconds?: number;
    trailingSilenceSeconds?: number;
  }): Uint8Array {
    const sampleRate = options.sampleRate || 22050;
    const channels = options.channels || 1;
    const bitsPerSample = options.bitsPerSample || 16;
    const duration = options.durationSeconds || 1.0;
    const freq = options.frequency || 440;
    const amp = options.amplitude !== undefined ? options.amplitude : 0.7;
    const leadingSilence = options.leadingSilenceSeconds || 0;
    const trailingSilence = options.trailingSilenceSeconds || 0;

    const totalDuration = leadingSilence + duration + trailingSilence;
    const numFrames = Math.floor(sampleRate * totalDuration);
    const bytesPerSample = bitsPerSample / 8;
    const dataSize = numFrames * channels * bytesPerSample;

    const pcmData = new Uint8Array(dataSize);
    const view = new DataView(pcmData.buffer);

    const maxVal = bitsPerSample === 16 ? 32767 : bitsPerSample === 24 ? 8388607 : 127;
    const activeStartFrame = Math.floor(leadingSilence * sampleRate);
    const activeEndFrame = activeStartFrame + Math.floor(duration * sampleRate);

    for (let frame = 0; frame < numFrames; frame++) {
      let val = 0;
      if (frame >= activeStartFrame && frame < activeEndFrame) {
        const t = (frame - activeStartFrame) / sampleRate;
        val = Math.sin(2 * Math.PI * freq * t) * amp;
        if (options.addClipping && frame % 10 === 0) {
          val = 1.0; // Force clipped samples
        }
      }

      for (let ch = 0; ch < channels; ch++) {
        const sampleIdx = frame * channels + ch;
        const byteOffset = sampleIdx * bytesPerSample;

        if (bitsPerSample === 16) {
          const intVal = Math.round(Math.max(-1.0, Math.min(1.0, val)) * maxVal);
          view.setInt16(byteOffset, intVal, true);
        } else if (bitsPerSample === 24) {
          const intVal = Math.round(Math.max(-1.0, Math.min(1.0, val)) * maxVal);
          pcmData[byteOffset] = intVal & 0xff;
          pcmData[byteOffset + 1] = (intVal >> 8) & 0xff;
          pcmData[byteOffset + 2] = (intVal >> 16) & 0xff;
        } else if (bitsPerSample === 8) {
          const uintVal = Math.round((val + 1.0) * 0.5 * 255);
          pcmData[byteOffset] = uintVal;
        }
      }
    }

    // Build RIFF container with chunks
    const fmtChunkSize = 16;
    const byteRate = sampleRate * channels * bytesPerSample;
    const blockAlign = channels * bytesPerSample;

    let extraSize = 0;
    if (options.extraChunks) {
      options.extraChunks.forEach(c => {
        const padded = c.data.length + (c.data.length % 2);
        extraSize += 8 + padded;
      });
    }

    const totalRiffSize = 4 + (8 + fmtChunkSize) + extraSize + (8 + dataSize);
    const totalBufferSize = 8 + totalRiffSize;

    const outBuffer = new Uint8Array(totalBufferSize);
    const outView = new DataView(outBuffer.buffer);

    // 'RIFF'
    outBuffer[0] = 0x52; outBuffer[1] = 0x49; outBuffer[2] = 0x46; outBuffer[3] = 0x46;
    outView.setUint32(4, totalRiffSize, true);
    // 'WAVE'
    outBuffer[8] = 0x57; outBuffer[9] = 0x41; outBuffer[10] = 0x56; outBuffer[11] = 0x45;

    let cursor = 12;

    // Optional leading extra chunks (e.g. JUNK)
    if (options.extraChunks) {
      options.extraChunks.forEach(c => {
        for (let i = 0; i < 4; i++) {
          outBuffer[cursor + i] = c.id.charCodeAt(i);
        }
        outView.setUint32(cursor + 4, c.data.length, true);
        outBuffer.set(c.data, cursor + 8);
        const padded = c.data.length + (c.data.length % 2);
        cursor += 8 + padded;
      });
    }

    // 'fmt ' chunk
    outBuffer[cursor] = 0x66; outBuffer[cursor + 1] = 0x6d; outBuffer[cursor + 2] = 0x74; outBuffer[cursor + 3] = 0x20;
    outView.setUint32(cursor + 4, fmtChunkSize, true);
    outView.setUint16(cursor + 8, 1, true); // PCM
    outView.setUint16(cursor + 10, channels, true);
    outView.setUint32(cursor + 12, sampleRate, true);
    outView.setUint32(cursor + 16, byteRate, true);
    outView.setUint16(cursor + 20, blockAlign, true);
    outView.setUint16(cursor + 22, bitsPerSample, true);
    cursor += 8 + fmtChunkSize;

    // 'data' chunk
    outBuffer[cursor] = 0x64; outBuffer[cursor + 1] = 0x61; outBuffer[cursor + 2] = 0x74; outBuffer[cursor + 3] = 0x61;
    outView.setUint32(cursor + 4, dataSize, true);
    outBuffer.set(pcmData, cursor + 8);

    return outBuffer;
  }
}
